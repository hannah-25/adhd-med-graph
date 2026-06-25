# Observability

## Local Logs

Current scripts print check names and next actions directly to the console.

## Future Prototype

When a local app exists, document:

- how to start it,
- where browser console errors appear,
- how to reproduce graph inputs,
- how to compare expected and actual model output.

## Health Checks

Current health check:

```bash
npm run agent:verify
```

Future local health checks should include app load and basic graph rendering.
