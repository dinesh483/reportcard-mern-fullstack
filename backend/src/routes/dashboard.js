const router = require('express').Router();
const Student = require('../models/Student');
const MarkEntry = require('../models/MarkEntry');
const { authenticate, requireRole } = require('../middleware/auth');
const metricsService = require('../services/metrics');

router.use(authenticate);

// GET /dashboard  — server-computed KPIs (admin + faculty)
router.get('/dashboard', requireRole('admin', 'faculty'), async (req, res) => {
  const totalStudents = await Student.countDocuments();

  const markStats = await MarkEntry.aggregate([
    {
      $group: {
        _id: null,
        avgTotal: { $avg: '$total' },
        totalEntries: { $sum: 1 },
      },
    },
  ]);

  const avgScore = markStats.length ? parseFloat((markStats[0].avgTotal || 0).toFixed(2)) : 0;
  const totalMarkEntries = markStats.length ? markStats[0].totalEntries : 0;

  // Pass/fail counts per student (a student fails if ANY subject is 'F')
  const studentGrades = await MarkEntry.aggregate([
    {
      $group: {
        _id: '$studentId',
        grades: { $push: '$grade' },
      },
    },
  ]);

  let failCount = 0;
  let passCount = 0;
  for (const sg of studentGrades) {
    if (sg.grades.includes('F')) failCount++;
    else passCount++;
  }

  const gradedStudents = studentGrades.length;
  const passPercentage = gradedStudents
    ? parseFloat(((passCount / gradedStudents) * 100).toFixed(2))
    : 0;

  res.json({
    totalStudents,
    averageScore: avgScore,
    passPercentage,
    failCount,
    totalMarkEntries,
  });
});

// GET /metrics  — operation counts + latency (admin only)
router.get('/metrics', requireRole('admin'), (req, res) => {
  res.json(metricsService.getMetrics());
});

module.exports = router;
