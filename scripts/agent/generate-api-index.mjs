import { listFiles, ok, readText, writeText } from "./lib.mjs";

const sourceFiles = listFiles(".").filter((file) => /\.(mjs|js|ts)$/.test(file) && !file.startsWith("research/"));
const exports = [];

for (const file of sourceFiles) {
  const content = readText(file);
  for (const match of content.matchAll(/export\s+(?:function|const|class)\s+([A-Za-z0-9_]+)/g)) {
    exports.push({ file, name: match[1] });
  }
}

const lines = [
  "# API Index",
  "",
  "> GENERATED FILE. Do not edit by hand. Run `npm run agent:generate`.",
  "",
  "## Current State",
  "",
  "This repository has no HTTP API. The index below lists exported JavaScript symbols from tracked source and script files.",
  "",
  "## Exports",
  "",
  ...(exports.length === 0 ? ["- None"] : exports.map((item) => `- \`${item.name}\` from \`${item.file}\``)),
  "",
];

writeText("docs/generated/api-index.md", lines.join("\n"));
ok("Generated API index.");
