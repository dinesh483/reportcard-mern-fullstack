const MarkEntry = require('../models/MarkEntry');

async function deleteOrphanedMarkEntries(baseFilter = {}) {
  const entries = await MarkEntry.find(baseFilter).select('_id studentId subjectId');
  if (!entries.length) {
    return { deletedCount: 0, deletedIds: [] };
  }

  const studentIds = [...new Set(entries.map((entry) => entry.studentId?.toString()).filter(Boolean))];
  const subjectIds = [...new Set(entries.map((entry) => entry.subjectId?.toString()).filter(Boolean))];

  const [validStudentIds, validSubjectIds] = await Promise.all([
    MarkEntry.db.model('Student').distinct('_id', { _id: { $in: studentIds } }),
    MarkEntry.db.model('Subject').distinct('_id', { _id: { $in: subjectIds } }),
  ]);

  const validStudents = new Set(validStudentIds.map((id) => id.toString()));
  const validSubjects = new Set(validSubjectIds.map((id) => id.toString()));
  const orphanedIds = entries
    .filter((entry) => !validStudents.has(entry.studentId.toString()) || !validSubjects.has(entry.subjectId.toString()))
    .map((entry) => entry._id);

  if (!orphanedIds.length) {
    return { deletedCount: 0, deletedIds: [] };
  }

  const result = await MarkEntry.deleteMany({ _id: { $in: orphanedIds } });
  return { deletedCount: result.deletedCount || 0, deletedIds: orphanedIds };
}

module.exports = { deleteOrphanedMarkEntries };
