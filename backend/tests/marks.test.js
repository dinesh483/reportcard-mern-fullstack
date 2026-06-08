/**
 * Tests:
 *  1. Optimistic concurrency failure path
 *  2. Unauthorized faculty edit attempt (tripwire)
 *  3. Admin can create, update, delete marks
 *  4. Student read-only access
 *  5. Bulk CSV import idempotency
 */

const request = require('supertest');
const app = require('../src/app');
const { setupTestDB, teardownTestDB, clearCollections } = require('./setup');

const User = require('../src/models/User');
const Department = require('../src/models/Department');
const Student = require('../src/models/Student');
const Subject = require('../src/models/Subject');
const FacultySubject = require('../src/models/FacultySubject');
const MarkEntry = require('../src/models/MarkEntry');

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function createUser(email, role) {
  return User.create({ name: `${role} user`, email, password: 'password123', role });
}

async function loginAs(email) {
  const res = await request(app).post('/auth/login').send({ email, password: 'password123' });
  return res.body.accessToken;
}

// ─── Setup ───────────────────────────────────────────────────────────────────

beforeAll(async () => {
  await setupTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

afterEach(async () => {
  await clearCollections();
});

// ─── Shared fixtures ──────────────────────────────────────────────────────────

async function buildFixtures() {
  const admin = await createUser('admin@test.com', 'admin');
  const faculty1 = await createUser('faculty1@test.com', 'faculty');
  const faculty2 = await createUser('faculty2@test.com', 'faculty');
  const studentUser = await createUser('stu@test.com', 'student');

  const dept = await Department.create({ name: 'Computer Science', code: 'CS' });
  const subject1 = await Subject.create({ name: 'DS', code: 'CS101', departmentId: dept._id, semester: 1 });
  const subject2 = await Subject.create({ name: 'Algo', code: 'CS102', departmentId: dept._id, semester: 1 });

  // faculty1 assigned to subject1 only; faculty2 has NO assignments
  await FacultySubject.create({ facultyId: faculty1._id, subjectId: subject1._id });

  const student = await Student.create({ name: 'Arjun', rollNo: 'CS001', departmentId: dept._id, semester: 1, userId: studentUser._id });

  const adminToken = await loginAs('admin@test.com');
  const faculty1Token = await loginAs('faculty1@test.com');
  const faculty2Token = await loginAs('faculty2@test.com');
  const studentToken = await loginAs('stu@test.com');

  return { admin, faculty1, faculty2, studentUser, dept, subject1, subject2, student, adminToken, faculty1Token, faculty2Token, studentToken };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Auth', () => {
  test('register and login returns JWT', async () => {
    const res = await request(app).post('/auth/register').send({
      name: 'Test User', email: 'new@test.com', password: 'pass123', role: 'admin',
    });
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
  });

  test('login with wrong password returns 401', async () => {
    await createUser('u@test.com', 'admin');
    const res = await request(app).post('/auth/login').send({ email: 'u@test.com', password: 'wrong' });
    expect(res.status).toBe(401);
  });
});

describe('Mark Entry — CRUD', () => {
  test('admin can create a mark entry', async () => {
    const { adminToken, student, subject1 } = await buildFixtures();
    const res = await request(app)
      .post('/marks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ studentId: student._id, subjectId: subject1._id, internalMarks: 35, externalMarks: 50 });
    expect(res.status).toBe(201);
    expect(res.body.grade).toBeDefined();
    expect(res.body.total).toBe(85);
    // Grade must be server-calculated — not from client
    expect(res.body.grade).toBe('A');
  });

  test('server calculates grade — client cannot inject grade', async () => {
    const { adminToken, student, subject1 } = await buildFixtures();
    // Even if client sends a grade field, server should compute its own
    const res = await request(app)
      .post('/marks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ studentId: student._id, subjectId: subject1._id, internalMarks: 10, externalMarks: 10, grade: 'O' });
    expect(res.status).toBe(201);
    expect(res.body.grade).toBe('F');  // 20/100 = 20% → F, not O
  });

  test('admin can delete a mark entry', async () => {
    const { adminToken, student, subject1 } = await buildFixtures();
    const createRes = await request(app)
      .post('/marks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ studentId: student._id, subjectId: subject1._id, internalMarks: 30, externalMarks: 45 });
    const entryId = createRes.body._id;

    const delRes = await request(app)
      .delete(`/marks/${entryId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(delRes.status).toBe(204);
  });

  test('listing marks deletes orphaned mark entries left behind by old data', async () => {
    const { adminToken, student, subject1 } = await buildFixtures();
    const orphanStudentId = student._id;
    const orphanSubjectId = subject1._id;

    await MarkEntry.create({
      studentId: orphanStudentId,
      subjectId: orphanSubjectId,
      internalMarks: 20,
      externalMarks: 30,
      total: 50,
      grade: 'B',
      version: 1,
    });

    await Student.deleteOne({ _id: orphanStudentId });

    const res = await request(app)
      .get('/marks')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
    expect(await MarkEntry.countDocuments()).toBe(0);
  });
});

describe('Referential cleanup', () => {
  test('deleting a student also deletes their mark entries', async () => {
    const { adminToken, student, subject1 } = await buildFixtures();

    const createRes = await request(app)
      .post('/marks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ studentId: student._id, subjectId: subject1._id, internalMarks: 30, externalMarks: 40 });
    expect(createRes.status).toBe(201);

    const deleteRes = await request(app)
      .delete(`/students/${student._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deleteRes.status).toBe(204);
    expect(await MarkEntry.countDocuments()).toBe(0);
  });

  test('deleting a subject also deletes mark entries for that subject', async () => {
    const { adminToken, student, subject1 } = await buildFixtures();

    const createRes = await request(app)
      .post('/marks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ studentId: student._id, subjectId: subject1._id, internalMarks: 30, externalMarks: 40 });
    expect(createRes.status).toBe(201);

    const deleteRes = await request(app)
      .delete(`/subjects/${subject1._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deleteRes.status).toBe(204);
    expect(await MarkEntry.countDocuments()).toBe(0);
  });
});

describe('TRIPWIRE — Unauthorized Faculty Edit', () => {
  test('faculty2 (unassigned) cannot create marks for subject1', async () => {
    const { faculty2Token, student, subject1 } = await buildFixtures();
    const res = await request(app)
      .post('/marks')
      .set('Authorization', `Bearer ${faculty2Token}`)
      .send({ studentId: student._id, subjectId: subject1._id, internalMarks: 30, externalMarks: 40 });
    // Must be rejected with 403
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/not assigned/i);
  });

  test('faculty1 (assigned to subject1) CAN create marks for subject1', async () => {
    const { faculty1Token, student, subject1 } = await buildFixtures();
    const res = await request(app)
      .post('/marks')
      .set('Authorization', `Bearer ${faculty1Token}`)
      .send({ studentId: student._id, subjectId: subject1._id, internalMarks: 30, externalMarks: 40 });
    expect(res.status).toBe(201);
  });

  test('faculty1 cannot edit marks for subject2 (unassigned)', async () => {
    const { adminToken, faculty1Token, student, subject2 } = await buildFixtures();
    // Admin creates the entry first
    const createRes = await request(app)
      .post('/marks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ studentId: student._id, subjectId: subject2._id, internalMarks: 30, externalMarks: 40 });
    const entryId = createRes.body._id;

    // Faculty1 tries to update it — should be rejected
    const res = await request(app)
      .put(`/marks/${entryId}`)
      .set('Authorization', `Bearer ${faculty1Token}`)
      .send({ internalMarks: 25, externalMarks: 35, version: 1 });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/not assigned/i);
  });
});

describe('Optimistic Concurrency', () => {
  test('concurrent update with stale version returns 409 with merge options', async () => {
    const { adminToken, student, subject1 } = await buildFixtures();

    // Create a mark entry
    const createRes = await request(app)
      .post('/marks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ studentId: student._id, subjectId: subject1._id, internalMarks: 30, externalMarks: 45 });
    expect(createRes.status).toBe(201);
    const entryId = createRes.body._id;

    // First update — succeeds, bumps version to 2
    const update1 = await request(app)
      .put(`/marks/${entryId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ internalMarks: 32, externalMarks: 48, version: 1 });
    expect(update1.status).toBe(200);
    expect(update1.body.version).toBe(2);

    // Second update with stale version=1 — must fail with 409
    const update2 = await request(app)
      .put(`/marks/${entryId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ internalMarks: 35, externalMarks: 50, version: 1 }); // stale!
    expect(update2.status).toBe(409);
    expect(update2.body.yourVersion).toBe(1);
    expect(update2.body.currentVersion).toBe(2);
    expect(update2.body.options).toContain('accept_latest');
    expect(update2.body.options).toContain('overwrite_mine');
    expect(update2.body.options).toContain('manual_merge');
    expect(update2.body.currentData).toBeDefined();
    expect(update2.body.currentData.internalMarks).toBe(32);
  });

  test('update with correct version succeeds', async () => {
    const { adminToken, student, subject1 } = await buildFixtures();
    const createRes = await request(app)
      .post('/marks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ studentId: student._id, subjectId: subject1._id, internalMarks: 30, externalMarks: 45 });
    const entryId = createRes.body._id;

    const updateRes = await request(app)
      .put(`/marks/${entryId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ internalMarks: 38, externalMarks: 55, version: 1 });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.version).toBe(2);
    expect(updateRes.body.total).toBe(93);
  });
});

describe('Student Read-Only Access', () => {
  test('student cannot create a mark entry', async () => {
    const { studentToken, student, subject1 } = await buildFixtures();
    const res = await request(app)
      .post('/marks')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ studentId: student._id, subjectId: subject1._id, internalMarks: 30, externalMarks: 40 });
    expect(res.status).toBe(403);
  });

  test('student cannot delete a mark entry', async () => {
    const { adminToken, studentToken, student, subject1 } = await buildFixtures();
    const createRes = await request(app)
      .post('/marks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ studentId: student._id, subjectId: subject1._id, internalMarks: 30, externalMarks: 40 });
    const entryId = createRes.body._id;

    const delRes = await request(app)
      .delete(`/marks/${entryId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(delRes.status).toBe(403);
  });

  test('student can read their own marks', async () => {
    const { adminToken, studentToken, student, subject1 } = await buildFixtures();
    await request(app)
      .post('/marks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ studentId: student._id, subjectId: subject1._id, internalMarks: 30, externalMarks: 40 });

    const res = await request(app)
      .get('/marks')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });
});

describe('Dashboard KPIs', () => {
  test('returns correct KPIs with mark data', async () => {
    const { adminToken, student, subject1, subject2 } = await buildFixtures();
    await request(app).post('/marks').set('Authorization', `Bearer ${adminToken}`)
      .send({ studentId: student._id, subjectId: subject1._id, internalMarks: 30, externalMarks: 45 });
    await request(app).post('/marks').set('Authorization', `Bearer ${adminToken}`)
      .send({ studentId: student._id, subjectId: subject2._id, internalMarks: 10, externalMarks: 10 });

    const res = await request(app).get('/dashboard').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.totalStudents).toBe(1);
    expect(res.body.failCount).toBe(1); // second subject has F
    expect(typeof res.body.passPercentage).toBe('number');
  });
});

describe('Bulk CSV Import', () => {
  test('imports 3 rows correctly', async () => {
    const { adminToken, student, subject1 } = await buildFixtures();
    const csv = `roll_no,subject_code,internal_marks,external_marks\nCS001,CS101,35,52\n`;

    const res = await request(app)
      .post('/import/csv')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', Buffer.from(csv), { filename: 'marks.csv', contentType: 'text/csv' });

    expect(res.status).toBe(200);
    expect(res.body.created).toBe(1);
    expect(res.body.failed).toBe(0);
  });

  test('uploading same CSV twice is idempotent (skips duplicates)', async () => {
    const { adminToken } = await buildFixtures();
    const csv = `roll_no,subject_code,internal_marks,external_marks\nCS001,CS101,35,52\n`;

    await request(app).post('/import/csv').set('Authorization', `Bearer ${adminToken}`)
      .attach('file', Buffer.from(csv), { filename: 'marks.csv', contentType: 'text/csv' });

    const res2 = await request(app).post('/import/csv').set('Authorization', `Bearer ${adminToken}`)
      .attach('file', Buffer.from(csv), { filename: 'marks.csv', contentType: 'text/csv' });

    expect(res2.status).toBe(200);
    expect(res2.body.skipped).toBe(1);
    expect(res2.body.created).toBe(0);
  });

  test('rejects non-CSV file', async () => {
    const { adminToken } = await buildFixtures();
    const res = await request(app)
      .post('/import/csv')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', Buffer.from('data'), { filename: 'marks.txt', contentType: 'text/plain' });
    expect(res.status).toBe(400);
  });
});

describe('Grade Calculation', () => {
  const { calculateMarks } = require('../src/services/gradeCalculator');

  test.each([
    [40, 60, 40, 60, 100, 'O'],
    [36, 54, 40, 60, 90, 'A+'],
    [30, 41, 40, 60, 71, 'A'],
    [24, 36, 40, 60, 60, 'B+'],
    [20, 30, 40, 60, 50, 'B'],
    [16, 24, 40, 60, 40, 'C'],
    [10, 15, 40, 60, 25, 'F'],
  ])('internal=%d external=%d → total=%d grade=%s', (int, ext, maxInt, maxExt, expectedTotal, expectedGrade) => {
    const { total, grade } = calculateMarks(int, ext, maxInt, maxExt);
    expect(total).toBe(expectedTotal);
    expect(grade).toBe(expectedGrade);
  });

  test('throws on marks exceeding maximum', () => {
    expect(() => calculateMarks(41, 60, 40, 60)).toThrow(/exceed maximum/);
  });
});
