import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export function fromRoot(...parts) {
  return path.join(rootDir, ...parts);
}

export function pathExists(filePath) {
  return fs.existsSync(fromRoot(filePath));
}

export function readText(filePath) {
  return fs.readFileSync(fromRoot(filePath), "utf8");
}

export function writeText(filePath, content) {
  const absolute = fromRoot(filePath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, content, "utf8");
}

export function listFiles(dir = ".", options = {}) {
  const {
    includeDirs = false,
    exclude = defaultExcludes,
  } = options;
  const results = [];
  const start = fromRoot(dir);

  function walk(current) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      const relative = path.relative(rootDir, absolute).replaceAll("\\", "/");
      if (exclude.some((pattern) => relative === pattern || relative.startsWith(`${pattern}/`))) {
        continue;
      }
      if (entry.isDirectory()) {
        if (includeDirs) results.push(`${relative}/`);
        walk(absolute);
      } else {
        results.push(relative);
      }
    }
  }

  if (fs.existsSync(start)) walk(start);
  return results.sort();
}

export function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    if (result.error) {
      throw result.error;
    }
    throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status}`);
  }
}

export function fail(message, nextAction) {
  console.error(`FAIL: ${message}`);
  if (nextAction) console.error(`NEXT: ${nextAction}`);
  process.exitCode = 1;
}

export function ok(message) {
  console.log(`OK: ${message}`);
}

const defaultExcludes = [
  ".git",
  ".idea",
  "node_modules",
  "coverage",
  "dist",
  "research/open-source",
];
