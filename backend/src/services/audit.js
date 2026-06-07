const winston = require('winston');
const AuditLog = require('../models/AuditLog');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});

/**
 * Write a structured audit log entry to both MongoDB and stdout.
 */
async function logAction({
  actorId,
  actorRole,
  operation,
  entity,
  entityId = null,
  studentId = null,
  status = 'success',
  latencyMs = null,
  detail = null,
}) {
  try {
    await AuditLog.create({
      actorId,
      actorRole,
      operation,
      entity,
      entityId,
      studentId,
      status,
      latencyMs,
      detail,
    });
  } catch (err) {
    // Never let audit failures break the main flow
    logger.error({ msg: 'audit_write_failed', error: err.message });
  }

  logger.info({
    actor_id: actorId,
    actor_role: actorRole,
    operation,
    entity,
    entity_id: entityId,
    student_id: studentId,
    status,
    latency_ms: latencyMs,
    detail,
  });
}

module.exports = { logAction, logger };
