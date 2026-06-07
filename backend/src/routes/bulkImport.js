const router = require('express').Router();
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const MarkEntry = require('../models/MarkEntry');
const FacultySubject = require('../models/FacultySubject');
const { authenticate, requireRole } = require('../middleware/auth');
const { calculateMarks } = require('../services/gradeCalculator');
const { logAction } = require('../services/audit');
const { record, startTimer } = require('../services/metrics');

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_, file, cb) => {
    if (!file.originalname.endsWith('.csv')) {
      const err = new Error('Only CSV files are accepted');
      err.status = 400;
      return cb(err);
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

router.use(authenticate);

const REQUIRED_COLUMNS = ['roll_no', 'subject_code', 'internal_marks', 'external_marks'];

// POST /import/csv  — bulk import marks from CSV
router.post('/csv', requireRole('admin', 'faculty'), upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'CSV file is required (field name: file)' });

  const elapsed = startTimer();

  let records;
  try {
    records = parse(req.file.buffer, {
      columns: (header) => header.map((h) => h.trim().toLowerCase().replace(/ /g, '_')),
      skip_empty_lines: true,
      trim: true,
    });
  } catch (err) {
    return res.status(400).json({ message: `Could not parse CSV: ${err.message}` });
  }

  if (!records.length) return res.status(400).json({ message: 'CSV file is empty' });

  // Validate required columns
  const cols = Object.keys(records[0]);
  const missing = REQUIRED_COLUMNS.filter((c) => !cols.includes(c));
  if (missing.length) {
    return res.status(400).json({ message: `CSV missing required columns: ${missing.join(', ')}` });
  }

  const results = [];
  let created = 0, updated = 0, skipped = 0, failed = 0;

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const rowNum = i + 2; // 1-indexed + header
    const rollNo = String(row.roll_no || '').trim();
    const subjectCode = String(row.subject_code || '').trim();

    const internalMarks = parseFloat(row.internal_marks);
    const externalMarks = parseFloat(row.external_marks);

    if (isNaN(internalMarks) || isNaN(externalMarks)) {
      failed++;
      results.push({ row: rowNum, rollNo, subjectCode, status: 'failed', detail: 'internal_marks or external_marks are not numeric' });
      continue;
    }

    const student = await Student.findOne({ rollNo });
    if (!student) {
      failed++;
      results.push({ row: rowNum, rollNo, subjectCode, status: 'failed', detail: `Roll number '${rollNo}' not found` });
      continue;
    }

    const subject = await Subject.findOne({ code: subjectCode.toUpperCase() });
    if (!subject) {
      failed++;
      results.push({ row: rowNum, rollNo, subjectCode, status: 'failed', detail: `Subject code '${subjectCode}' not found` });
      continue;
    }

    // Faculty tripwire in bulk import
    if (req.user.role === 'faculty') {
      const assignment = await FacultySubject.findOne({ facultyId: req.user._id, subjectId: subject._id });
      if (!assignment) {
        failed++;
        results.push({ row: rowNum, rollNo, subjectCode, status: 'failed', detail: `Not assigned to subject '${subjectCode}'` });
        continue;
      }
    }

    let total, grade;
    try {
      ({ total, grade } = calculateMarks(internalMarks, externalMarks, subject.maxInternal, subject.maxExternal));
    } catch (err) {
      failed++;
      results.push({ row: rowNum, rollNo, subjectCode, status: 'failed', detail: err.message });
      continue;
    }

    // IDEMPOTENCY: check existing entry
    const existing = await MarkEntry.findOne({ studentId: student._id, subjectId: subject._id });

    if (existing) {
      // Same marks → skip (idempotent)
      if (existing.internalMarks === internalMarks && existing.externalMarks === externalMarks) {
        skipped++;
        results.push({ row: rowNum, rollNo, subjectCode, status: 'skipped', detail: 'Identical record already exists' });
      } else {
        existing.internalMarks = internalMarks;
        existing.externalMarks = externalMarks;
        existing.total = total;
        existing.grade = grade;
        existing.version += 1;
        existing.updatedBy = req.user._id;
        await existing.save();
        updated++;
        results.push({ row: rowNum, rollNo, subjectCode, status: 'updated', detail: `Updated → total=${total}, grade=${grade}` });
      }
    } else {
      await MarkEntry.create({
        studentId: student._id,
        subjectId: subject._id,
        internalMarks,
        externalMarks,
        total,
        grade,
        version: 1,
        updatedBy: req.user._id,
      });
      created++;
      results.push({ row: rowNum, rollNo, subjectCode, status: 'created', detail: `Created → total=${total}, grade=${grade}` });
    }
  }

  const ms = elapsed();
  record('bulk_import', ms);
  await logAction({
    actorId: req.user._id, actorRole: req.user.role,
    operation: 'CREATE', entity: 'bulk_import',
    status: 'success', latencyMs: ms,
    detail: `created=${created} updated=${updated} skipped=${skipped} failed=${failed}`,
  });

  res.json({
    total: records.length,
    created,
    updated,
    skipped,
    failed,
    rows: results,
  });
});

module.exports = router;
