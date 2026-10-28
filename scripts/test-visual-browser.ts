import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Usage: bun scripts/test-visual-browser.ts /path/to/browser [chromium|firefox]
const executable = process.argv[2];
if (!executable) throw new Error("Pass a Chromium or Firefox executable path.");
const firefox = process.argv[3] === "firefox";
const build = await Bun.build({ entrypoints: ["tests/visual-mode/browser.ts"], target: "browser" });
if (!build.success) throw new AggregateError(build.logs, "Browser test bundle failed.");
const result = Promise.withResolvers<{ passed: string[]; failed: string[] }>();
const debug = Bun.serve({ hostname: "127.0.0.1", port: 0, fetch: () => new Response() });
const debugPort = debug.port;
debug.stop(true);
const connection: { socket: WebSocket | null } = { socket: null };
let id = 0;
const requests = new Map<number, { resolve: () => void; reject: (error: Error) => void }>();
const connect = async (): Promise<WebSocket> => {
  for (let attempt = 0; attempt < 100; attempt++) {
    const response = await fetch(`http://127.0.0.1:${debugPort}/json/list`).catch(() => null);
    const pages = response
      ? ((await response.json()) as Array<{
          type: string;
          url: string;
          webSocketDebuggerUrl: string;
        }>)
      : [];
    const page = pages.find((page) => page.type === "page" && page.url.startsWith(server.url.href));
    if (page) {
      const ws = new WebSocket(page.webSocketDebuggerUrl);
      await new Promise<void>((resolve, reject) => {
        ws.addEventListener("open", () => resolve(), { once: true });
        ws.addEventListener(
          "error",
          () => reject(new Error("Browser debugging connection failed.")),
          { once: true }
        );
      });
      ws.addEventListener("message", (event) => {
        const message = JSON.parse(String(event.data)) as {
          id: number;
          error?: { message: string };
        };
        const pending = requests.get(message.id);
        requests.delete(message.id);
        if (message.error) pending?.reject(new Error(message.error.message));
        else pending?.resolve();
      });
      return ws;
    }
    await Bun.sleep(25);
  }
  throw new Error("Browser debugging endpoint did not become available.");
};
const sendKey = async (event: KeyboardEventInit & { key: string }): Promise<void> => {
  connection.socket ??= await connect();
  const modifiers =
    (event.altKey ? 1 : 0) |
    (event.ctrlKey ? 2 : 0) |
    (event.metaKey ? 4 : 0) |
    (event.shiftKey ? 8 : 0);
  const codes: Record<string, number> = {
    Escape: 27,
    ArrowLeft: 37,
    ArrowUp: 38,
    ArrowRight: 39,
    ArrowDown: 40,
    Backspace: 8,
    Tab: 9,
    Enter: 13
  };
  const params = {
    key: event.key,
    modifiers,
    windowsVirtualKeyCode: codes[event.key] ?? event.key.toUpperCase().charCodeAt(0),
    code: event.code ?? (/^[a-z]$/i.test(event.key) ? `Key${event.key.toUpperCase()}` : event.key),
    autoRepeat: event.repeat ?? false
  };
  for (const type of ["keyDown", "keyUp"]) {
    const request = ++id;
    const done = new Promise<void>((resolve, reject) => requests.set(request, { resolve, reject }));
    connection.socket.send(
      JSON.stringify({
        id: request,
        method: "Input.dispatchKeyEvent",
        params: {
          ...params,
          type,
          text:
            type === "keyDown" &&
            event.key.length === 1 &&
            !event.ctrlKey &&
            !event.metaKey &&
            !event.altKey
              ? event.key
              : undefined,
          commands: type === "keyDown" && event.metaKey && event.key === "z" ? ["undo"] : undefined
        }
      })
    );
    await done;
  }
};
const server = Bun.serve({
  hostname: "127.0.0.1",
  port: 0,
  async fetch(request) {
    const path = new URL(request.url).pathname;
    if (path === "/suite.js") return new Response(build.outputs[0]);
    if (path === "/keys" && request.method === "POST" && !firefox) {
      const events: Array<KeyboardEventInit & { key: string }> = await request.json();
      for (const event of events) await sendKey(event);
      return new Response("ok");
    }
    if (path === "/result" && request.method === "POST") {
      result.resolve(await request.json());
      return new Response("ok");
    }
    return new Response(
      `<!doctype html><html data-browser="${firefox ? "firefox" : "chromium"}"><body><script type="module" src="/suite.js"></script></body></html>`,
      {
        headers: { "Content-Type": "text/html" }
      }
    );
  }
});
const profile = mkdtempSync(join(process.env.TMPDIR ?? tmpdir(), "nav-visual-browser-"));
const args = firefox
  ? ["--headless", "--no-remote", "--profile", profile]
  : [
      "--headless",
      "--disable-gpu",
      "--no-first-run",
      `--user-data-dir=${profile}`,
      `--remote-debugging-port=${debugPort}`
    ];
const child = Bun.spawn([executable, ...args, server.url.href], {
  stdout: "ignore",
  stderr: "ignore"
});
const timeout = setTimeout(() => result.reject(new Error("Browser tests timed out.")), 30000);
try {
  const report = await result.promise;
  console.log(JSON.stringify(report, null, 2));
  if (report.failed.length) process.exitCode = 1;
} finally {
  clearTimeout(timeout);
  connection.socket?.close();
  child.kill();
  await child.exited;
  server.stop(true);
  rmSync(profile, { recursive: true, force: true });
}