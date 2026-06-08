# 🎓 Student Report Card Portal

A full-stack MERN (MongoDB, Express.js, React.js, Node.js) application for managing student academic records with role-based access control, report card publishing, bulk CSV import, optimistic concurrency control, audit logging, and dashboard analytics.

---

## 📌 Project Overview

The Student Report Card Portal is designed to simplify academic record management for educational institutions.

The system supports:

- Admin, Faculty, and Student roles
- Student and Subject Management
- Marks Entry and Report Card Generation
- Faculty Subject Assignment
- Bulk CSV Import
- Dashboard Analytics
- Audit Logging
- Optimistic Concurrency Control
- Local Draft Recovery

---

## 🏗 Architecture

System architecture diagram:

```text
architecture-diagram.png
```

The architecture illustrates:

- React Frontend
- Express Backend API
- MongoDB Database
- Authentication Layer
- Metrics & Audit Services

---

## 📂 Repository Structure

```text
reportcard-mern-fullstack/
│
├── backend/
├── frontend/
├── test-artifacts/
│   ├── concurrency-test.md
│   ├── unauthorized-faculty-test.md
│   ├── concurrency-test.png
│   └── unauthorized-faculty-test.png
│
├── architecture-diagram.png
├── sample_marks.csv
├── ai-audit-log.md
├── prompt-receipts.md
├── debrief.md
├── package.json
├── README.md
└── .gitignore
```

---

## ✨ Features

### Authentication & Authorization

- JWT Authentication
- Role-Based Access Control (RBAC)
- Admin Role
- Faculty Role
- Student Role
- Protected Routes

### Student Management

- Create Students
- Update Students
- Delete Students
- Search Students
- Filter Students

### Subject Management

- Create Subjects
- Update Subjects
- Delete Subjects
- Faculty Assignment

### Marks Management

- Marks Entry
- Marks Editing
- Server-side Grade Calculation
- Validation Rules

### Report Cards

- Generate Report Cards
- Publish Report Cards
- Unpublish Report Cards
- Student Self-Service Viewing

### Dashboard Analytics

- Total Students
- Average Score
- Pass Percentage
- Fail Count

### Bulk CSV Import

- CSV Upload
- Validation Checks
- Duplicate Protection
- Import Summary

### Local Draft Recovery

- Auto-save draft changes
- Restore unsaved work
- Local browser persistence

### Observability

- Audit Logs
- Metrics Endpoint
- Admin Metrics Dashboard

### Optimistic Concurrency Control

When multiple users edit the same record:

- Conflict Detection
- Accept Latest
- Overwrite Mine
- Edit & Merge

---

## 🔐 Security Features

- Password Hashing (bcrypt)
- JWT Authentication
- Role Validation
- Faculty Assignment Validation
- Server-side Grade Calculation
- Protected API Endpoints

---

## 🚀 Installation

### Prerequisites

- Node.js 18+
- MongoDB

---

### Clone Repository

```bash
git clone <repository-url>
cd reportcard-mern-fullstack
```

---

### Install Dependencies

```bash
npm run install:all
```

or

```bash
cd backend
npm install

cd ../frontend
npm install
```

---

## ⚙ Environment Variables

Create:

```text
backend/.env
```

Example:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/reportcard_db
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=1h
NODE_ENV=development
```

---

## 🌱 Seed Database

```bash
npm run seed
```

---

## ▶ Run Backend

```bash
npm run dev:backend
```

Backend runs at:

```text
http://localhost:5000
```

---

## ▶ Run Frontend

```bash
npm run dev:frontend
```

Frontend runs at:

```text
http://localhost:3000
```

---

## 👥 Demo Accounts

After database seeding:

| Role | Email |
|--------|--------|
| Admin | admin@college.edu |
| Faculty | faculty@college.edu |
| Student | student@college.edu |

Use the passwords configured in the seed script.

---

## 📊 API Modules

### Authentication

```text
/auth
```

### Students

```text
/students
```

### Subjects

```text
/subjects
```

### Marks

```text
/marks
```

### Report Cards

```text
/report-cards
```

### Dashboard

```text
/dashboard
```

### Metrics

```text
/metrics
```

### CSV Import

```text
/import/csv
```

---

## 🧪 Testing Evidence

### Unauthorized Faculty Edit

Documentation:

```text
test-artifacts/unauthorized-faculty-test.md
```

Evidence Screenshot:

```text
test-artifacts/unauthorized-faculty-test.png
```

---

### Concurrency Conflict Handling

Documentation:

```text
test-artifacts/concurrency-test.md
```

Evidence Screenshot:

```text
test-artifacts/concurrency-test.png
```

---

## 📄 Supporting Documents

### AI Audit Log

```text
ai-audit-log.md
```

### Prompt Receipts

```text
prompt-receipts.md
```

### Development Debrief

```text
debrief.md
```

### Sample Import File

```text
sample_marks.csv
```

---

## 🛠 Technologies Used

### Frontend

- React.js
- Axios
- React Router

### Backend

- Node.js
- Express.js
- JWT
- bcryptjs

### Database

- MongoDB
- Mongoose

### Development Tools

- Nodemon
- Git
- VS Code

---

## 🎯 Assignment Requirements Covered

- Full MERN Stack Implementation
- Authentication & RBAC
- Student Management
- Faculty Assignment
- Report Card Management
- Dashboard Analytics
- Bulk CSV Import
- Optimistic Concurrency Control
- Audit Logging
- Metrics Collection
- AI Usage Documentation
- Testing Artifacts

---

## 👨‍💻 Author

Developed as part of an academic software engineering assignment.
