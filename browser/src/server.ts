import * as readline from "readline";
import type { BrowserSession } from "./launcher.js";

/**
 * JSON-RPC server over stdin/stdout for programmatic browser control.
 *
 * Protocol: one JSON object per line (newline-delimited JSON).
 *
 * Request:  { "id": 1, "method": "navigate", "params": { "url": "..." } }
 * Response: { "id": 1, "result": { ... } }
 * Error:    { "id": 1, "error": { "message": "..." } }
 */
export async function startServer(session: BrowserSession): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  const respond = (id: number | string, result: unknown) => {
    process.stdout.write(JSON.stringify({ id, result }) + "\n");
  };

  const respondError = (id: number | string, message: string) => {
    process.stdout.write(JSON.stringify({ id, error: { message } }) + "\n");
  };

  rl.on("line", async (line) => {
    let req: { id: number | string; method: string; params?: Record<string, unknown> };

    try {
      req = JSON.parse(line);
    } catch {
      process.stderr.write("Invalid JSON\n");
      return;
    }

    try {
      const result = await handleMethod(session, req.method, req.params || {});
      respond(req.id, result);
    } catch (err) {
      respondError(req.id, err instanceof Error ? err.message : String(err));
    }
  });

  rl.on("close", async () => {
    await session.cleanup();
    process.exit(0);
  });

  // Keep alive
  await new Promise(() => {});
}

async function handleMethod(
  session: BrowserSession,
  method: string,
  params: Record<string, unknown>
): Promise<unknown> {
  const { page } = session;

  switch (method) {
    case "navigate": {
      const url = requireParam<string>(params, "url");
      await page.goto(url, { waitUntil: "domcontentloaded" });
      return { url: page.url(), title: await page.title() };
    }

    case "click": {
      const selector = requireParam<string>(params, "selector");
      await page.click(selector, {
        timeout: (params.timeout as number) || 5000,
      });
      return { clicked: selector };
    }

    case "type": {
      const selector = requireParam<string>(params, "selector");
      const text = requireParam<string>(params, "text");
      await page.fill(selector, text);
      return { typed: text, selector };
    }

    case "press": {
      const key = requireParam<string>(params, "key");
      await page.keyboard.press(key);
      return { pressed: key };
    }

    case "screenshot": {
      const path = (params.path as string) || undefined;
      const buffer = await page.screenshot({
        path,
        fullPage: (params.fullPage as boolean) || false,
      });
      return {
        path: path || null,
        size: buffer.length,
        base64: path ? undefined : buffer.toString("base64"),
      };
    }

    case "evaluate": {
      const expression = requireParam<string>(params, "expression");
      const result = await page.evaluate(expression);
      return { result };
    }

    case "content": {
      return { html: await page.content() };
    }

    case "url": {
      return { url: page.url(), title: await page.title() };
    }

    case "wait": {
      const selector = params.selector as string | undefined;
      const timeout = (params.timeout as number) || 5000;
      if (selector) {
        await page.waitForSelector(selector, { timeout });
        return { found: selector };
      }
      const ms = (params.ms as number) || 1000;
      await page.waitForTimeout(ms);
      return { waited: ms };
    }

    case "scroll": {
      const direction = (params.direction as string) || "down";
      const amount = (params.amount as number) || 500;
      const delta = direction === "up" ? -amount : amount;
      await page.mouse.wheel(0, delta);
      return { direction, amount };
    }

    case "cookies": {
      const cookies = await session.context.cookies();
      return { cookies, count: cookies.length };
    }

    case "close": {
      await session.cleanup();
      process.exit(0);
    }

    default:
      throw new Error(`Unknown method: ${method}`);
  }
}

function requireParam<T>(params: Record<string, unknown>, name: string): T {
  if (!(name in params)) {
    throw new Error(`Missing required parameter: ${name}`);
  }
  return params[name] as T;
}
