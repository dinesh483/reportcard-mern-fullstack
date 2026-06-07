# AI Audit Log

## Summary Table

| # | Task | AI Used | Accepted | Modified | Rejected | Why |
|---|---|---|---|---|---|---|
| 1 | Scaffold Express app structure (routes, middleware, models) | Claude | Yes | Minor | — | Clean separation, matched Python original |
| 2 | Implement optimistic concurrency with `findOneAndUpdate` filter | Claude | No | Yes — rewrote to explicit fetch + compare | — | AI used silent no-op pattern; requirement needs rich 409 response |
| 3 | Grade calculator logic and grade bands | Claude | Yes | No | — | Matched assignment spec exactly |
| 4 | Bulk CSV import with idempotency | Claude | Yes | Minor (added faculty tripwire inside import) | — | AI forgot to apply the assignment tripwire to CSV path |
| 5 | JWT auth middleware and role guards | Claude | Yes | No | — | Correct pattern, no issues |
| 6 | In-memory metrics store with p95 latency | Claude | Yes | Minor (added `startTimer()` helper) | — | Logic correct, API slightly improved |
| 7 | MongoDB model schemas | Claude | Yes | Added `version` field to MarkEntry | — | AI omitted the concurrency version field initially |
| 8 | Test setup using `mongodb-memory-server` | Claude | Yes | No | — | Standard pattern, worked correctly |
| 9 | Winston structured audit logging | Claude | Yes | No | — | Output format matched requirement |
| 10 | `debrief.md` content | Claude | Partial | Added real issues found during testing | — | AI draft was too generic; replaced with actual bugs encountered |

---

## Prompt Receipts

### Receipt 1 — 2026-06-06 10:15
**Prompt**: "Convert this Python FastAPI backend to Node.js/Express with MongoDB. The backend handles student report cards with roles: admin, faculty, student. Map SQLAlchemy models to Mongoose schemas."

**AI Response (trimmed)**: Generated 8 Mongoose model files with correct field types, unique indexes, and a pre-save bcrypt hook on User.

**Accepted**: Yes — all models were well-structured. Added `version: { type: Number, default: 1 }` to MarkEntry which the AI omitted.

**Rejected**: Nothing.

---

### Receipt 2 — 2026-06-06 10:40
**Prompt**: "Implement optimistic concurrency for mark entry updates. The client sends a version field. If versions don't match, reject with HTTP 409 and provide current data plus options: accept_latest, overwrite_mine, manual_merge."

**AI Response (trimmed)**:
```javascript
const updated = await MarkEntry.findOneAndUpdate(
  { _id: req.params.id, version: payload.version },
  { $set: { ...fields }, $inc: { version: 1 } },
  { new: true }
);
if (!updated) return res.status(409).json({ message: 'Version conflict' });
```

**Accepted**: No.

**Modified**: Rewrote to explicit fetch → compare → save. The `findOneAndUpdate` approach gives a minimal 409 with no conflict data. The assignment explicitly requires `currentData`, `yourVersion`, `currentVersion`, and `options` array in the response body.

**Why AI was wrong**: It optimised for fewer DB round trips but violated the requirement for rich conflict payload. This was the most misleading output in the project.

---

### Receipt 3 — 2026-06-06 11:00
**Prompt**: "Write a grade calculator function. Grades: O (≥90%), A+ (≥80%), A (≥70%), B+ (≥60%), B (≥50%), C (≥40%), F (<40%). Input: internal marks, external marks, max values. Output: { total, grade }. Throw error if marks exceed max."

**AI Response (trimmed)**:
```javascript
function calculateMarks(internal, external, maxInternal=40, maxExternal=60) {
  if (internal > maxInternal) throw new Error(`Internal marks ${internal} exceed maximum ${maxInternal}`);
  // ... grade logic
}
```

**Accepted**: Yes — exactly correct.

**Why**: Logic matched the Python original and the spec. No modifications needed.

---

### Receipt 4 — 2026-06-06 11:30
**Prompt**: "Implement bulk CSV import endpoint. Must be idempotent (same file twice = no duplicates). Show per-row status: created, updated, skipped, failed. Faculty must also be tripwire-checked."

**AI Response (trimmed)**: Generated the endpoint with idempotency and row-level status, but omitted the faculty tripwire inside the import loop.

**Accepted**: Partially.

**Modified**: Added the `FacultySubject` check inside the row loop, same as the single-mark create route. AI didn't carry the security constraint into the CSV path — a subtle but critical omission.

---

### Receipt 5 — 2026-06-06 12:00
**Prompt**: "Write supertest API tests for: (1) optimistic concurrency failure path returning 409 with options array, (2) unauthorized faculty edit attempt returning 403."

**AI Response (trimmed)**: Generated test structure using `mongodb-memory-server` in-memory DB, with `beforeAll` setup and fixture helpers.

**Accepted**: Yes — solid test structure. Added more assertion detail to the 409 test (checking `currentData.internalMarks` specifically) and extended test coverage to include grade server-enforcement and student read-only access.

**Why**: The basic structure was correct but assertions were shallow. Strengthened to cover the exact requirement language.
