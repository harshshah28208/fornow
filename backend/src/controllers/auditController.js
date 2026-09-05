const prisma = require('../config/db');
const { success, error } = require('../utils/responseHelper');

const getAuditLogs = async (req, res) => {
  try {
    const { entity, action, search } = req.query;
    const where = { organizationId: req.organizationId };

    if (entity && entity !== 'ALL') where.entity = entity;
    if (action && action !== 'ALL') where.action = action;
    if (search) {
      where.OR = [
        { action: { contains: search } },
        { entity: { contains: search } },
        { entityId: { contains: search } },
      ];
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return success(res, 'Audit logs retrieved', logs);
  } catch (err) {
    return error(res, 'Failed to fetch audit logs', err.message, 500);
  }
};

module.exports = {
  getAuditLogs,
};
