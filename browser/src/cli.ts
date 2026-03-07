#!/usr/bin/env node

import { launch } from "./launcher.js";
import { startServer } from "./server.js";
import { discoverProfiles } from "./profiles/index.js";
import { extractCookies } from "./cookies.js";

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "--help") {
    printUsage();
    process.exit(0);
  }

  switch (command) {
    case "launch":
      return cmdLaunch(args.slice(1));
    case "scrape":
      return cmdScrape(args.slice(1));
    case "profiles":
      return cmdProfiles();
    case "cookies":
      return cmdCookies(args.slice(1));
    default:
      console.error(`Unknown command: ${command}`);
      printUsage();
      process.exit(1);
  }
}

function printUsage() {
  console.log(`bb-browser - Browser automation with real auth

Commands:
  launch    Launch browser (persistent session by default)
  scrape    Scrape a URL headless (no window popup)
  profiles  List discovered browser profiles
  cookies   Show extracted cookies (for debugging)

Launch options:
  --browser <name>   Browser for cookie fallback (default: chrome)
  --headless         Run in background (no visible window)
  --url <url>        Navigate to URL after launch
  --domain <domain>  Only extract cookies for this domain
  --server           Start JSON-RPC server mode (stdin/stdout)
  --no-persistent    Use cookie injection instead of persistent profile

Scrape options:
  --url <url>        URL to scrape (required)
  --browser <name>   Browser for cookie fallback (default: chrome)
  --wait <ms>        Wait ms after page load (default: 2000)
  --html             Return full HTML instead of text
  --no-persistent    Use cookie injection instead of persistent profile

Auth:
  First run opens a visible browser for manual login.
  After that, sessions persist across runs (headless works).
  Profile stored in ~/.bb-browser-profile

Examples:
  bb web launch --url https://linkedin.com/feed   # first run: log in manually
  bb web scrape https://linkedin.com/feed         # headless, uses saved session
  bb web launch --headless --server               # JSON-RPC mode
  bb web scrape https://github.com --no-persistent  # legacy cookie injection`);
}

async function cmdLaunch(args: string[]) {
  const browser = getFlag(args, "--browser") || "chrome";
  const headless = args.includes("--headless");
  const url = getFlag(args, "--url");
  const domain = getFlag(args, "--domain");
  const serverMode = args.includes("--server");
  const persistent = !args.includes("--no-persistent");
  const site = getFlag(args, "--site") || undefined;

  const session = await launch({
    browser,
    headless,
    url: url || undefined,
    domains: domain ? [domain] : undefined,
    persistent,
    site,
  });

  const profileName = session.profile?.name || site || (persistent ? "persistent" : "custom");
  const { cookieStats } = session;

  if (serverMode) {
    process.stdout.write(
      JSON.stringify({
        ready: true,
        profile: profileName,
        cookies: {
          injected: cookieStats.injected,
          total: cookieStats.total,
          skipped: cookieStats.skipped,
        },
        url: session.page.url(),
      }) + "\n"
    );
    await startServer(session);
  } else {
    console.log(
      JSON.stringify(
        {
          profile: profileName,
          cookies: {
            injected: cookieStats.injected,
            total: cookieStats.total,
            skipped: cookieStats.skipped,
            ...(cookieStats.errors.length > 0
              ? { errors: cookieStats.errors }
              : {}),
          },
          url: session.page.url(),
          pid: process.pid,
          hint: "Browser is running. Press Ctrl+C to close.",
        },
        null,
        2
      )
    );

    // Keep alive until Ctrl+C
    process.on("SIGINT", async () => {
      console.log("\nClosing browser...");
      await session.cleanup();
      process.exit(0);
    });
    process.on("SIGTERM", async () => {
      await session.cleanup();
      process.exit(0);
    });
    await new Promise(() => {});
  }
}

async function cmdScrape(args: string[]) {
  const url = getFlag(args, "--url");
  if (!url) {
    console.error("Error: --url is required");
    process.exit(1);
  }

  const browser = getFlag(args, "--browser") || "chrome";
  const waitMs = parseInt(getFlag(args, "--wait") || "2000", 10);
  const html = args.includes("--html");
  const persistent = !args.includes("--no-persistent");
  const site = getFlag(args, "--site") || undefined;

  const session = await launch({
    browser,
    headless: true,
    url,
    persistent,
    site,
  });

  try {
    // wait for dynamic content to load
    if (waitMs > 0) {
      await session.page.waitForTimeout(waitMs);
    }

    let content: string;
    if (html) {
      content = await session.page.content();
    } else {
      content = await session.page.evaluate(() => {
        // remove script/style/nav/header/footer noise
        const remove = document.querySelectorAll("script, style, noscript, svg, img, link, meta");
        remove.forEach((el) => el.remove());
        return document.body?.innerText || "";
      });
    }

    console.log(
      JSON.stringify(
        {
          url: session.page.url(),
          title: await session.page.title(),
          content,
        },
        null,
        2
      )
    );
  } finally {
    await session.cleanup();
  }
}

function cmdProfiles() {
  const profiles = discoverProfiles();
  if (profiles.length === 0) {
    console.log("No browser profiles found.");
    return;
  }
  console.log(JSON.stringify(profiles, null, 2));
}

async function cmdCookies(args: string[]) {
  const browser = getFlag(args, "--browser") || "chrome";
  const domain = getFlag(args, "--domain");

  const { findProfile } = await import("./profiles/index.js");
  const profile = findProfile(browser);

  if (!profile) {
    console.error(`No ${browser} profile found.`);
    process.exit(1);
  }

  const cookies = extractCookies(
    profile.cookiesPath,
    profile.browser,
    domain || undefined
  );

  console.log(
    JSON.stringify(
      {
        profile: profile.name,
        count: cookies.length,
        cookies: domain
          ? cookies
          : cookies.slice(0, 20).map((c) => ({
              name: c.name,
              domain: c.domain,
              secure: c.secure,
            })),
        ...(domain ? {} : { note: "Showing first 20. Use --domain to filter." }),
      },
      null,
      2
    )
  );
}

function getFlag(args: string[], flag: string): string | null {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return null;
  return args[idx + 1];
}

main().catch((err) => {
  const msg = err instanceof Error ? err.message : String(err);

  // Map known errors to specific exit codes
  if (msg.includes("profile found")) {
    console.error(`Error: ${msg}`);
    console.error("Available profiles:");
    for (const p of discoverProfiles()) {
      console.error(`  ${p.name} (${p.profileDir})`);
    }
    process.exit(2);
  }

  if (msg.includes("Executable doesn't exist") || msg.includes("browserType.launch")) {
    console.error(
      `Error: Chrome not found. Install Google Chrome or run: npx playwright install chromium`
    );
    process.exit(3);
  }

  if (msg.includes("Keychain") || msg.includes("security find-generic-password")) {
    console.error(
      `Error: Could not access keychain to decrypt cookies. You may need to allow access in the system prompt.`
    );
    process.exit(4);
  }

  console.error(`Error: ${msg}`);
  process.exit(1);
});
