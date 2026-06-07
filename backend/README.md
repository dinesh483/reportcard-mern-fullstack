# Student Report Card Portal — MERN Backend

A full-featured backend for the Student Report Card Portal built with **Node.js, Express, MongoDB (Mongoose)**. Converts the original Python/FastAPI implementation to the MERN stack while fulfilling every requirement from the assignment.

---

## Architecture

```
┌─────────────────────────────────────────────┐
│                 React Frontend               │
│        (localStorage draft recovery)         │
└──────────────────┬──────────────────────────┘
                   │ HTTP/REST + JWT Bearer
┌──────────────────▼──────────────────────────┐
│              Express API Server              │
│                                             │
│  Routes:                                    │
│   POST /auth/login|register                 │
│   GET|POST|PUT|DELETE /students             │
│   GET|POST|PUT|DELETE /subjects             │
│   POST /subjects/assignments/assign         │
│   GET|POST|PUT|DELETE /marks                │  ← version-based concurrency
│   POST /report-cards/:id/publish|unpublish  │
│   POST /import/csv                          │  ← idempotent bulk import
│   GET  /dashboard                           │  ← server-computed KPIs
│   GET  /metrics                             │  ← latency + operation counts
│                                             │
│  Middleware:                                │
│   • JWT authenticate                        │
│   • requireRole(...roles)                   │
│   • errorHandler                            │
│   • morgan (HTTP logging)                   │
│   • winston (structured audit logs)         │
└──────────────────┬──────────────────────────┘
                   │ Mongoose ODM
┌──────────────────▼──────────────────────────┐
│                  MongoDB                     │
│                                             │
│  Collections:                               │
│   users · departments · students            │
│   subjects · faculty_subjects               │
│   mark_entries · report_cards               │
│   audit_logs                                │
└─────────────────────────────────────────────┘
```

---

## Quick Start

### Prerequisites
- Node.js ≥ 18
- MongoDB (local or Atlas)

### Install
```bash
npm install
cp .env.example .env
# Edit .env with your MONGO_URI and JWT_SECRET
```

### Run
```bash
# Seed sample data (20 students, 3 subjects, 2 faculty accounts)
npm run seed

# Development (auto-reload)
npm run dev

# Production
npm start
```

### Test
```bash
npm test
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `MONGO_URI` | `mongodb://localhost:27017/reportcard_db` | MongoDB connection string |
| `JWT_SECRET` | *(required)* | JWT signing secret — change in production |
| `JWT_EXPIRES_IN` | `1h` | Token expiry |
| `PORT` | `5000` | HTTP port |
| `NODE_ENV` | `development` | Environment |

---

## API Reference

### Auth
| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Create account |
| POST | `/auth/login` | Public | Login, returns JWT |
| GET | `/auth/me` | Any | Current user |

### Departments
| Method | Path | Access |
|---|---|---|
| GET | `/departments` | All |
| POST | `/departments` | Admin |
| PUT | `/departments/:id` | Admin |
| DELETE | `/departments/:id` | Admin |

### Students
| Method | Path | Access |
|---|---|---|
| GET | `/students?search=&departmentId=&semester=&passFilter=` | All |
| GET | `/students/search?q=` | All |
| POST | `/students` | Admin |
| PUT | `/students/:id` | Admin |
| DELETE | `/students/:id` | Admin |

### Subjects & Faculty Assignments
| Method | Path | Access |
|---|---|---|
| GET | `/subjects` | All |
| GET | `/subjects/my` | Faculty (own subjects only) |
| POST | `/subjects` | Admin |
| POST | `/subjects/assignments/assign` | Admin |
| DELETE | `/subjects/assignments/:id` | Admin |
| GET | `/subjects/assignments/faculty/:facultyId` | Admin |

### Marks
| Method | Path | Access | Notes |
|---|---|---|---|
| POST | `/marks` | Admin, Faculty | Faculty tripwire enforced |
| PUT | `/marks/:id` | Admin, Faculty | Requires `version`; returns 409 on conflict |
| GET | `/marks?studentId=&subjectId=` | All | Students see own only |
| DELETE | `/marks/:id` | Admin | |

#### Optimistic Concurrency (PUT /marks/:id)
Send the current `version` field. If another actor updated the record first:
```json
HTTP 409 Conflict
{
  "message": "Conflict: this record was updated by someone else.",
  "yourVersion": 1,
  "currentVersion": 2,
  "currentData": { "internalMarks": 32, "externalMarks": 48, ... },
  "options": ["accept_latest", "overwrite_mine", "manual_merge"]
}
```
The UI should offer these three resolution options.

### Report Cards
| Method | Path | Access |
|---|---|---|
| POST | `/report-cards/:studentId/publish` | Admin |
| POST | `/report-cards/:studentId/unpublish` | Admin |
| GET | `/report-cards/student/:studentId` | All (students: published only) |
| GET | `/report-cards/:studentId/:semester/full` | All |

### Bulk CSV Import
```
POST /import/csv
Content-Type: multipart/form-data
Field: file (CSV)
Access: Admin, Faculty
```
Required columns: `roll_no`, `subject_code`, `internal_marks`, `external_marks`

**Idempotent**: uploading the same file twice skips identical rows.

Row statuses: `created | updated | skipped | failed`

### Dashboard & Metrics
| Method | Path | Access |
|---|---|---|
| GET | `/dashboard` | Admin, Faculty |
| GET | `/metrics` | Admin |

---

## Key Design Decisions

### Grade Calculation (Server-Side Only)
Grades are **never** accepted from the client. Every mark save calls `gradeCalculator.js`:

| Percentage | Grade |
|---|---|
| ≥ 90% | O (Outstanding) |
| ≥ 80% | A+ |
| ≥ 70% | A |
| ≥ 60% | B+ |
| ≥ 50% | B |
| ≥ 40% | C |
| < 40% | F |

### Optimistic Concurrency
Each `MarkEntry` document has a `version` integer. On update:
1. Client sends its known `version`.
2. Server compares to DB value.
3. Mismatch → HTTP 409 with full conflict payload including merge options.
4. Match → update proceeds, `version` increments by 1.

### Faculty Tripwire
On every create/update for marks (including bulk CSV), the server checks `FacultySubject` collection. If no assignment exists, it rejects with HTTP 403 and a meaningful message. This runs server-side — the UI cannot bypass it.

### Search Approach
- **Text search**: uses MongoDB `$regex` with `$options: 'i'` for case-insensitive partial matching on `name` and `rollNo`.
- A text index is also declared on the `Student` model for future Atlas Search compatibility.
- **Pass/fail filter**: computed post-query by checking if any `MarkEntry` for the student has `grade === 'F'`.

### Local Draft Recovery (Frontend Concern)
The backend is stateless; draft recovery is implemented in the React frontend using `localStorage`. A draft key like `draft:mark:<entryId>` stores unsaved changes. On page load, if a draft exists, the form is pre-populated. **Limitation**: drafts are lost if the user clears browser storage or switches browsers.

### Observability
- **Structured logs**: `winston` writes JSON to stdout — every audit event includes `actor_id`, `actor_role`, `operation`, `entity`, `student_id`, `status`, `latency_ms`.
- **DB audit trail**: every write is also persisted in the `AuditLog` collection.
- **Metrics endpoint** (`GET /metrics`): in-memory operation counts + average & p95 latency per operation type. For production, replace with Prometheus.

---

## Testing

```bash
npm test
```

Tests use `mongodb-memory-server` (no external MongoDB needed) and `supertest`.

| Test | Description |
|---|---|
| Auth | Register, login, wrong password |
| Mark CRUD | Admin create/delete, grade server-side enforcement |
| TRIPWIRE | Unassigned faculty rejected with 403 |
| Concurrency | Stale version → 409 with merge options |
| Student read-only | Cannot create or delete marks |
| Dashboard KPIs | Correct counts with mark data |
| Bulk CSV | Import, idempotency, non-CSV rejection |
| Grade Calculator | All grade bands, mark overflow |

---

## Folder Structure

```
src/
├── config/
│   └── db.js              # MongoDB connection
├── middleware/
│   ├── auth.js            # JWT authenticate + requireRole
│   └── errorHandler.js    # Global error handler
├── models/
│   ├── User.js
│   ├── Department.js
│   ├── Student.js
│   ├── Subject.js
│   ├── FacultySubject.js
│   ├── MarkEntry.js       # version field for concurrency
│   ├── ReportCard.js
│   └── AuditLog.js
├── routes/
│   ├── auth.js
│   ├── departments.js
│   ├── students.js
│   ├── subjects.js        # includes faculty assignment sub-routes
│   ├── marks.js           # optimistic concurrency + tripwire
│   ├── reportCards.js
│   ├── bulkImport.js      # idempotent CSV import
│   └── dashboard.js       # KPIs + metrics
├── services/
│   ├── gradeCalculator.js # server-side only grade logic
│   ├── metrics.js         # in-memory op counts + latency
│   └── audit.js           # structured audit logging
├── app.js                 # Express app setup
├── server.js              # Entry point
└── seed.js                # Dev seed data
tests/
├── setup.js               # In-memory MongoDB helpers
└── marks.test.js          # All API tests
sample_marks.csv           # 60 rows for bulk import testing
```
