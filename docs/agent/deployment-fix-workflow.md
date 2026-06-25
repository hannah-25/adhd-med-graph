# Deployment Fix Workflow

1. Confirm the deployment target.
2. Read [../engineering/deployment-rules.md](../engineering/deployment-rules.md).
3. Reproduce the failure from logs or CI output.
4. Keep production-impacting commands explicit and documented.
5. Update rollback steps.
6. Run `npm run agent:verify`.
