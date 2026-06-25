import fs from "node:fs";
import path from "node:path";
import { fail, fromRoot, listFiles, ok, pathExists, readText } from "./lib.mjs";

const packageJson = JSON.parse(readText("package.json"));
if (packageJson.name !== "adhd-med-graph") {
  fail("package.json name must remain adhd-med-graph.", "Update package.json only if the repository identity intentionally changed.");
}

const requiredHarnessFiles = [
  "AGENTS.md",
  "ARCHITECTURE.md",
  "docs/README.md",
  "docs/agent/agent-workflow.md",
  "docs/exec-plans/template.md",
  "docs/exec-plans/active/.gitkeep",
  "docs/exec-plans/completed/.gitkeep",
  ".env.example",
];

for (const file of requiredHarnessFiles) {
  if (!pathExists(file)) {
    fail(`Required harness file is missing: ${file}`, "Restore the harness structure or update architecture-check.mjs with the new intentional path.");
  }
}

for (const oldRootFile of ["app.js", "index.html", "styles.css"]) {
  if (pathExists(oldRootFile)) {
    fail(`${oldRootFile} should not live at repository root.`, "Keep the old demo in research/open-source or put new prototype files under prototype/.");
  }
}

const gitignore = readText(".gitignore");
if (!gitignore.includes("research/open-source/*")) {
  fail("research/open-source/* must stay ignored.", "Restore the ignore rule to keep reference source out of tracked code.");
}
if (!gitignore.includes(".env")) {
  fail(".env must be ignored.", "Restore secret-related ignore rules.");
}

const trackedSecretLikeFiles = listFiles(".")
  .filter((file) => /^\.env(\..+)?$/.test(file))
  .filter((file) => file !== ".env.example");
if (trackedSecretLikeFiles.length > 0) {
  fail(`Secret-like environment files are present: ${trackedSecretLikeFiles.join(", ")}`, "Remove these files from tracked workspace and keep only .env.example.");
}

const generatedFiles = listFiles("docs/generated").filter((file) => file.endsWith(".md"));
for (const file of generatedFiles) {
  const content = readText(file);
  if (!content.includes("GENERATED FILE")) {
    fail(`${file} is missing the generated-file notice.`, "Regenerate docs with `npm run agent:generate`.");
  }
}

const forbiddenImports = listFiles(".")
  .filter((file) => /\.(mjs|js|ts|tsx|jsx|html)$/.test(file))
  .filter((file) => !file.startsWith("research/"))
  .filter((file) => !file.startsWith("scripts/agent/"))
  .filter((file) => {
    const content = readText(file);
    return content.includes("research/open-source");
  });

if (forbiddenImports.length > 0) {
  fail(`Tracked source references research/open-source: ${forbiddenImports.join(", ")}`, "Keep reference source isolated and document findings instead.");
}

const pureModelFiles = [
  "prototype/pharmacokinetics.js",
  "prototype/concentration-series.js",
];
const forbiddenModelTokens = ["document.", "window.", "localStorage", "canvas", "getElementById", "querySelector", "fetch("];
for (const file of pureModelFiles) {
  const absolute = fromRoot(file);
  if (!fs.existsSync(absolute)) continue;
  const content = fs.readFileSync(absolute, "utf8");
  const hits = forbiddenModelTokens.filter((token) => content.includes(token));
  if (hits.length > 0) {
    fail(`${file} contains UI/IO tokens: ${hits.join(", ")}`, "Move UI, browser storage, or network logic out of pure model modules.");
  }
}

if (pathExists("prototype")) {
  const prototypeFiles = listFiles("prototype");
  const hasExpectedModel = ["pk-profiles.js", "dose-events.js", "pharmacokinetics.js", "concentration-series.js"]
    .some((name) => prototypeFiles.includes(`prototype/${name}`));
  if (!hasExpectedModel) {
    fail("prototype/ exists but expected model modules are missing.", "Follow docs/architecture/system-overview.md or update the architecture docs.");
  }
}

ok("Architecture checks passed.");
