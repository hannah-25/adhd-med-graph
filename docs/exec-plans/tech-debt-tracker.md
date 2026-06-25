# Tech Debt Tracker

Track debt as explicit, reviewable items.

| ID | Area | Debt | Impact | Owner | Target | Status |
| --- | --- | --- | --- | --- | --- | --- |
| TD-001 | Testing | No model tests yet because prototype modules do not exist. | Future model changes cannot be regression-tested. | TBD | After `prototype/` exists | Open |
| TD-002 | Tooling | No formatter/linter dependency yet. | Style drift is possible once code grows. | TBD | Add with first substantial JS implementation | Open |
| TD-003 | Architecture | Architecture checks are custom and lightweight. | More nuanced import rules are not enforced yet. | TBD | Add ESLint/dependency-cruiser when modules exist | Open |
| TD-004 | Docs | Existing root docs are concise but not fully integrated with generated maps yet. | Agents may miss older docs if they skip `docs/README.md`. | TBD | Keep map generated in CI | Open |
| TD-005 | CI | No package lock file is tracked yet. | CI uses `npm install` instead of deterministic `npm ci`. | TBD | Add lock file when dependencies are introduced | Open |

Use `TODO(owner, YYYY-MM-DD, reason)` inside docs for localized issues.
