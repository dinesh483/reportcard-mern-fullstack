const router = require('express').Router();
const ReportCard = require('../models/ReportCard');
const Student = require('../models/Student');
const MarkEntry = require('../models/MarkEntry');
const Subject = require('../models/Subject');
const { authenticate, requireRole } = require('../middleware/auth');
const { logAction } = require('../services/audit');

router.use(authenticate);

// POST /report-cards/:studentId/publish  (admin only)
router.post('/:studentId/publish', requireRole('admin'), async (req, res) => {
  const { semester } = req.body;
  if (!semester) return res.status(400).json({ message: 'semester is required' });

  const student = await Student.findById(req.params.studentId);
  if (!student) return res.status(404).json({ message: 'Student not found' });

  const rc = await ReportCard.findOneAndUpdate(
    { studentId: req.params.studentId, semester: parseInt(semester) },
    {
      isPublished: true,
      publishedAt: new Date(),
      publishedBy: req.user._id,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await logAction({
    actorId: req.user._id, actorRole: req.user.role,
    operation: 'UPDATE', entity: 'report_card', entityId: rc._id,
    studentId: req.params.studentId, status: 'success', detail: 'published',
  });

  res.json(rc);
});

// POST /report-cards/:studentId/unpublish  (admin only)
router.post('/:studentId/unpublish', requireRole('admin'), async (req, res) => {
  const { semester } = req.body;
  if (!semester) return res.status(400).json({ message: 'semester is required' });

  const rc = await ReportCard.findOneAndUpdate(
    { studentId: req.params.studentId, semester: parseInt(semester) },
    { isPublished: false, publishedAt: null },
    { new: true }
  );
  if (!rc) return res.status(404).json({ message: 'Report card not found' });

  await logAction({
    actorId: req.user._id, actorRole: req.user.role,
    operation: 'UPDATE', entity: 'report_card', entityId: rc._id,
    studentId: req.params.studentId, status: 'success', detail: 'unpublished',
  });

  res.json(rc);
});

// GET /report-cards/student/:studentId  — list report cards
router.get('/student/:studentId', async (req, res) => {
  const student = await Student.findById(req.params.studentId);
  if (!student) return res.status(404).json({ message: 'Student not found' });

  const filter = { studentId: req.params.studentId };

  // Students can only see their own published cards
  if (req.user.role === 'student') {
    if (!student.userId || student.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    filter.isPublished = true;
  }

  const rcs = await ReportCard.find(filter).sort('semester');
  res.json(rcs);
});

// GET /report-cards/:studentId/:semester/full  — detailed card with marks
router.get('/:studentId/:semester/full', async (req, res) => {
  const { studentId, semester } = req.params;
  const student = await Student.findById(studentId).populate('departmentId', 'name code');
  if (!student) return res.status(404).json({ message: 'Student not found' });

  // Students: access control + must be published
  if (req.user.role === 'student') {
    if (!student.userId || student.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const rc = await ReportCard.findOne({ studentId, semester: parseInt(semester), isPublished: true });
    if (!rc) return res.status(404).json({ message: 'Report card not published yet' });
  }

  // Get marks for subjects in this semester
  const subjects = await Subject.find({ semester: parseInt(semester) });
  const subjectIds = subjects.map((s) => s._id);
  const marks = await MarkEntry.find({ studentId, subjectId: { $in: subjectIds } })
    .populate('subjectId', 'name code maxInternal maxExternal');

  const totalObtained = marks.reduce((sum, m) => sum + m.total, 0);
  const totalMaximum = marks.reduce((sum, m) => sum + (m.subjectId.maxInternal + m.subjectId.maxExternal), 0);

  res.json({
    student: {
      id: student._id,
      name: student.name,
      rollNo: student.rollNo,
      department: student.departmentId?.name,
      semester: parseInt(semester),
    },
    marks: marks.map((m) => ({
      subjectId: m.subjectId._id,
      subjectName: m.subjectId.name,
      subjectCode: m.subjectId.code,
      internalMarks: m.internalMarks,
      externalMarks: m.externalMarks,
      total: m.total,
      grade: m.grade,
    })),
    summary: {
      totalObtained: parseFloat(totalObtained.toFixed(2)),
      totalMaximum: parseFloat(totalMaximum.toFixed(2)),
      percentage: totalMaximum ? parseFloat(((totalObtained / totalMaximum) * 100).toFixed(2)) : 0,
      result: marks.some((m) => m.grade === 'F') ? 'FAIL' : 'PASS',
    },
  });
});

module.exports = router;
