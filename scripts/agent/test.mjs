import { run, ok, listFiles } from "./lib.mjs";

run("node", ["scripts/agent/architecture-check.mjs"]);
run("node", ["scripts/agent/check-docs.mjs"]);

const testFiles = listFiles("prototype").filter((file) => file.endsWith(".test.mjs"));
if (testFiles.length > 0) {
  run("node", ["--test", ...testFiles]);
}

ok("Harness tests passed.");
