import { readText, ok } from "./lib.mjs";

JSON.parse(readText("package.json"));
ok("Build placeholder passed. There is no runtime build until prototype tooling exists.");
console.log("NEXT: replace this with a real build when a bundler or static app is introduced.");
