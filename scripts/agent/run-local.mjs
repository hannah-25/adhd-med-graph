import { pathExists, ok } from "./lib.mjs";

if (pathExists("prototype/concentration-demo.html")) {
  ok("Local prototype exists at prototype/concentration-demo.html.");
  console.log("NEXT: open that file in a browser, or add a dev server when module loading requires it.");
} else {
  ok("No runnable local app exists yet.");
  console.log("NEXT: implement prototype/concentration-demo.html as described in docs/architecture/system-overview.md.");
}
