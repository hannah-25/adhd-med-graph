import { listFiles, ok, readText, writeText } from "./lib.mjs";

const files = listFiles(".");
const packageJson = JSON.parse(readText("package.json"));

const projectMap = [
  "# Project Map",
  "",
  "> GENERATED FILE. Do not edit by hand. Run `npm run agent:generate`.",
  "",
  `Package: \`${packageJson.name}\``,
  "",
  "## Files",
  "",
  ...files.map((file) => `- \`${file}\``),
  "",
].join("\n");

const dependencyMap = [
  "# Dependency Map",
  "",
  "> GENERATED FILE. Do not edit by hand. Run `npm run agent:generate`.",
  "",
  "## Package",
  "",
  `- name: \`${packageJson.name}\``,
  `- version: \`${packageJson.version}\``,
  `- type: \`${packageJson.type ?? "commonjs"}\``,
  "",
  "## Dependencies",
  "",
  ...dependencyLines(packageJson.dependencies),
  "",
  "## Dev Dependencies",
  "",
  ...dependencyLines(packageJson.devDependencies),
  "",
  "## Scripts",
  "",
  ...Object.entries(packageJson.scripts ?? {}).map(([name, command]) => `- \`${name}\`: \`${command}\``),
  "",
].join("\n");

writeText("docs/generated/project-map.md", projectMap);
writeText("docs/generated/dependency-map.md", dependencyMap);
ok("Generated project and dependency maps.");

function dependencyLines(dependencies) {
  const entries = Object.entries(dependencies ?? {});
  if (entries.length === 0) return ["- None"];
  return entries.map(([name, version]) => `- \`${name}\`: \`${version}\``);
}
