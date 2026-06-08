# Unauthorized Faculty Edit Test

## Objective

Verify that faculty members cannot modify marks for subjects that are not assigned to them.

## Test Steps

1. Login as Faculty.
2. Open Marks Entry.
3. Attempt to edit marks belonging to an unassigned subject.
4. Submit the update.

## Expected Result

The server rejects the operation and displays an authorization error.

## Actual Result

The update was blocked successfully.

Displayed message:

"Access denied: You are not assigned to this subject"

## Status

PASS ✅

## Evidence

See:

unauthorized-faculty-test.png