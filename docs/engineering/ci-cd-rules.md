# CI/CD Rules

## CI

GitHub Actions runs:

```bash
npm install
npm run agent:verify
```

Current checks are lightweight and dependency-free. `npm install` is used because the repository does not currently track a package lock file.

## Required Checks

- docs links are valid,
- architecture rules pass,
- generated docs can be regenerated,
- package metadata is valid.

## Future Checks

When implementation exists, add:

- formatter check,
- ESLint,
- type check,
- unit tests,
- browser smoke tests,
- dependency/license audit.
