# API Rules

## Current State

There is no API in this repository.

## Future Attune API Rules

ASSUMPTION: Future API work will happen in Attune repositories, not here.

Before API implementation:

- write an execution plan,
- document request/response models,
- separate internal model types from external API response types,
- define authentication requirements per endpoint,
- define migration and rollback implications.

## Compatibility

Graph model changes must describe whether existing stored medication schedules can still be interpreted.
