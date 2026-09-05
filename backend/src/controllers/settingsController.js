const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { success, error } = require('../utils/responseHelper');
const { logAudit } = require('../services/auditLogService');

// ----------------------------------------
// Organization Settings
// ----------------------------------------
const getOrgSettings = async (req, res) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.organizationId },
    });
    return success(res, 'Organization settings retrieved', org);
  } catch (err) {
    return error(res, 'Failed to fetch settings', err.message, 500);
  }
};

const updateOrgSettings = async (req, res) => {
  try {
    const { name, logo, currency, currencySymbol, timezone } = req.body;

    const updated = await prisma.organization.update({
      where: { id: req.organizationId },
      data: {
        name,
        logo,
        currency,
        currencySymbol,
        timezone,
      },
    });

    await logAudit({
      organizationId: req.organizationId,
      userId: req.user.id,
      action: 'ORG_SETTINGS_UPDATED',
      entity: 'ORGANIZATION',
      entityId: req.organizationId,
      newState: updated,
    });

    return success(res, 'Organization settings updated', updated);
  } catch (err) {
    return error(res, 'Failed to update organization', err.message, 500);
  }
};

// ----------------------------------------
// Users Management
// ----------------------------------------
const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { organizationId: req.organizationId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        title: true,
        phone: true,
        avatar: true,
        isActive: true,
        historicalAvgDiscount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    return success(res, 'Users retrieved', users);
  } catch (err) {
    return error(res, 'Failed to fetch users', err.message, 500);
  }
};

const createUser = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, title, phone, historicalAvgDiscount } = req.body;
    if (!email || !password || !firstName || !lastName) {
      return error(res, 'Email, password, first name and last name are required', null, 400);
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existing) {
      return error(res, 'User email already registered', null, 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        organizationId: req.organizationId,
        email: email.toLowerCase().trim(),
        passwordHash,
        firstName,
        lastName,
        role: role || 'SALES_REP',
        title,
        phone,
        historicalAvgDiscount: historicalAvgDiscount !== undefined ? parseFloat(historicalAvgDiscount) : 5.0,
      },
    });

    await logAudit({
      organizationId: req.organizationId,
      userId: req.user.id,
      action: 'USER_CREATED',
      entity: 'USER',
      entityId: user.id,
      newState: { email: user.email, role: user.role },
    });

    return success(res, 'User created successfully', user, 201);
  } catch (err) {
    return error(res, 'Failed to create user', err.message, 500);
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, role, title, phone, isActive, historicalAvgDiscount } = req.body;

    const updated = await prisma.user.update({
      where: { id },
      data: {
        firstName,
        lastName,
        role,
        title,
        phone,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        historicalAvgDiscount: historicalAvgDiscount !== undefined ? parseFloat(historicalAvgDiscount) : undefined,
      },
    });

    return success(res, 'User updated successfully', updated);
  } catch (err) {
    return error(res, 'Failed to update user', err.message, 500);
  }
};

// ----------------------------------------
// Discount Governance Rules (Configurable)
// ----------------------------------------
const getDiscountRules = async (req, res) => {
  try {
    const rules = await prisma.discountRule.findMany({
      where: { organizationId: req.organizationId },
      orderBy: { sequenceOrder: 'asc' },
    });
    return success(res, 'Discount rules retrieved', rules);
  } catch (err) {
    return error(res, 'Failed to fetch discount rules', err.message, 500);
  }
};

const createDiscountRule = async (req, res) => {
  try {
    const { name, customerTier, productCategory, maxRepDiscount, maxManagerDiscount, maxFinanceDiscount, sequenceOrder } = req.body;
    if (!name) return error(res, 'Rule name is required', null, 400);

    const rule = await prisma.discountRule.create({
      data: {
        organizationId: req.organizationId,
        name,
        customerTier: customerTier || 'ALL',
        productCategory: productCategory || 'ALL',
        maxRepDiscount: parseFloat(maxRepDiscount || 5.0),
        maxManagerDiscount: parseFloat(maxManagerDiscount || 15.0),
        maxFinanceDiscount: parseFloat(maxFinanceDiscount || 30.0),
        sequenceOrder: sequenceOrder ? parseInt(sequenceOrder, 10) : 1,
      },
    });

    await logAudit({
      organizationId: req.organizationId,
      userId: req.user.id,
      action: 'DISCOUNT_RULE_CREATED',
      entity: 'DISCOUNT_RULE',
      entityId: rule.id,
      newState: rule,
    });

    return success(res, 'Discount rule created', rule, 201);
  } catch (err) {
    return error(res, 'Failed to create discount rule', err.message, 500);
  }
};

const updateDiscountRule = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, customerTier, productCategory, maxRepDiscount, maxManagerDiscount, maxFinanceDiscount, isActive } = req.body;

    const updated = await prisma.discountRule.update({
      where: { id },
      data: {
        name,
        customerTier,
        productCategory,
        maxRepDiscount: maxRepDiscount !== undefined ? parseFloat(maxRepDiscount) : undefined,
        maxManagerDiscount: maxManagerDiscount !== undefined ? parseFloat(maxManagerDiscount) : undefined,
        maxFinanceDiscount: maxFinanceDiscount !== undefined ? parseFloat(maxFinanceDiscount) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
    });

    return success(res, 'Discount rule updated', updated);
  } catch (err) {
    return error(res, 'Failed to update discount rule', err.message, 500);
  }
};

// ----------------------------------------
// Organization Billing & Subscription
// ----------------------------------------
const getBillingInfo = async (req, res) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.organizationId },
    });

    const activeUsersCount = await prisma.user.count({
      where: { organizationId: req.organizationId, isActive: true },
    });

    const mockPlans = [
      { id: 'STARTER', name: 'Starter Tier', price: 9999, maxUsers: 5, features: ['Standard Deals', 'Basic Quotes', 'Up to 5% Rep Discount'] },
      { id: 'PROFESSIONAL', name: 'Professional Tier', price: 24999, maxUsers: 20, features: ['Advanced Pipeline', 'Blended Risk Score', 'Multi-level Approvals', 'Legal Review'] },
      { id: 'ENTERPRISE', name: 'Enterprise DealFlow 360', price: 49999, maxUsers: 50, features: ['Unlimited Workflows', 'Multi-Warehouse Auto-Split', 'Hybrid Billing Engine', 'Real-Time Anomaly Dashboard', 'Custom API & Audit Logs'] },
    ];

    return success(res, 'Billing and subscription info', {
      currentPlan: org.plan,
      subscriptionStatus: org.subscriptionStatus,
      billingCycle: org.billingCycle,
      renewalDate: org.renewalDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      activeUsersCount,
      maxUsers: org.maxUsers,
      availablePlans: mockPlans,
    });
  } catch (err) {
    return error(res, 'Failed to fetch billing info', err.message, 500);
  }
};

const updateBillingPlan = async (req, res) => {
  try {
    const { planId, billingCycle } = req.body;

    const updated = await prisma.organization.update({
      where: { id: req.organizationId },
      data: {
        plan: planId,
        billingCycle: billingCycle || 'ANNUAL',
        subscriptionStatus: 'ACTIVE',
      },
    });

    await logAudit({
      organizationId: req.organizationId,
      userId: req.user.id,
      action: 'ORGANIZATION_PLAN_UPGRADED',
      entity: 'ORGANIZATION',
      entityId: req.organizationId,
      newState: { plan: planId, billingCycle },
    });

    return success(res, `Organization plan successfully updated to ${planId}`, updated);
  } catch (err) {
    return error(res, 'Failed to update billing plan', err.message, 500);
  }
};

module.exports = {
  getOrgSettings,
  updateOrgSettings,
  getUsers,
  createUser,
  updateUser,
  getDiscountRules,
  createDiscountRule,
  updateDiscountRule,
  getBillingInfo,
  updateBillingPlan,
};
