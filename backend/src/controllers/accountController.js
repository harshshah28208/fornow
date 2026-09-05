const prisma = require('../config/db');
const { success, error } = require('../utils/responseHelper');
const { logAudit } = require('../services/auditLogService');

const getAccounts = async (req, res) => {
  try {
    const { tier, segment, search } = req.query;
    const where = { organizationId: req.organizationId };

    if (tier && tier !== 'ALL') where.tier = tier;
    if (segment && segment !== 'ALL') where.segment = segment;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { industry: { contains: search } },
        { website: { contains: search } },
      ];
    }

    const accounts = await prisma.account.findMany({
      where,
      include: {
        owner: true,
        contacts: true,
        deals: { select: { id: true, title: true, value: true, stage: true } },
        invoices: { select: { id: true, totalAmount: true, amountPaid: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const enriched = accounts.map((acc) => {
      const totalRevenue = acc.invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
      const activeDealsCount = acc.deals.filter((d) => !['CLOSED_WON', 'CLOSED_LOST'].includes(d.stage)).length;
      return {
        ...acc,
        totalRevenue,
        activeDealsCount,
        contactsCount: acc.contacts.length,
      };
    });

    return success(res, 'Accounts retrieved', enriched);
  } catch (err) {
    return error(res, 'Failed to retrieve accounts', err.message, 500);
  }
};

const getAccountById = async (req, res) => {
  try {
    const account = await prisma.account.findUnique({
      where: { id: req.params.id },
      include: {
        owner: true,
        contacts: true,
        deals: {
          include: {
            quotes: { orderBy: { version: 'desc' } },
            contracts: true,
          },
        },
        contracts: { orderBy: { createdAt: 'desc' } },
        invoices: { orderBy: { createdAt: 'desc' }, include: { payments: true } },
        subscriptions: { include: { product: true, productPlan: true } },
        activities: { include: { user: true }, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!account || account.organizationId !== req.organizationId) {
      return error(res, 'Account not found', null, 404);
    }

    return success(res, 'Account 360 profile retrieved', account);
  } catch (err) {
    return error(res, 'Failed to fetch account', err.message, 500);
  }
};

const createAccount = async (req, res) => {
  try {
    const { name, industry, size, segment, tier, website, phone, address, ownerId } = req.body;
    if (!name) return error(res, 'Account name is required', null, 400);

    const account = await prisma.account.create({
      data: {
        organizationId: req.organizationId,
        ownerId: ownerId || req.user.id,
        name,
        industry,
        size,
        segment: segment || 'MID_MARKET',
        tier: tier || 'BRONZE',
        website,
        phone,
        address,
        status: 'ACTIVE',
      },
      include: { owner: true },
    });

    await logAudit({
      organizationId: req.organizationId,
      userId: req.user.id,
      action: 'ACCOUNT_CREATED',
      entity: 'ACCOUNT',
      entityId: account.id,
      newState: account,
    });

    return success(res, 'Account created successfully', account, 201);
  } catch (err) {
    return error(res, 'Failed to create account', err.message, 500);
  }
};

const updateAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.account.findUnique({ where: { id } });

    if (!existing || existing.organizationId !== req.organizationId) {
      return error(res, 'Account not found', null, 404);
    }

    const { name, industry, size, segment, tier, website, phone, address, status, ownerId } = req.body;

    const updated = await prisma.account.update({
      where: { id },
      data: {
        name,
        industry,
        size,
        segment,
        tier,
        website,
        phone,
        address,
        status,
        ownerId,
      },
      include: { owner: true },
    });

    await logAudit({
      organizationId: req.organizationId,
      userId: req.user.id,
      action: 'ACCOUNT_UPDATED',
      entity: 'ACCOUNT',
      entityId: id,
      previousState: existing,
      newState: updated,
    });

    return success(res, 'Account updated successfully', updated);
  } catch (err) {
    return error(res, 'Failed to update account', err.message, 500);
  }
};

const deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const account = await prisma.account.findUnique({ where: { id } });

    if (!account || account.organizationId !== req.organizationId) {
      return error(res, 'Account not found', null, 404);
    }

    await prisma.account.delete({ where: { id } });

    await logAudit({
      organizationId: req.organizationId,
      userId: req.user.id,
      action: 'ACCOUNT_DELETED',
      entity: 'ACCOUNT',
      entityId: id,
    });

    return success(res, 'Account deleted successfully');
  } catch (err) {
    return error(res, 'Failed to delete account', err.message, 500);
  }
};

/**
 * Admin Override Customer Tier (Locks tier from self-modification)
 */
const adminOverrideCustomerTier = async (req, res) => {
  try {
    const { id } = req.params;
    const { tier } = req.body;

    const account = await prisma.account.findUnique({ where: { id } });
    if (!account || account.organizationId !== req.organizationId) {
      return error(res, 'Account not found', null, 404);
    }

    const updated = await prisma.account.update({
      where: { id },
      data: {
        tier,
        tierSetBy: 'ADMIN',
        tierLockedByAdmin: true,
        updatedAt: new Date(),
      },
    });

    await logAudit({
      organizationId: req.organizationId,
      userId: req.user.id,
      action: 'CUSTOMER_TIER_ADMIN_LOCKED',
      entity: 'ACCOUNT',
      entityId: id,
      previousState: { tier: account.tier, tierSetBy: account.tierSetBy, tierLockedByAdmin: account.tierLockedByAdmin },
      newState: { tier, tierSetBy: 'ADMIN', tierLockedByAdmin: true },
    });

    return success(res, `Customer tier locked to ${tier} by Administrator`, updated);
  } catch (err) {
    return error(res, 'Failed to override customer tier', err.message, 500);
  }
};

module.exports = {
  getAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  adminOverrideCustomerTier,
};
