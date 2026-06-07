# debrief.md — Prompt-to-Production Note

## 1. Which AI output misled you most?

When asked to scaffold the optimistic concurrency logic, Claude initially suggested using MongoDB's `findOneAndUpdate` with a `{ version: clientVersion }` filter — treating a missed update as a silent no-op (zero documents modified). This is incorrect for this use case: a no-op update gives no feedback to the caller, so the UI can never distinguish between "record not found" and "version conflict." The correct approach is to fetch the document first, compare versions explicitly, and return a structured 409 response with conflict metadata.

## 2. How did you identify the issue?

When writing the test `'concurrent update with stale version returns 409'`, the test expected a 409 status but the initial implementation returned 200 (the `findOneAndUpdate` simply matched zero documents and returned null, which my route then treated as a 404). Reading the assignment requirement carefully — *"Show options for Accept Latest, Overwrite Mine, or Manual Merge"* — made it clear a rich 409 body was required, not a silent miss.

## 3. What did you verify manually?

- Ran the concurrency test in isolation and confirmed the 409 body includes `yourVersion`, `currentVersion`, `currentData`, and all three `options`.  
- Checked the faculty tripwire by calling `POST /marks` with a faculty token against an unassigned subject, confirmed HTTP 403 with the message `"You are not assigned to this subject. Cannot edit marks."`.  
- Verified the grade calculator independently: `calculateMarks(10, 15, 40, 60)` returns `{ total: 25, grade: 'F' }` (25% → F), and that a client-submitted `grade: 'O'` field is ignored entirely.  
- Confirmed bulk CSV idempotency by uploading `sample_marks.csv` twice and asserting `skipped === created` on the second run.

## 4. What would you improve given another day?

- **Rate limiting**: add `express-rate-limit` per IP and per user to prevent mark-spam.
- **Pagination cursor**: replace skip/limit with cursor-based pagination for large student lists.
- **Prometheus metrics**: swap the in-memory metrics store for `prom-client` and expose a `/metrics` endpoint in Prometheus text format.
- **Refresh tokens**: the current JWT has no refresh mechanism; long sessions will expire and force re-login.
- **Transaction support**: the bulk CSV import currently commits row-by-row. A MongoDB multi-document transaction would allow atomic all-or-nothing imports.
- **WebSocket notifications**: when a faculty member's mark entry is concurrently updated, notify the other open session in real time instead of waiting for their next save attempt.
