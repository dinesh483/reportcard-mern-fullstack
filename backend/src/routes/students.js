const router = require('express').Router();
const Student = require('../models/Student');
const MarkEntry = require('../models/MarkEntry');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

// GET /students  — list with filtering and search
router.get('/', async (req, res) => {
  const { departmentId, semester, search, passFilter, skip = 0, limit = 50 } = req.query;

  const filter = {};
  if (departmentId) filter.departmentId = departmentId;
  if (semester) filter.semester = parseInt(semester);
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { rollNo: { $regex: search, $options: 'i' } },
    ];
  }

  let students = await Student.find(filter)
    .populate('departmentId', 'name code')
    .sort('rollNo')
    .skip(parseInt(skip))
    .limit(parseInt(limit));

  // Pass/fail filter requires mark data
  if (passFilter === 'pass' || passFilter === 'fail') {
    const filtered = [];
    for (const s of students) {
      const marks = await MarkEntry.find({ studentId: s._id });
      if (!marks.length) continue;
      const hasFail = marks.some((m) => m.grade === 'F');
      if (passFilter === 'fail' && hasFail) filtered.push(s);
      if (passFilter === 'pass' && !hasFail) filtered.push(s);
    }
    return res.json(filtered);
  }

  res.json(students);
});

// GET /students/search  — quick search for autocomplete
router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ message: 'q is required' });

  const students = await Student.find({
    $or: [
      { name: { $regex: q, $options: 'i' } },
      { rollNo: { $regex: q, $options: 'i' } },
    ],
  })
    .populate('departmentId', 'name code')
    .limit(20);

  const results = await Promise.all(
    students.map(async (s) => {
      const marks = await MarkEntry.find({ studentId: s._id });
      let avgScore = null;
      let passStatus = 'no_marks';
      if (marks.length) {
        avgScore = parseFloat((marks.reduce((sum, m) => sum + m.total, 0) / marks.length).toFixed(2));
        passStatus = marks.some((m) => m.grade === 'F') ? 'fail' : 'pass';
      }
      return {
        id: s._id,
        name: s.name,
        rollNo: s.rollNo,
        department: s.departmentId?.name,
        semester: s.semester,
        avgScore,
        passStatus,
      };
    })
  );

  res.json(results);
});

// GET /students/:id
router.get('/:id', async (req, res) => {
  const student = await Student.findById(req.params.id).populate('departmentId', 'name code');
  if (!student) return res.status(404).json({ message: 'Student not found' });

  // Students can only see their own profile
  if (req.user.role === 'student') {
    if (!student.userId || student.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
  }

  res.json(student);
});

// POST /students  (admin only)
router.post('/', requireRole('admin'), async (req, res) => {
  const { name, rollNo, departmentId, semester, userId } = req.body;
  if (!name || !rollNo || !departmentId || !semester)
    return res.status(400).json({ message: 'name, rollNo, departmentId, semester are required' });

  const student = await Student.create({ name, rollNo, departmentId, semester, userId: userId || null });
  res.status(201).json(student);
});

// PUT /students/:id  (admin only)
router.put('/:id', requireRole('admin'), async (req, res) => {
  const { name, departmentId, semester } = req.body;
  const student = await Student.findByIdAndUpdate(
    req.params.id,
    { name, departmentId, semester },
    { new: true, runValidators: true }
  ).populate('departmentId', 'name code');
  if (!student) return res.status(404).json({ message: 'Student not found' });
  res.json(student);
});

// DELETE /students/:id  (admin only)
router.delete('/:id', requireRole('admin'), async (req, res) => {
  const student = await Student.findByIdAndDelete(req.params.id);
  if (!student) return res.status(404).json({ message: 'Student not found' });
  res.status(204).send();
});

module.exports = router;
