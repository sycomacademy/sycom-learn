#!/usr/bin/env bun
/**
 * Cursor `afterFileEdit` hook: run oxfmt on the edited file (same as `bun run check` formatting).
 * stdin: { "file_path": "<absolute path>", "edits": [...] }
 * stdout: JSON (empty object)
 */
import { existsSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const input = (await Bun.stdin.json()) as { file_path?: string };
const filePath = input.file_path;

if (!filePath || !existsSync(filePath)) {
  console.log("{}");
  process.exit(0);
}

const hookDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(join(hookDir, "..", ".."));
const resolvedFile = resolve(filePath);
const rel = relative(root, resolvedFile);
if (rel.startsWith("..")) {
  console.log("{}");
  process.exit(0);
}

const oxfmtName = process.platform === "win32" ? "oxfmt.cmd" : "oxfmt";
const localOxfmt = join(root, "node_modules", ".bin", oxfmtName);
const cmd = existsSync(localOxfmt) ? localOxfmt : "oxfmt";

const proc = Bun.spawn([cmd, "--write", resolvedFile], {
  cwd: root,
  stdout: "ignore",
  stderr: "ignore",
});

const code = await proc.exited;
if (code !== 0 && cmd !== "oxfmt") {
  await Bun.spawn(["oxfmt", "--write", resolvedFile], {
    cwd: root,
    stdout: "ignore",
    stderr: "ignore",
  }).exited;
}

console.log("{}");
process.exit(0);
