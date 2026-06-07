const router = require('express').Router();
const Subject = require('../models/Subject');
const FacultySubject = require('../models/FacultySubject');
const User = require('../models/User');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

// GET /subjects
router.get('/', async (req, res) => {
  const subjects = await Subject.find().populate('departmentId', 'name code').sort('code');
  res.json(subjects);
});

// GET /subjects/my  — faculty: only their assigned subjects
router.get('/my', requireRole('faculty'), async (req, res) => {
  const assignments = await FacultySubject.find({ facultyId: req.user._id });
  const subjectIds = assignments.map((a) => a.subjectId);
  const subjects = await Subject.find({ _id: { $in: subjectIds } }).populate('departmentId', 'name code');
  res.json(subjects);
});

// GET /subjects/:id
router.get('/:id', async (req, res) => {
  const subject = await Subject.findById(req.params.id).populate('departmentId', 'name code');
  if (!subject) return res.status(404).json({ message: 'Subject not found' });
  res.json(subject);
});

// POST /subjects  (admin only)
router.post('/', requireRole('admin'), async (req, res) => {
  const { name, code, departmentId, semester, maxInternal = 40, maxExternal = 60 } = req.body;
  if (!name || !code || !departmentId || !semester)
    return res.status(400).json({ message: 'name, code, departmentId, semester are required' });
  const subject = await Subject.create({ name, code, departmentId, semester, maxInternal, maxExternal });
  res.status(201).json(subject);
});

// PUT /subjects/:id  (admin only)
router.put('/:id', requireRole('admin'), async (req, res) => {
  const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!subject) return res.status(404).json({ message: 'Subject not found' });
  res.json(subject);
});

// DELETE /subjects/:id  (admin only)
router.delete('/:id', requireRole('admin'), async (req, res) => {
  const subject = await Subject.findByIdAndDelete(req.params.id);
  if (!subject) return res.status(404).json({ message: 'Subject not found' });
  res.status(204).send();
});

// ─── Faculty ↔ Subject Assignments ───────────────────────────────────────────

// POST /subjects/assignments  (admin only)
router.post('/assignments/assign', requireRole('admin'), async (req, res) => {
  const { facultyId, subjectId } = req.body;
  if (!facultyId || !subjectId)
    return res.status(400).json({ message: 'facultyId and subjectId are required' });

  const faculty = await User.findOne({ _id: facultyId, role: 'faculty' });
  if (!faculty) return res.status(404).json({ message: 'Faculty user not found' });

  const subject = await Subject.findById(subjectId);
  if (!subject) return res.status(404).json({ message: 'Subject not found' });

  const assignment = await FacultySubject.create({ facultyId, subjectId });
  res.status(201).json(assignment);
});

// DELETE /subjects/assignments/:assignmentId  (admin only)
router.delete('/assignments/:assignmentId', requireRole('admin'), async (req, res) => {
  const assignment = await FacultySubject.findByIdAndDelete(req.params.assignmentId);
  if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
  res.status(204).send();
});

// GET /subjects/assignments/faculty/:facultyId  (admin only)
router.get('/assignments/faculty/:facultyId', requireRole('admin'), async (req, res) => {
  const assignments = await FacultySubject.find({ facultyId: req.params.facultyId })
    .populate('subjectId', 'name code semester');
  res.json(assignments);
});

module.exports = router;
