const prisma = require('../config/db');
const { logAudit } = require('./auditLogService');
const { sendNotification } = require('./notificationService');

const VALID_STAGES = [
  'LEAD',
  'QUALIFIED',
  'OPPORTUNITY',
  'QUOTE_DRAFT',
  'QUOTE_SENT',
  'NEGOTIATION',
  'APPROVAL_REQUIRED',
  'APPROVED',
  'CONTRACT_REVIEW',
  'CONTRACT_APPROVED',
  'CLOSED_WON',
  'CLOSED_LOST',
];

const STAGE_PROBABILITIES = {
  LEAD: 10,
  QUALIFIED: 20,
  OPPORTUNITY: 35,
  QUOTE_DRAFT: 50,
  QUOTE_SENT: 60,
  NEGOTIATION: 70,
  APPROVAL_REQUIRED: 65,
  APPROVED: 80,
  CONTRACT_REVIEW: 85,
  CONTRACT_APPROVED: 95,
  CLOSED_WON: 100,
  CLOSED_LOST: 0,
};

/**
 * Validates whether a deal stage transition is legal according to business rules.
 */
const validateStageTransition = async ({ deal, targetStage }) => {
  if (!VALID_STAGES.includes(targetStage)) {
    return { valid: false, message: `Invalid stage: ${targetStage}` };
  }

  // If attempting to close won, verify quote and contract conditions
  if (targetStage === 'CLOSED_WON') {
    const latestQuote = await prisma.quote.findFirst({
      where: { dealId: deal.id },
      orderBy: { version: 'desc' },
    });

    if (!latestQuote || !['APPROVED', 'ACCEPTED'].includes(latestQuote.status)) {
      return {
        valid: false,
        message: 'Cannot close deal as WON without an APPROVED or ACCEPTED quote.',
      };
    }

    const latestContract = await prisma.contract.findFirst({
      where: { dealId: deal.id },
      orderBy: { createdAt: 'desc' },
    });

    if (latestContract && !['APPROVED', 'SIGNED'].includes(latestContract.status)) {
      return {
        valid: false,
        message: 'Cannot close deal as WON while contract review is pending or rejected.',
      };
    }
  }

  // If moving to CONTRACT_REVIEW, ensure quote is approved
  if (targetStage === 'CONTRACT_REVIEW' || targetStage === 'CONTRACT_APPROVED') {
    const latestQuote = await prisma.quote.findFirst({
      where: { dealId: deal.id },
      orderBy: { version: 'desc' },
    });

    if (!latestQuote || !['APPROVED', 'ACCEPTED'].includes(latestQuote.status)) {
      return {
        valid: false,
        message: 'A deal cannot advance to contract review until quote discounts have been approved.',
      };
    }
  }

  return { valid: true };
};

/**
 * Executes a verified stage transition on a deal.
 */
const transitionDealStage = async ({
  dealId,
  targetStage,
  userId,
  organizationId,
  lossReason = null,
}) => {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: { account: true, owner: true },
  });

  if (!deal || deal.organizationId !== organizationId) {
    throw new Error('Deal not found or unauthorized');
  }

  const validation = await validateStageTransition({ deal, targetStage });
  if (!validation.valid) {
    throw new Error(validation.message);
  }

  const previousStage = deal.stage;
  const newProbability = STAGE_PROBABILITIES[targetStage] !== undefined ? STAGE_PROBABILITIES[targetStage] : deal.probability;

  const updatedDeal = await prisma.deal.update({
    where: { id: dealId },
    data: {
      stage: targetStage,
      probability: newProbability,
      lossReason: targetStage === 'CLOSED_LOST' ? lossReason : null,
      lastActivityAt: new Date(),
    },
    include: {
      account: true,
      owner: true,
      quotes: { orderBy: { version: 'desc' }, take: 1 },
    },
  });

  // Log Audit
  await logAudit({
    organizationId,
    userId,
    action: 'DEAL_STAGE_CHANGED',
    entity: 'DEAL',
    entityId: dealId,
    previousState: { stage: previousStage, probability: deal.probability },
    newState: { stage: targetStage, probability: newProbability },
  });

  // Notify deal owner if changed by another user
  if (deal.ownerId && deal.ownerId !== userId) {
    await sendNotification({
      organizationId,
      userId: deal.ownerId,
      title: `Deal Stage Updated: ${deal.title}`,
      message: `Deal stage moved from ${previousStage} to ${targetStage}.`,
      type: 'INFO',
      entityType: 'DEAL',
      entityId: dealId,
    });
  }

  return updatedDeal;
};

module.exports = {
  VALID_STAGES,
  STAGE_PROBABILITIES,
  validateStageTransition,
  transitionDealStage,
};
