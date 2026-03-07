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
  launch    Launch browser with cookies from your real browser
  profiles  List discovered browser profiles
  cookies   Show extracted cookies (for debugging)

Launch options:
  --browser <name>   Browser to use: chrome, arc, brave, edge (default: chrome)
  --headless         Run in background (no visible window)
  --url <url>        Navigate to URL after launch
  --domain <domain>  Only extract cookies for this domain
  --server           Start JSON-RPC server mode (stdin/stdout)

Examples:
  bb-browser launch --browser chrome --url https://github.com
  bb-browser launch --browser arc --headless --server
  bb-browser profiles
  bb-browser cookies --browser chrome --domain github.com`);
}

async function cmdLaunch(args: string[]) {
  const browser = getFlag(args, "--browser") || "chrome";
  const headless = args.includes("--headless");
  const url = getFlag(args, "--url");
  const domain = getFlag(args, "--domain");
  const serverMode = args.includes("--server");

  const session = await launch({
    browser,
    headless,
    url: url || undefined,
    domains: domain ? [domain] : undefined,
  });

  const profileName = session.profile?.name || "custom";
  const cookieCount = (await session.context.cookies()).length;

  if (serverMode) {
    // In server mode, emit ready signal then listen for commands
    process.stdout.write(
      JSON.stringify({
        ready: true,
        profile: profileName,
        cookies: cookieCount,
        url: session.page.url(),
      }) + "\n"
    );
    await startServer(session);
  } else {
    // Interactive mode: print info and keep browser open
    console.log(
      JSON.stringify(
        {
          profile: profileName,
          cookies: cookieCount,
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
  console.error("Error:", err.message);
  process.exit(1);
});
