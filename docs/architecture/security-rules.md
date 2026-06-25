# Security Rules

## Current Authentication

There is no authentication layer in this repository.

ASSUMPTION: Authentication and authorization belong to future Attune integration work.

## Secret Management

- Never commit secrets, tokens, API keys, cookies, or production URLs.
- Use `.env.example` for variable names only.
- Keep `.env` and `.env.*` ignored, except `.env.example`.

## Privacy

- Do not commit personal health data.
- Do not use real user medication schedules as fixtures.
- Prefer synthetic examples.
- Mask logs if future tools print medication or user identifiers.

## Web Risks For Future Prototype

- Avoid inline user-generated HTML.
- Treat URL/query input as untrusted.
- Keep CORS/CSRF decisions in the server/API layer if an API is added.
- Validate numeric dose/time inputs before graph calculation.

## API Authentication Matrix

Current repository: no APIs.

Future Attune APIs must document whether each endpoint is public, authenticated-user, admin, or service-only.
