# Security

## Current Security Model

This repository has no runtime authentication, authorization, session, token, or cookie system.

## Secret Handling

- Use `.env.example` for variable names only.
- Do not commit `.env` or `.env.*`.
- Do not paste API keys, cookies, tokens, production DB URLs, or user exports into docs.

## Privacy

- Use synthetic medication schedules in examples and tests.
- Do not store personal health information in fixtures.
- Avoid logs that identify a person or a real medication routine.

## Future Web Risks

- XSS: do not render untrusted strings as HTML.
- CSRF: define server-side policy if APIs are added.
- CORS: keep explicit allowlists if APIs are added.
- Injection: validate all future persistence/query inputs.
- File upload: no upload feature exists; add a threat model before introducing one.

## Authorization

No admin/user roles exist here. Future Attune work must document role boundaries and disabled/deleted account behavior.

## CI Connection

Current CI runs `npm run agent:verify`, including docs and architecture checks. Add dependency audit and secret scanning when dependencies or deployment credentials are introduced.
