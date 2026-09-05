const prisma = require('../config/db');
const { success, error } = require('../utils/responseHelper');
const { logAudit } = require('../services/auditLogService');
const { sendNotification } = require('../services/notificationService');
const { reserveFulfillmentStock } = require('../services/warehouseSplit');

const getApprovals = async (req, res) => {
  try {
    const { status = 'PENDING' } = req.query;
    const where = { organizationId: req.organizationId };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    const approvals = await prisma.approval.findMany({
      where,
      include: {
        quote: {
          include: {
            items: { include: { product: true, warehouse: true } },
          },
        },
        deal: {
          include: { account: true, owner: true },
        },
        requestedBy: true,
        approver: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return success(res, 'Approvals retrieved', approvals);
  } catch (err) {
    return error(res, 'Failed to fetch approvals', err.message, 500);
  }
};

/**
 * Make a decision on a discount approval request (APPROVE, REJECT, or RETURN_FOR_REVISION).
 * Enforces strict backend role-based approval authority.
 */
const decideApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, comments } = req.body; // decision: 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED'

    if (!['APPROVED', 'REJECTED', 'REVISION_REQUESTED'].includes(decision)) {
      return error(res, 'Decision must be APPROVED, REJECTED, or REVISION_REQUESTED', null, 400);
    }

    const approval = await prisma.approval.findUnique({
      where: { id },
      include: {
        quote: { include: { items: true } },
        deal: { include: { owner: true } },
      },
    });

    if (!approval || approval.organizationId !== req.organizationId) {
      return error(res, 'Approval request not found', null, 404);
    }

    if (approval.status !== 'PENDING') {
      return error(res, `This approval has already been decided (${approval.status})`, null, 400);
    }

    // Role-based authorization check:
    // If required approverRole is 'FINANCE', SALES_REP cannot approve.
    // If required approverRole is 'ORG_ADMIN', only ORG_ADMIN or SUPER_ADMIN can approve.
    const userRole = req.user.role;
    if (userRole === 'SALES_REP') {
      return error(res, 'Sales Representatives do not have authority to approve discounts.', null, 403);
    }

    if (approval.approverRole === 'FINANCE' && !['FINANCE', 'ORG_ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      return error(res, 'This approval requires Finance or Executive authorization.', null, 403);
    }

    if (approval.approverRole === 'ORG_ADMIN' && !['ORG_ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      return error(res, 'This critical discount requires Organization Admin authorization.', null, 403);
    }

    const finalStatus = decision === 'APPROVED' ? 'APPROVED' : (decision === 'REJECTED' ? 'REJECTED' : 'CANCELLED');
    const quoteStatus = decision === 'APPROVED' ? 'APPROVED' : (decision === 'REJECTED' ? 'REJECTED' : 'DRAFT');
    const dealStage = decision === 'APPROVED' ? 'APPROVED' : (decision === 'REJECTED' ? 'NEGOTIATION' : 'QUOTE_DRAFT');

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Approval Record
      const updatedApproval = await tx.approval.update({
        where: { id },
        data: {
          status: finalStatus,
          approverId: req.user.id,
          comments: comments || `${decision} by ${req.user.firstName} ${req.user.lastName}`,
          decidedAt: new Date(),
        },
      });

      // 2. Update Quote Status
      const updatedQuote = await tx.quote.update({
        where: { id: approval.quoteId },
        data: {
          status: quoteStatus,
        },
      });

      // 3. Update Deal Stage
      const updatedDeal = await tx.deal.update({
        where: { id: approval.dealId },
        data: {
          stage: dealStage,
          lastActivityAt: new Date(),
        },
      });

      // 4. If approved, reserve warehouse stock
      if (decision === 'APPROVED' && approval.quote.items.length) {
        await reserveFulfillmentStock({
          organizationId: req.organizationId,
          quoteItems: approval.quote.items,
        });
      }

      return { approval: updatedApproval, quote: updatedQuote, deal: updatedDeal };
    });

    // Audit Log
    await logAudit({
      organizationId: req.organizationId,
      userId: req.user.id,
      action: decision === 'APPROVED' ? 'DISCOUNT_APPROVED' : (decision === 'REJECTED' ? 'DISCOUNT_REJECTED' : 'DISCOUNT_REVISION_REQUESTED'),
      entity: 'APPROVAL',
      entityId: id,
      previousState: { status: 'PENDING' },
      newState: { status: finalStatus, decidedBy: req.user.email, comments },
    });

    // Notify Requesting Sales Rep
    if (approval.requestedById) {
      await sendNotification({
        organizationId: req.organizationId,
        userId: approval.requestedById,
        title: `Discount ${decision === 'APPROVED' ? 'Approved' : 'Decision: ' + decision}`,
        message: `Your discount request for Quote ${approval.quote.quoteNumber} (${approval.requestedDiscount}%) was ${decision.toLowerCase()} by ${req.user.firstName}. Notes: ${comments || 'None'}`,
        type: 'APPROVAL_DECISION',
        entityType: 'QUOTE',
        entityId: approval.quoteId,
      });
    }

    return success(res, `Approval decision recorded: ${decision}`, result);
  } catch (err) {
    console.error('Approval decision error:', err);
    return error(res, 'Failed to process approval decision', err.message, 500);
  }
};

module.exports = {
  getApprovals,
  decideApproval,
};
