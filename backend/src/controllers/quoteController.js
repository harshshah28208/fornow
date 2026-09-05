const prisma = require('../config/db');
const { success, error } = require('../utils/responseHelper');
const { logAudit } = require('../services/auditLogService');
const { sendNotification, notifyRole } = require('../services/notificationService');
const { evaluateQuoteDiscount } = require('../services/discountEngine');
const { calculatePricing } = require('../services/pricingService');
const { calculateWarehouseSplit, reserveFulfillmentStock } = require('../services/warehouseSplit');

/**
 * Preview pricing & blended discount risk in real time.
 */
const previewQuotePricing = async (req, res) => {
  try {
    const { items = [], orderLevelDiscount = 0, accountId } = req.body;

    let customerTier = 'BRONZE';
    if (accountId) {
      const account = await prisma.account.findUnique({ where: { id: accountId } });
      if (account) customerTier = account.tier;
    }

    // Dynamic pricing calculation
    const pricing = await calculatePricing({
      organizationId: req.organizationId,
      items,
      customerTier,
    });

    // Blended discount evaluation
    const discountEval = await evaluateQuoteDiscount({
      organizationId: req.organizationId,
      customerTier,
      items: pricing.items,
      orderLevelDiscount: parseFloat(orderLevelDiscount || 0),
      repId: req.user.id,
    });

    // Warehouse Split Recommendation
    const warehouseSplit = await calculateWarehouseSplit({
      organizationId: req.organizationId,
      items: pricing.items,
    });

    return success(res, 'Quote calculation preview', {
      pricing,
      discountEval,
      warehouseSplit,
    });
  } catch (err) {
    return error(res, 'Failed to calculate quote preview', err.message, 500);
  }
};

/**
 * Create or Save a new Quote / Quote Revision.
 */
const saveQuote = async (req, res) => {
  try {
    const {
      dealId,
      items = [],
      orderLevelDiscount = 0,
      billingFrequency = 'MONTHLY',
      notes,
      terms,
      isSubmitForApproval = false,
      warehouseAllocations = [], // [{ productId, warehouseId }]
    } = req.body;

    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: { account: true, quotes: { orderBy: { version: 'desc' } } },
    });

    if (!deal || deal.organizationId !== req.organizationId) {
      return error(res, 'Deal not found', null, 404);
    }

    // 1. Calculate pricing
    const pricing = await calculatePricing({
      organizationId: req.organizationId,
      items,
      customerTier: deal.account.tier,
    });

    // 2. Evaluate discount governance & blended risk score
    const discountEval = await evaluateQuoteDiscount({
      organizationId: req.organizationId,
      customerTier: deal.account.tier,
      items: pricing.items,
      orderLevelDiscount: parseFloat(orderLevelDiscount || 0),
      repId: req.user.id,
    });

    // Determine Version Number & Quote Number
    const latestQuote = deal.quotes[0];
    const newVersion = latestQuote ? latestQuote.version + 1 : 1;
    const count = await prisma.quote.count({ where: { organizationId: req.organizationId } });
    const quoteNumber = `QT-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}-V${newVersion}`;

    // Status Determination:
    // If submit for approval requested:
    // - If discountEval.requiresApproval is true -> PENDING_APPROVAL
    // - If discountEval.requiresApproval is false -> APPROVED / READY_TO_SEND
    let quoteStatus = 'DRAFT';
    if (isSubmitForApproval) {
      quoteStatus = discountEval.requiresApproval ? 'PENDING_APPROVAL' : 'APPROVED';
    }

    const quote = await prisma.quote.create({
      data: {
        organizationId: req.organizationId,
        dealId: deal.id,
        version: newVersion,
        quoteNumber,
        status: quoteStatus,
        subtotal: pricing.subtotal,
        costSubtotal: pricing.costSubtotal,
        discountPercent: discountEval.discountPercent,
        discountAmount: discountEval.discountAmount,
        blendedRiskScore: discountEval.blendedRiskScore,
        requiredApprovalRole: discountEval.requiredApprovalRole,
        taxAmount: pricing.taxAmount,
        totalAmount: pricing.totalAmount,
        oneTimeTotal: pricing.oneTimeTotal,
        recurringTotal: pricing.recurringTotal,
        billingFrequency,
        marginPercent: pricing.marginPercent,
        notes,
        terms,
        items: {
          create: pricing.items.map((it) => {
            const alloc = warehouseAllocations.find((w) => w.productId === it.productId);
            return {
              productId: it.productId,
              productPlanId: it.productPlanId,
              warehouseId: alloc ? alloc.warehouseId : null,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              costPrice: it.costPrice,
              discountPercent: it.discountPercent,
              discountAmount: it.discountAmount,
              taxAmount: it.taxAmount,
              totalAmount: it.totalAmount,
              billingModel: it.billingModel,
            };
          }),
        },
      },
      include: { items: { include: { product: true, warehouse: true } } },
    });

    // Update Deal Value and Margin
    await prisma.deal.update({
      where: { id: deal.id },
      data: {
        value: pricing.totalAmount,
        costTotal: pricing.costSubtotal,
        marginPercent: pricing.marginPercent,
        stage: quoteStatus === 'PENDING_APPROVAL' ? 'APPROVAL_REQUIRED' : (deal.stage === 'LEAD' || deal.stage === 'QUALIFIED' ? 'QUOTE_DRAFT' : deal.stage),
        lastActivityAt: new Date(),
      },
    });

    // Create Approval Record if approval required
    let approvalRecord = null;
    if (quoteStatus === 'PENDING_APPROVAL') {
      approvalRecord = await prisma.approval.create({
        data: {
          organizationId: req.organizationId,
          quoteId: quote.id,
          dealId: deal.id,
          requestedById: req.user.id,
          approverRole: discountEval.requiredApprovalRole,
          requestedDiscount: discountEval.discountPercent,
          thresholdDiscount: deal.account.tier === 'GOLD' ? 15 : (deal.account.tier === 'SILVER' ? 10 : 5),
          riskScore: discountEval.blendedRiskScore,
          reason: discountEval.approvalReason,
          status: 'PENDING',
        },
      });

      // Audit Log
      await logAudit({
        organizationId: req.organizationId,
        userId: req.user.id,
        action: 'DISCOUNT_APPROVAL_REQUESTED',
        entity: 'QUOTE',
        entityId: quote.id,
        newState: {
          quoteNumber,
          discountPercent: discountEval.discountPercent,
          blendedRiskScore: discountEval.blendedRiskScore,
          requiredRole: discountEval.requiredApprovalRole,
        },
      });

      // Notify Approver Role (Sales Manager / Finance)
      await notifyRole({
        organizationId: req.organizationId,
        role: discountEval.requiredApprovalRole,
        title: `Discount Approval Required for ${deal.title}`,
        message: `${req.user.firstName} requested ${discountEval.discountPercent}% discount (Risk Score: ${discountEval.blendedRiskScore}). Reason: ${discountEval.approvalReason}`,
        type: 'APPROVAL_REQUEST',
        entityType: 'QUOTE',
        entityId: quote.id,
      });
    }

    return success(res, isSubmitForApproval ? (quoteStatus === 'PENDING_APPROVAL' ? 'Quote submitted for discount approval' : 'Quote approved and ready') : 'Quote draft saved successfully', {
      quote,
      discountEval,
      approvalRecord,
    }, 201);
  } catch (err) {
    console.error('Save quote error:', err);
    return error(res, 'Failed to save quote', err.message, 500);
  }
};

const getQuoteById = async (req, res) => {
  try {
    const quote = await prisma.quote.findUnique({
      where: { id: req.params.id },
      include: {
        deal: { include: { account: true, owner: true } },
        items: { include: { product: true, productPlan: true, warehouse: true } },
        approvals: { include: { requestedBy: true, approver: true }, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!quote || quote.organizationId !== req.organizationId) {
      return error(res, 'Quote not found', null, 404);
    }

    return success(res, 'Quote retrieved', quote);
  } catch (err) {
    return error(res, 'Failed to fetch quote', err.message, 500);
  }
};

// -------------------------------------------------------------
// Customer Negotiation Portal (Dedicated, Restricted View)
// -------------------------------------------------------------
const getPortalQuote = async (req, res) => {
  try {
    const { id } = req.params;
    const quote = await prisma.quote.findFirst({
      where: {
        OR: [
          { id: id },
          { quoteNumber: id },
        ],
      },
      include: {
        deal: {
          select: {
            id: true,
            title: true,
            account: { select: { id: true, name: true, tier: true } },
            owner: { select: { firstName: true, lastName: true, email: true, phone: true } },
          },
        },
        items: {
          select: {
            id: true,
            quantity: true,
            unitPrice: true,
            discountPercent: true,
            discountAmount: true,
            totalAmount: true,
            billingModel: true,
            product: { select: { name: true, category: true, description: true } },
          },
        },
      },
    });

    if (!quote) {
      return error(res, 'Quotation not found or link has expired', null, 404);
    }

    return success(res, 'Customer quote portal data', quote);
  } catch (err) {
    return error(res, 'Failed to load customer quote portal', err.message, 500);
  }
};

const submitCustomerNegotiation = async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback, counterDiscountPercent, isAccepted } = req.body;

    const quote = await prisma.quote.findFirst({
      where: {
        OR: [
          { id: id },
          { quoteNumber: id },
        ],
      },
      include: { deal: { include: { account: true, owner: true } }, items: { include: { product: true } } },
    });

    if (!quote) {
      return error(res, 'Quote not found', null, 404);
    }

    if (isAccepted) {
      // Customer confirmed quote terms
      const updated = await prisma.quote.update({
        where: { id: quote.id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
          customerFeedback: feedback || 'Accepted customer terms.',
        },
      });

      await prisma.deal.update({
        where: { id: quote.dealId },
        data: { stage: 'CONTRACT_REVIEW', lastActivityAt: new Date() },
      });

      if (quote.deal?.ownerId) {
        await sendNotification({
          organizationId: quote.organizationId,
          userId: quote.deal.ownerId,
          title: `Quote Accepted by Customer: ${quote.quoteNumber}`,
          message: `The customer accepted quote ${quote.quoteNumber} for deal ${quote.deal.title}. Ready for contract generation.`,
          type: 'INFO',
          entityType: 'QUOTE',
          entityId: quote.id,
        });
      }

      return success(res, 'Quotation accepted successfully! Our team will prepare the final contract.', updated);
    }

    // Customer proposed a counter-discount or submitted feedback
    const counterPct = parseFloat(counterDiscountPercent || 0);

    // Evaluate if counter-discount exceeds allowed threshold and triggers re-approval
    const discountEval = await evaluateQuoteDiscount({
      organizationId: quote.organizationId,
      customerTier: quote.deal?.account?.tier || 'STANDARD',
      items: quote.items.map((it) => ({
        category: it.product?.category || 'SUBSCRIPTION',
        unitPrice: it.unitPrice,
        quantity: it.quantity,
        discountPercent: counterPct > 0 ? counterPct : it.discountPercent,
        costPrice: it.costPrice,
      })),
      orderLevelDiscount: counterPct,
    });

    const newStatus = discountEval.requiresApproval ? 'PENDING_APPROVAL' : 'NEGOTIATION';

    const updated = await prisma.quote.update({
      where: { id: quote.id },
      data: {
        status: newStatus,
        customerFeedback: feedback,
        customerCounterDiscount: counterPct > 0 ? counterPct : undefined,
        blendedRiskScore: discountEval.blendedRiskScore,
        requiredApprovalRole: discountEval.requiredApprovalRole,
      },
    });

    await prisma.deal.update({
      where: { id: quote.dealId },
      data: {
        stage: newStatus === 'PENDING_APPROVAL' ? 'APPROVAL_REQUIRED' : 'NEGOTIATION',
        lastActivityAt: new Date(),
      },
    });

    if (newStatus === 'PENDING_APPROVAL') {
      await prisma.approval.create({
        data: {
          organizationId: quote.organizationId,
          quoteId: quote.id,
          dealId: quote.dealId,
          requestedById: quote.deal?.ownerId || quote.deal?.accountId || quote.organizationId,
          approverRole: discountEval.requiredApprovalRole || 'SALES_MANAGER',
          requestedDiscount: counterPct,
          thresholdDiscount: quote.deal?.account?.tier === 'GOLD' ? 15 : 10,
          riskScore: discountEval.blendedRiskScore || 0,
          reason: `Customer counter-offer of ${counterPct}% requires re-approval. Customer note: ${feedback || 'None'}`,
          status: 'PENDING',
        },
      });

      await notifyRole({
        organizationId: quote.organizationId,
        role: discountEval.requiredApprovalRole || 'SALES_MANAGER',
        title: `Customer Counter-Offer Re-Approval Needed`,
        message: `Customer countered with ${counterPct}% discount on quote ${quote.quoteNumber}.`,
        type: 'APPROVAL_REQUEST',
        entityType: 'QUOTE',
        entityId: quote.id,
      });
    }

    return success(res, 'Negotiation proposal submitted to sales team', updated);
  } catch (err) {
    return error(res, 'Failed to submit customer negotiation', err.message, 500);
  }
};

module.exports = {
  previewQuotePricing,
  saveQuote,
  getQuoteById,
  getPortalQuote,
  submitCustomerNegotiation,
};
