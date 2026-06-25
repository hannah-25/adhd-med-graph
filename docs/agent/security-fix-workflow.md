# Security Fix Workflow

1. Identify affected data, credentials, or access boundary.
2. Avoid printing secrets in logs or docs.
3. Patch the smallest vulnerable surface.
4. Add a regression check when possible.
5. Update [../quality/security.md](../quality/security.md) and [../architecture/security-rules.md](../architecture/security-rules.md).
6. Run `npm run agent:verify`.
