const prisma = require('../config/db');
const { success, error } = require('../utils/responseHelper');
const { logAudit } = require('../services/auditLogService');
const { transitionDealStage, VALID_STAGES } = require('../services/dealWorkflow');

const getDeals = async (req, res) => {
  try {
    const { stage, ownerId, search } = req.query;
    const where = { organizationId: req.organizationId };

    if (stage && stage !== 'ALL') where.stage = stage;
    if (ownerId) where.ownerId = ownerId;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { account: { name: { contains: search } } },
      ];
    }

    const deals = await prisma.deal.findMany({
      where,
      include: {
        account: true,
        contact: true,
        owner: true,
        quotes: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return success(res, 'Deals retrieved', deals);
  } catch (err) {
    return error(res, 'Failed to fetch deals', err.message, 500);
  }
};

const getPipelineBoard = async (req, res) => {
  try {
    const deals = await prisma.deal.findMany({
      where: { organizationId: req.organizationId },
      include: {
        account: true,
        owner: true,
        quotes: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Group by stage
    const columns = {};
    for (const st of VALID_STAGES) {
      columns[st] = [];
    }

    let totalPipelineValue = 0;
    let weightedPipelineValue = 0;

    for (const deal of deals) {
      if (columns[deal.stage]) {
        columns[deal.stage].push(deal);
      }
      if (!['CLOSED_WON', 'CLOSED_LOST'].includes(deal.stage)) {
        totalPipelineValue += deal.value;
        weightedPipelineValue += (deal.value * deal.probability) / 100;
      }
    }

    return success(res, 'Pipeline board retrieved', {
      columns,
      totalPipelineValue,
      weightedPipelineValue: Number(weightedPipelineValue.toFixed(2)),
      totalDealsCount: deals.length,
    });
  } catch (err) {
    return error(res, 'Failed to retrieve pipeline', err.message, 500);
  }
};

const getDealById = async (req, res) => {
  try {
    const deal = await prisma.deal.findUnique({
      where: { id: req.params.id },
      include: {
        account: {
          include: { contacts: true },
        },
        contact: true,
        owner: true,
        quotes: {
          orderBy: { version: 'desc' },
          include: {
            items: {
              include: {
                product: true,
                productPlan: true,
                warehouse: true,
              },
            },
            approvals: {
              include: { requestedBy: true, approver: true },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        approvals: {
          include: { requestedBy: true, approver: true, quote: true },
          orderBy: { createdAt: 'desc' },
        },
        contracts: {
          include: { legalReviewer: true, versions: true },
          orderBy: { createdAt: 'desc' },
        },
        invoices: {
          include: { items: true, payments: true },
          orderBy: { createdAt: 'desc' },
        },
        subscriptions: {
          include: { product: true, productPlan: true },
        },
        activities: {
          include: { user: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!deal || deal.organizationId !== req.organizationId) {
      return error(res, 'Deal not found', null, 404);
    }

    // Fetch audit logs for this deal
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        organizationId: req.organizationId,
        OR: [
          { entity: 'DEAL', entityId: deal.id },
          { entity: 'QUOTE', entityId: { in: deal.quotes.map((q) => q.id) } },
        ],
      },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return success(res, 'Deal details retrieved', {
      ...deal,
      auditLogs,
    });
  } catch (err) {
    return error(res, 'Failed to fetch deal', err.message, 500);
  }
};

const createDeal = async (req, res) => {
  try {
    const {
      accountId,
      contactId,
      ownerId,
      title,
      value,
      stage,
      expectedCloseDate,
      deliveryPromiseDate,
    } = req.body;

    if (!accountId || !title) {
      return error(res, 'Account and Deal Title are required', null, 400);
    }

    const deal = await prisma.deal.create({
      data: {
        organizationId: req.organizationId,
        accountId,
        contactId,
        ownerId: ownerId || req.user.id,
        title,
        value: parseFloat(value || 0),
        stage: stage || 'OPPORTUNITY',
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
        deliveryPromiseDate: deliveryPromiseDate ? new Date(deliveryPromiseDate) : null,
      },
      include: { account: true, owner: true },
    });

    await logAudit({
      organizationId: req.organizationId,
      userId: req.user.id,
      action: 'DEAL_CREATED',
      entity: 'DEAL',
      entityId: deal.id,
      newState: deal,
    });

    return success(res, 'Deal created successfully', deal, 201);
  } catch (err) {
    return error(res, 'Failed to create deal', err.message, 500);
  }
};

const updateDealStage = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetStage, lossReason } = req.body;

    if (!targetStage) {
      return error(res, 'Target stage is required', null, 400);
    }

    const updatedDeal = await transitionDealStage({
      dealId: id,
      targetStage,
      userId: req.user.id,
      organizationId: req.organizationId,
      lossReason,
    });

    return success(res, `Deal stage updated to ${targetStage}`, updatedDeal);
  } catch (err) {
    return error(res, err.message, null, 400);
  }
};

const updateDeal = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.deal.findUnique({ where: { id } });

    if (!existing || existing.organizationId !== req.organizationId) {
      return error(res, 'Deal not found', null, 404);
    }

    const {
      title,
      value,
      contactId,
      ownerId,
      expectedCloseDate,
      deliveryPromiseDate,
    } = req.body;

    const updated = await prisma.deal.update({
      where: { id },
      data: {
        title,
        value: value !== undefined ? parseFloat(value) : undefined,
        contactId,
        ownerId,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : undefined,
        deliveryPromiseDate: deliveryPromiseDate ? new Date(deliveryPromiseDate) : undefined,
        lastActivityAt: new Date(),
      },
      include: { account: true, owner: true },
    });

    return success(res, 'Deal updated successfully', updated);
  } catch (err) {
    return error(res, 'Failed to update deal', err.message, 500);
  }
};

module.exports = {
  getDeals,
  getPipelineBoard,
  getDealById,
  createDeal,
  updateDealStage,
  updateDeal,
};
