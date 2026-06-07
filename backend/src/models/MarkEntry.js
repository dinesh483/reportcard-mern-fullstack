const mongoose = require('mongoose');

const markEntrySchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    internalMarks: { type: Number, required: true, min: 0 },
    externalMarks: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true },       // server-calculated, never from client
    grade: { type: String, required: true },        // server-calculated, never from client
    version: { type: Number, default: 1, required: true }, // optimistic concurrency
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Unique compound index — one mark entry per student per subject
markEntrySchema.index({ studentId: 1, subjectId: 1 }, { unique: true });

module.exports = mongoose.model('MarkEntry', markEntrySchema);
