# Data Rules

## Model Data

Medication profile data must be separate from user-specific dose events.

Recommended shapes:

```js
{
  id: "concerta-oros",
  genericName: "methylphenidate",
  halfLifeHours: 3.5,
  releaseProfile: "oros-dual"
}
```

```js
{
  medicationId: "concerta-oros",
  amountMg: 18,
  takenAtHour: 6.5,
  source: "scheduled"
}
```

## Privacy

Do not commit personal health data, real user schedules, exported logs, or identifying medication records.

## Generated Schema Docs

Run `npm run agent:generate` to update [../generated/data-schema.md](../generated/data-schema.md).
