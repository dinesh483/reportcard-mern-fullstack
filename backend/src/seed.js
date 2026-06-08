require('dotenv').config();
const { connectDB } = require('./config/db');
const User = require('./models/User');
const Department = require('./models/Department');
const Student = require('./models/Student');
const Subject = require('./models/Subject');
const FacultySubject = require('./models/FacultySubject');
const MarkEntry = require('./models/MarkEntry');
const ReportCard = require('./models/ReportCard');
const AuditLog = require('./models/AuditLog');

async function seed() {
  await connectDB();
  console.log('🌱 Seeding database...');

  // Clear existing
  await Promise.all([
    User.deleteMany({}),
    Department.deleteMany({}),
    Student.deleteMany({}),
    Subject.deleteMany({}),
    FacultySubject.deleteMany({}),
    MarkEntry.deleteMany({}),
    ReportCard.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);

  // Users
  const admin = await User.create({ name: 'Admin User', email: 'admin@college.edu', password: 'admin123', role: 'admin' });
  const faculty1 = await User.create({ name: 'Dr. Priya Sharma', email: 'priya@college.edu', password: 'faculty123', role: 'faculty' });
  const faculty2 = await User.create({ name: 'Prof. Rajan Kumar', email: 'rajan@college.edu', password: 'faculty123', role: 'faculty' });
  const studentUser = await User.create({ name: 'Arjun Singh', email: 'cs001@college.edu', password: 'student123', role: 'student' });

  // Department
  const csDept = await Department.create({ name: 'Computer Science', code: 'CS' });
  const eceDept = await Department.create({ name: 'Electronics & Communication', code: 'ECE' });

  // Subjects
  const sub1 = await Subject.create({ name: 'Data Structures', code: 'CS101', departmentId: csDept._id, semester: 1, maxInternal: 40, maxExternal: 60 });
  const sub2 = await Subject.create({ name: 'Algorithms', code: 'CS102', departmentId: csDept._id, semester: 1, maxInternal: 40, maxExternal: 60 });
  const sub3 = await Subject.create({ name: 'Database Systems', code: 'CS103', departmentId: csDept._id, semester: 1, maxInternal: 40, maxExternal: 60 });

  // Faculty assignments
  await FacultySubject.create({ facultyId: faculty1._id, subjectId: sub1._id });
  await FacultySubject.create({ facultyId: faculty1._id, subjectId: sub2._id });
  await FacultySubject.create({ facultyId: faculty2._id, subjectId: sub3._id });

  // Students (CS001–CS020)
  for (let i = 1; i <= 20; i++) {
    const rollNo = `CS${String(i).padStart(3, '0')}`;
    const userId = i === 1 ? studentUser._id : null;
    await Student.create({ name: `Student ${rollNo}`, rollNo, departmentId: csDept._id, semester: 1, userId });
  }

  console.log('✅ Seed complete!');
  console.log('\nTest credentials:');
  console.log('  Admin    → admin@college.edu    / admin123');
  console.log('  Faculty  → priya@college.edu    / faculty123');
  console.log('  Faculty  → rajan@college.edu    / faculty123');
  console.log('  Student  → cs001@college.edu    / student123');
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
