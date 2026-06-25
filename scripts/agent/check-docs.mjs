import path from "node:path";
import { fail, fromRoot, listFiles, ok, pathExists, readText } from "./lib.mjs";

const markdownFiles = listFiles(".").filter((file) => file.endsWith(".md"));
const linkPattern = /(?<!!)\[[^\]]+\]\(([^)]+)\)/g;
let failures = 0;

for (const file of markdownFiles) {
  const content = readText(file);
  const dir = path.dirname(file);
  for (const match of content.matchAll(linkPattern)) {
    const rawTarget = match[1].trim();
    if (!rawTarget || rawTarget.startsWith("#")) continue;
    if (/^(https?:|mailto:)/.test(rawTarget)) continue;

    const targetWithoutAnchor = rawTarget.split("#")[0];
    if (!targetWithoutAnchor) continue;
    const decoded = decodeURIComponent(targetWithoutAnchor);
    const targetPath = path.normalize(path.join(fromRoot(dir), decoded));
    if (!targetPath.startsWith(fromRoot("."))) {
      fail(`${file} links outside repository: ${rawTarget}`, "Use repository-local relative links.");
      failures += 1;
      continue;
    }
    if (!pathExists(path.relative(fromRoot("."), targetPath))) {
      fail(`${file} has broken link: ${rawTarget}`, "Fix the relative link or create the target document.");
      failures += 1;
    }
  }

  const badTodo = content.match(/TODO(?!\([^)]+,\s*(?:\d{4}-\d{2}-\d{2}|YYYY-MM-DD),\s*[^)]+\))/);
  if (badTodo) {
    fail(`${file} has TODO without required owner/date/reason format.`, "Use TODO(owner, YYYY-MM-DD, reason).");
    failures += 1;
  }
}

if (failures === 0) {
  ok(`Checked ${markdownFiles.length} markdown files.`);
}
