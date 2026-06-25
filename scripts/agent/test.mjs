import { run, ok } from "./lib.mjs";

run("node", ["scripts/agent/architecture-check.mjs"]);
run("node", ["scripts/agent/check-docs.mjs"]);
ok("Harness tests passed.");
