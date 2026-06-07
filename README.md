# 🎓 Student Report Card Portal — Full MERN Stack

A full-stack student academic management system with role-based access control, optimistic concurrency, bulk CSV import, and real-time KPI dashboard.

---

## 📁 Project Structure

```
reportcard-mern-portal/
├── backend/          # Express + MongoDB API
│   ├── src/
│   │   ├── routes/   # auth, students, subjects, marks, reportCards, bulkImport, dashboard
│   │   ├── models/   # User, Student, Subject, MarkEntry, ReportCard, Department, FacultySubject
│   │   ├── middleware/
│   │   ├── services/ # gradeCalculator, audit, metrics
│   │   └── server.js
│   └── package.json
└── frontend/         # React SPA
    ├── src/
    │   ├── api/      # axios client + service functions
    │   ├── contexts/ # AuthContext
    │   ├── hooks/    # useDraft (local draft recovery)
    │   ├── pages/    # Dashboard, Students, Subjects, Marks, ReportCards, BulkImport, etc.
    │   └── components/ # Layout, Sidebar, Modal
    └── package.json
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running locally (or a MongoDB Atlas connection string)

### 1. Install dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Configure backend environment

Create `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/reportcard
JWT_SECRET=your_super_secret_key_here
CLIENT_ORIGIN=http://localhost:3000
```

### 3. Seed the database (optional)

```bash
cd backend && npm run seed
```

### 4. Start backend

```bash
cd backend && npm run dev
# Runs on http://localhost:5000
```

### 5. Start frontend

```bash
cd frontend && npm start
# Opens http://localhost:3000
```

---

## 👥 Roles & Credentials (after seeding)

| Role    | Email                    | Password    |
|---------|--------------------------|-------------|
| Admin   | admin@college.edu        | password123 |
| Faculty | faculty@college.edu      | password123 |
| Student | student@college.edu      | password123 |

---

## ✅ Features Implemented

### Authentication & RBAC
- JWT-based authentication
- Three roles: Admin, Faculty, Student
- Route-level and API-level protection
- **Tripwire**: Faculty attempts to edit unassigned subjects → 403 with meaningful UI error

### Report Card Management
- Full CRUD for Students, Subjects, Departments, Mark Entries
- Grade calculated server-side (never trusted from client)
- Publish/unpublish report cards (Admin only)
- Students see only their own published cards

### Optimistic Concurrency (version-based)
- Every MarkEntry has a `version` field
- On update, client sends the version it saw
- If version mismatch → 409 Conflict returned
- **UI shows 3 options**: Accept Latest, Overwrite Mine, Manual Merge

### Dashboard KPIs (server-computed)
- Total Students
- Average Score
- Pass Percentage
- Fail Count
- Interactive bar chart

### Search & Filtering
- Search by student name or roll number (regex, case-insensitive)
- Filter by department, semester, pass/fail status

### Bulk CSV Import
- Minimum 50 rows supported
- Validates roll number exists, marks are valid, required columns present
- Row-by-row feedback: created / updated / skipped / failed
- **Idempotent**: uploading same file twice doesn't duplicate

### Local Draft Recovery
- Mark entry form saves to `localStorage` on every change
- Draft auto-restored on page refresh
- Clear draft button available
- Limitation: drafts are per-browser and cleared on logout

### Observability
- Structured audit logs for create/update/delete
- `/metrics` endpoint with operation counts and latency stats
- Metrics UI page for admin

---

## 🛠 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /auth/register | Public | Register user |
| POST | /auth/login | Public | Login |
| GET | /auth/me | Auth | Current user |
| GET | /dashboard | Admin/Faculty | KPI stats |
| GET | /metrics | Admin | Latency metrics |
| GET/POST/PUT/DELETE | /students | Auth | Student CRUD |
| GET/POST/PUT/DELETE | /subjects | Auth | Subject CRUD |
| POST | /subjects/assignments/assign | Admin | Assign faculty to subject |
| GET/POST/PUT/DELETE | /marks | Auth | Mark entry CRUD |
| POST | /report-cards/:id/publish | Admin | Publish report card |
| POST | /report-cards/:id/unpublish | Admin | Unpublish |
| GET | /report-cards/student/:id | Auth | List report cards |
| GET | /report-cards/:id/:sem/full | Auth | Full detailed card |
| POST | /import/csv | Admin/Faculty | Bulk CSV import |

---

## 🔒 Security

- Passwords hashed with bcryptjs
- JWT tokens (24h expiry)
- Server-side grade calculation
- Role enforcement on every endpoint
- Faculty tripwire enforced in both single-entry and bulk import
