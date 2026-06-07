const router = require('express').Router();
const MarkEntry = require('../models/MarkEntry');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const FacultySubject = require('../models/FacultySubject');
const { authenticate, requireRole } = require('../middleware/auth');
const { calculateMarks } = require('../services/gradeCalculator');
const { logAction } = require('../services/audit');
const { record, startTimer } = require('../services/metrics');

router.use(authenticate);

// ── Tripwire helper ──────────────────────────────────────────────────────────
async function assertFacultyOwnsSubject(facultyId, subjectId, res) {
  const assignment = await FacultySubject.findOne({ facultyId, subjectId });
  if (!assignment) {
    res.status(403).json({
      message: 'You are not assigned to this subject. Cannot edit marks.',
    });
    return false;
  }
  return true;
}

// POST /marks  — create a mark entry
router.post('/', requireRole('admin', 'faculty'), async (req, res) => {
  const elapsed = startTimer();
  const { studentId, subjectId, internalMarks, externalMarks } = req.body;

  if (!studentId || !subjectId || internalMarks == null || externalMarks == null)
    return res.status(400).json({ message: 'studentId, subjectId, internalMarks, externalMarks are required' });

  // TRIPWIRE: faculty can only edit assigned subjects
  if (req.user.role === 'faculty') {
    const ok = await assertFacultyOwnsSubject(req.user._id, subjectId, res);
    if (!ok) return;
  }

  const student = await Student.findById(studentId);
  if (!student) return res.status(404).json({ message: 'Student not found' });

  const subject = await Subject.findById(subjectId);
  if (!subject) return res.status(404).json({ message: 'Subject not found' });

  const duplicate = await MarkEntry.findOne({ studentId, subjectId });
  if (duplicate)
    return res.status(400).json({ message: 'Mark entry already exists. Use PUT to update.' });

  let total, grade;
  try {
    ({ total, grade } = calculateMarks(internalMarks, externalMarks, subject.maxInternal, subject.maxExternal));
  } catch (err) {
    return res.status(422).json({ message: err.message });
  }

  const entry = await MarkEntry.create({
    studentId,
    subjectId,
    internalMarks,
    externalMarks,
    total,
    grade,
    version: 1,
    updatedBy: req.user._id,
  });

  const ms = elapsed();
  record('mark_create', ms);
  await logAction({
    actorId: req.user._id, actorRole: req.user.role,
    operation: 'CREATE', entity: 'mark_entry', entityId: entry._id,
    studentId, status: 'success', latencyMs: ms,
  });

  res.status(201).json(entry);
});

// PUT /marks/:id  — update with optimistic concurrency check
router.put('/:id', requireRole('admin', 'faculty'), async (req, res) => {
  const elapsed = startTimer();
  const { internalMarks, externalMarks, version } = req.body;

  if (internalMarks == null || externalMarks == null || version == null)
    return res.status(400).json({ message: 'internalMarks, externalMarks, version are required' });

  const entry = await MarkEntry.findById(req.params.id);
  if (!entry) return res.status(404).json({ message: 'Mark entry not found' });

  // TRIPWIRE
  if (req.user.role === 'faculty') {
    const ok = await assertFacultyOwnsSubject(req.user._id, entry.subjectId, res);
    if (!ok) return;
  }

  // ── OPTIMISTIC CONCURRENCY CHECK ──────────────────────────────────────────
  if (parseInt(version) !== entry.version) {
    return res.status(409).json({
      message: 'Conflict: this record was updated by someone else.',
      yourVersion: parseInt(version),
      currentVersion: entry.version,
      currentData: {
        internalMarks: entry.internalMarks,
        externalMarks: entry.externalMarks,
        total: entry.total,
        grade: entry.grade,
        updatedAt: entry.updatedAt,
      },
      options: ['accept_latest', 'overwrite_mine', 'manual_merge'],
    });
  }

  const subject = await Subject.findById(entry.subjectId);
  let total, grade;
  try {
    ({ total, grade } = calculateMarks(internalMarks, externalMarks, subject.maxInternal, subject.maxExternal));
  } catch (err) {
    return res.status(422).json({ message: err.message });
  }

  entry.internalMarks = internalMarks;
  entry.externalMarks = externalMarks;
  entry.total = total;
  entry.grade = grade;
  entry.version = entry.version + 1;  // bump version
  entry.updatedBy = req.user._id;
  await entry.save();

  const ms = elapsed();
  record('mark_update', ms);
  await logAction({
    actorId: req.user._id, actorRole: req.user.role,
    operation: 'UPDATE', entity: 'mark_entry', entityId: entry._id,
    studentId: entry.studentId, status: 'success', latencyMs: ms,
  });

  res.json(entry);
});

// GET /marks  — list (students see only own)
router.get('/', async (req, res) => {
  const filter = {};

  if (req.user.role === 'student') {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });
    filter.studentId = student._id;
  } else {
    if (req.query.studentId) filter.studentId = req.query.studentId;
    if (req.query.subjectId) filter.subjectId = req.query.subjectId;
  }

  const entries = await MarkEntry.find(filter)
    .populate('studentId', 'name rollNo semester departmentId')
    .populate({
      path: 'studentId',
      populate: { path: 'departmentId', select: 'name code' }
    })
    .populate('subjectId', 'name code maxInternal maxExternal');

  res.json(entries);
});

// GET /marks/:id
router.get('/:id', async (req, res) => {
  const entry = await MarkEntry.findById(req.params.id)
    .populate('studentId', 'name rollNo semester departmentId')
    .populate({
      path: 'studentId',
      populate: { path: 'departmentId', select: 'name code' }
    })
    .populate('subjectId', 'name code maxInternal maxExternal');
  if (!entry) return res.status(404).json({ message: 'Mark entry not found' });

  if (req.user.role === 'student') {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student || entry.studentId._id.toString() !== student._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
  }

  res.json(entry);
});

// DELETE /marks/:id  (admin only)
router.delete('/:id', requireRole('admin'), async (req, res) => {
  const elapsed = startTimer();
  const entry = await MarkEntry.findByIdAndDelete(req.params.id);
  if (!entry) return res.status(404).json({ message: 'Mark entry not found' });

  const ms = elapsed();
  record('mark_delete', ms);
  await logAction({
    actorId: req.user._id, actorRole: req.user.role,
    operation: 'DELETE', entity: 'mark_entry', entityId: req.params.id,
    studentId: entry.studentId, status: 'success', latencyMs: ms,
  });

  res.status(204).send();
});

module.exports = router;
