const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    // Optional link to a User account (for student login)
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, required: true, trim: true },
    rollNo: { type: String, required: true, unique: true, trim: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    semester: { type: Number, required: true, min: 1, max: 8 },
  },
  { timestamps: true }
);

studentSchema.index({ name: 'text', rollNo: 'text' });

module.exports = mongoose.model('Student', studentSchema);
