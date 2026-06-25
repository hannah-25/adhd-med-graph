# Reliability

## Current Health Check

```bash
npm run agent:verify
```

## Debugging Guide

### Test Failure Logs

- Check the first failing script name.
- Read the printed next action.
- Re-run the narrow command, for example `npm run agent:check-docs`.

### Local App Health

No local app exists yet. When `prototype/concentration-demo.html` exists, document how to open or serve it here.

### Database, Cache, Queue, External Services

No database, cache, queue, or external service exists in this repository.

### Authentication Failures

No authentication layer exists here. Future Attune auth failures must be debugged in the Attune repository.

### API Failures

No API exists here. Future API failures require endpoint docs and request/response examples.

### Deployment Failures

No deployment exists here. CI failure is the only current operational signal.

### Performance Issues

Future performance checks should separate model calculation time from chart rendering time.
