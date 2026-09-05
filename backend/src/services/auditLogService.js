const prisma = require('../config/db');

const logAudit = async ({
  organizationId,
  userId = null,
  action,
  entity,
  entityId,
  previousState = null,
  newState = null,
  ipAddress = null,
}) => {
  try {
    return await prisma.auditLog.create({
      data: {
        organizationId,
        userId,
        action,
        entity,
        entityId: String(entityId),
        previousState: previousState ? (typeof previousState === 'string' ? previousState : JSON.stringify(previousState)) : null,
        newState: newState ? (typeof newState === 'string' ? newState : JSON.stringify(newState)) : null,
        ipAddress,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
    return null;
  }
};

module.exports = {
  logAudit,
};
