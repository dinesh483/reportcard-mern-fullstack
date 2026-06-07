const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    actorRole: { type: String, required: true },
    operation: { type: String, enum: ['CREATE', 'UPDATE', 'DELETE'], required: true },
    entity: { type: String, required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: null },
    status: { type: String, enum: ['success', 'failed'], required: true },
    latencyMs: { type: Number, default: null },
    detail: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
