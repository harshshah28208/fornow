const prisma = require('../config/db');
const { evaluateQuoteDiscount } = require('./discountEngine');
const { reserveFulfillmentStock } = require('./warehouseSplit');
const { logAudit } = require('./auditLogService');
const { sendNotification, notifyRole } = require('./notificationService');

/**
 * Pure business logic for approval workflow escalation and evaluation.
 */
const requestDiscountApproval = async ({ organizationId, quoteId, dealId, userId, requestedDiscount, reason, thresholdDiscount, riskScore, requiredRole }) => {
  const approval = await prisma.approval.create({
    data: {
      organizationId,
      quoteId,
      dealId,
      requestedById: userId,
      approverRole: requiredRole || 'SALES_MANAGER',
      requestedDiscount,
      thresholdDiscount: thresholdDiscount || 10,
      riskScore: riskScore || 0,
      reason: reason || 'Discount requested exceeds rep authority limit',
      status: 'PENDING',
    },
  });

  await notifyRole({
    organizationId,
    role: requiredRole || 'SALES_MANAGER',
    title: 'New Discount Approval Required',
    message: `Discount of ${requestedDiscount}% requested. Risk score: ${riskScore}.`,
    type: 'APPROVAL_REQUEST',
    entityType: 'QUOTE',
    entityId: quoteId,
  });

  return approval;
};

module.exports = {
  requestDiscountApproval,
  evaluateQuoteDiscount,
  reserveFulfillmentStock,
};
