const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    semester: { type: Number, required: true, min: 1, max: 8 },
    maxInternal: { type: Number, default: 40 },
    maxExternal: { type: Number, default: 60 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subject', subjectSchema);
