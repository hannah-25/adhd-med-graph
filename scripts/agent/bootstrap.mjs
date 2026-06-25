import { ok } from "./lib.mjs";

ok(`Node ${process.version} is available.`);
ok("No package dependencies are currently required.");
console.log("NEXT: run `npm run agent:verify` before making or handing off changes.");
