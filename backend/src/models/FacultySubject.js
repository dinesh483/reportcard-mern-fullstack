const mongoose = require('mongoose');

const facultySubjectSchema = new mongoose.Schema(
  {
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  },
  { timestamps: true }
);

// Unique compound index — one faculty cannot be assigned the same subject twice
facultySubjectSchema.index({ facultyId: 1, subjectId: 1 }, { unique: true });

module.exports = mongoose.model('FacultySubject', facultySubjectSchema);
