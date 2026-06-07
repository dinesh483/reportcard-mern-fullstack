const mongoose = require('mongoose');

const reportCardSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    semester: { type: Number, required: true, min: 1, max: 8 },
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },
    publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

reportCardSchema.index({ studentId: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('ReportCard', reportCardSchema);
