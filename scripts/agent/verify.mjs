import { run, ok } from "./lib.mjs";

run("node", ["scripts/agent/generate-project-map.mjs"]);
run("node", ["scripts/agent/generate-api-index.mjs"]);
run("node", ["scripts/agent/generate-data-schema.mjs"]);
run("node", ["scripts/agent/architecture-check.mjs"]);
run("node", ["scripts/agent/check-docs.mjs"]);
run("node", ["scripts/agent/build.mjs"]);
ok("Agent verification passed.");
