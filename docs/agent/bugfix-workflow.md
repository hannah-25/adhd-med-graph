# Bugfix Workflow

1. Reproduce or precisely describe the bug.
2. Identify the smallest affected module.
3. Add a regression test or harness check if possible.
4. Fix the cause, not only the symptom.
5. Verify existing behavior is preserved.
6. Run `npm run agent:verify`.
7. Update docs if behavior, commands, or assumptions changed.
