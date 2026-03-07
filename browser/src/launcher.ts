import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import { extractCookies } from "./cookies.js";
import { findProfile, type BrowserProfile } from "./profiles/index.js";

export interface LaunchOptions {
  /** Browser to steal cookies from: chrome, arc, brave, edge */
  browser: string;
  /** Run headless (background mode) */
  headless: boolean;
  /** Initial URL to navigate to */
  url?: string;
  /** Only extract cookies for these domains */
  domains?: string[];
  /** Custom user data dir (skip profile discovery) */
  userDataDir?: string;
}

export interface BrowserSession {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  profile: BrowserProfile | null;
  cleanup: () => Promise<void>;
}

/**
 * Launch a browser with cookies extracted from the user's real browser.
 *
 * Uses Playwright with the real Chrome binary (`channel: "chrome"`)
 * so it looks like a normal Chrome window — no automation flags,
 * no "Chrome is being controlled by automated test software" banner.
 */
export async function launch(options: LaunchOptions): Promise<BrowserSession> {
  const profile = options.userDataDir
    ? null
    : findProfile(options.browser);

  if (!profile && !options.userDataDir) {
    throw new Error(
      `No ${options.browser} profile found. Is ${options.browser} installed?`
    );
  }

  // Create isolated user data dir so we don't conflict with the running browser
  const tmpDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "bb-browser-")
  );

  // Launch with real Chrome binary for stealth
  const browser = await chromium.launch({
    channel: "chrome",
    headless: options.headless,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--no-first-run",
      "--no-default-browser-check",
    ],
  });

  const context = await browser.newContext({
    userAgent: getRealisticUserAgent(),
    viewport: { width: 1440, height: 900 },
    locale: Intl.DateTimeFormat().resolvedOptions().locale,
    timezoneId: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  // Inject cookies from real browser
  if (profile) {
    const domains = options.domains;
    const cookies = extractCookies(
      profile.cookiesPath,
      profile.browser,
      domains ? domains[0] : undefined
    );

    if (cookies.length > 0) {
      // Add cookies in batches, skipping any that Playwright rejects
      const batchSize = 50;
      for (let i = 0; i < cookies.length; i += batchSize) {
        const batch = cookies.slice(i, i + batchSize);
        try {
          await context.addCookies(batch);
        } catch {
          // Fall back to adding one by one, skipping failures
          for (const cookie of batch) {
            try {
              await context.addCookies([cookie]);
            } catch {
              // Skip invalid cookie silently
            }
          }
        }
      }
    }
  }

  // Remove webdriver flag
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => false,
    });
  });

  const page = await context.newPage();

  if (options.url) {
    await page.goto(options.url, { waitUntil: "domcontentloaded" });
  }

  return {
    browser,
    context,
    page,
    profile,
    cleanup: async () => {
      await context.close();
      await browser.close();
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch {}
    },
  };
}

function getRealisticUserAgent(): string {
  const platform = os.platform();
  const arch = os.arch();

  if (platform === "darwin") {
    const macVersion = os.release().split(".")[0];
    const macOSVersion = parseInt(macVersion) >= 24 ? "15_0" : "14_0";
    return `Mozilla/5.0 (Macintosh; Intel Mac OS X ${macOSVersion}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36`;
  }

  if (platform === "win32") {
    return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
  }

  return "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
}
