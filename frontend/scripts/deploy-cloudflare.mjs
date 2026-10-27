import { spawn } from "node:child_process";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
if (!apiBase.startsWith("https://") || apiBase.endsWith("/")) {
  console.error(
    "Set NEXT_PUBLIC_API_BASE_URL to the https API origin with no trailing slash before deploy.",
  );
  process.exit(1);
}

const child = spawn(
  "vinext-cloudflare",
  ["deploy", "--config", "dist/server/wrangler.json"],
  { stdio: "inherit", env: process.env },
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
