# Concurrency Conflict Test

## Objective

Verify that optimistic concurrency control prevents accidental overwriting of records modified by another user.

## Test Steps

1. Open a mark entry record.
2. Simulate an update from another user.
3. Attempt to save changes using an outdated version.
4. Observe conflict detection behavior.

## Expected Result

The system detects the version mismatch and prevents silent overwriting.

Users should be offered conflict resolution options.

## Actual Result

The system detected a version conflict and displayed a conflict resolution dialog.

Available actions:

- Accept Latest
- Overwrite with Mine
- Edit & Merge

## Status

PASS ✅

## Evidence

See:

concurrency-test.png