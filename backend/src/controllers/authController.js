const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { generateToken } = require('../utils/token');
const { success, error } = require('../utils/responseHelper');
const { logAudit } = require('../services/auditLogService');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return error(res, 'Email and password are required', null, 400);
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { organization: true },
    });

    if (!user) {
      return error(res, 'Invalid email or password', null, 401);
    }

    if (!user.isActive) {
      return error(res, 'Your account is deactivated. Contact your administrator.', null, 403);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return error(res, 'Invalid email or password', null, 401);
    }

    const token = generateToken({
      userId: user.id,
      organizationId: user.organizationId,
      role: user.role,
    });

    await logAudit({
      organizationId: user.organizationId,
      userId: user.id,
      action: 'USER_LOGIN',
      entity: 'USER',
      entityId: user.id,
      ipAddress: req.ip,
    });

    return success(res, 'Login successful', {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
        organization: {
          id: user.organization.id,
          name: user.organization.name,
          currency: user.organization.currency,
          currencySymbol: user.organization.currencySymbol,
          plan: user.organization.plan,
        },
      },
    });
  } catch (err) {
    console.error('Login Error:', err);
    return error(res, 'Login failed', err.message, 500);
  }
};

const register = async (req, res) => {
  try {
    const { orgName, firstName, lastName, email, password } = req.body;
    if (!orgName || !firstName || !lastName || !email || !password) {
      return error(res, 'All fields are required', null, 400);
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return error(res, 'A user with this email already exists', null, 409);
    }

    const slug = orgName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(1000 + Math.random() * 9000);
    const passwordHash = await bcrypt.hash(password, 10);

    // Create Org, User, Default Warehouses & Default Discount Rules in transaction
    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: orgName,
          slug,
          plan: 'ENTERPRISE',
        },
      });

      const user = await tx.user.create({
        data: {
          organizationId: org.id,
          email: email.toLowerCase().trim(),
          passwordHash,
          firstName,
          lastName,
          role: 'ORG_ADMIN',
        },
      });

      // Default Main Warehouse
      await tx.warehouse.create({
        data: {
          organizationId: org.id,
          name: 'Main Distribution Center',
          code: 'WH-MAIN',
          location: 'Central Logistics Hub',
          shippingCostWeight: 1.0,
          isMain: true,
        },
      });

      // Default Secondary Depot
      await tx.warehouse.create({
        data: {
          organizationId: org.id,
          name: 'East Coast Depot',
          code: 'WH-EAST',
          location: 'East Coast Terminal',
          shippingCostWeight: 1.35,
          isMain: false,
        },
      });

      // Default Discount Governance Rules
      await tx.discountRule.createMany({
        data: [
          {
            organizationId: org.id,
            name: 'Standard Hardware Rule',
            customerTier: 'ALL',
            productCategory: 'HARDWARE',
            maxRepDiscount: 5.0,
            maxManagerDiscount: 15.0,
            maxFinanceDiscount: 30.0,
            sequenceOrder: 1,
          },
          {
            organizationId: org.id,
            name: 'Services Low Margin Rule',
            customerTier: 'ALL',
            productCategory: 'SERVICES',
            maxRepDiscount: 3.0,
            maxManagerDiscount: 10.0,
            maxFinanceDiscount: 20.0,
            sequenceOrder: 2,
          },
          {
            organizationId: org.id,
            name: 'Subscription Rule',
            customerTier: 'ALL',
            productCategory: 'SUBSCRIPTION',
            maxRepDiscount: 5.0,
            maxManagerDiscount: 15.0,
            maxFinanceDiscount: 25.0,
            sequenceOrder: 3,
          },
        ],
      });

      return { org, user };
    });

    const token = generateToken({
      userId: result.user.id,
      organizationId: result.org.id,
      role: result.user.role,
    });

    return success(res, 'Registration successful', {
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
        organization: {
          id: result.org.id,
          name: result.org.name,
          currency: result.org.currency,
          currencySymbol: result.org.currencySymbol,
        },
      },
    }, 201);
  } catch (err) {
    console.error('Register Error:', err);
    return error(res, 'Registration failed', err.message, 500);
  }
};

const getMe = async (req, res) => {
  try {
    return success(res, 'Current user profile', {
      id: req.user.id,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      role: req.user.role,
      avatar: req.user.avatar,
      title: req.user.title,
      historicalAvgDiscount: req.user.historicalAvgDiscount,
      organization: {
        id: req.user.organization.id,
        name: req.user.organization.name,
        currency: req.user.organization.currency,
        currencySymbol: req.user.organization.currencySymbol,
        plan: req.user.organization.plan,
        subscriptionStatus: req.user.organization.subscriptionStatus,
      },
    });
  } catch (err) {
    return error(res, 'Failed to retrieve profile', err.message, 500);
  }
};

// Fast Demo Switch Role endpoint to easily evaluate different user perspectives
const switchDemoUser = async (req, res) => {
  try {
    const { role } = req.body;
    const targetUser = await prisma.user.findFirst({
      where: {
        organizationId: req.organizationId,
        role,
        isActive: true,
      },
      include: { organization: true },
    });

    if (!targetUser) {
      return error(res, `No active demo user found for role ${role}`, null, 404);
    }

    const token = generateToken({
      userId: targetUser.id,
      organizationId: targetUser.organizationId,
      role: targetUser.role,
    });

    return success(res, `Switched to ${role}`, {
      token,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        role: targetUser.role,
        avatar: targetUser.avatar,
        organization: targetUser.organization,
      },
    });
  } catch (err) {
    return error(res, 'Failed to switch demo user', err.message, 500);
  }
};

/**
 * Customer Portal Self-Registration with Tier Selection
 */
const portalSignup = async (req, res) => {
  try {
    const { companyName, email, password, tier = 'BRONZE' } = req.body;
    if (!companyName || !email || !password) {
      return error(res, 'Company name, email, and password are required', null, 400);
    }

    // Find default demo organization
    const org = await prisma.organization.findFirst();
    if (!org) return error(res, 'No active organization found', null, 500);

    const passwordHash = await bcrypt.hash(password, 10);
    const validTiers = ['BRONZE', 'SILVER', 'GOLD'];
    const chosenTier = validTiers.includes(tier.toUpperCase()) ? tier.toUpperCase() : 'BRONZE';

    const account = await prisma.account.create({
      data: {
        organizationId: org.id,
        name: companyName,
        tier: chosenTier,
        tierSetBy: 'SELF',
        tierLockedByAdmin: false,
        portalEmail: email.toLowerCase().trim(),
        portalPasswordHash: passwordHash,
        status: 'ACTIVE',
      },
    });

    await logAudit({
      organizationId: org.id,
      action: 'CUSTOMER_PORTAL_SIGNUP',
      entity: 'ACCOUNT',
      entityId: account.id,
      newState: { name: companyName, email, tier: chosenTier, tierSetBy: 'SELF' },
    });

    const token = generateToken({
      userId: account.id,
      organizationId: org.id,
      role: 'CUSTOMER',
    });

    return success(res, 'Customer registration successful', {
      token,
      customer: {
        id: account.id,
        name: account.name,
        email: account.portalEmail,
        tier: account.tier,
        tierLockedByAdmin: account.tierLockedByAdmin,
      },
    }, 201);
  } catch (err) {
    return error(res, 'Portal registration failed', err.message, 500);
  }
};

/**
 * Customer Portal Login
 */
const portalLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return error(res, 'Email and password are required', null, 400);
    }

    const account = await prisma.account.findFirst({
      where: { portalEmail: email.toLowerCase().trim() },
    });

    if (!account || !account.portalPasswordHash) {
      return error(res, 'Invalid customer credentials', null, 401);
    }

    const isMatch = await bcrypt.compare(password, account.portalPasswordHash);
    if (!isMatch) {
      return error(res, 'Invalid customer credentials', null, 401);
    }

    const token = generateToken({
      userId: account.id,
      organizationId: account.organizationId,
      role: 'CUSTOMER',
    });

    return success(res, 'Customer login successful', {
      token,
      customer: {
        id: account.id,
        name: account.name,
        email: account.portalEmail,
        tier: account.tier,
        tierLockedByAdmin: account.tierLockedByAdmin,
      },
    });
  } catch (err) {
    return error(res, 'Portal login failed', err.message, 500);
  }
};

/**
 * Customer Updates Own Tier from Portal (blocked if locked by Admin)
 */
const updatePortalTier = async (req, res) => {
  try {
    const accountId = req.user.id;
    const { tier } = req.body;

    const account = await prisma.account.findUnique({ where: { id: accountId } });
    if (!account) return error(res, 'Customer account not found', null, 404);

    if (account.tierLockedByAdmin) {
      return error(res, 'Customer tier has been locked by Administrator and cannot be self-modified.', null, 403);
    }

    const validTiers = ['BRONZE', 'SILVER', 'GOLD'];
    if (!validTiers.includes(tier)) {
      return error(res, 'Invalid tier. Choose BRONZE, SILVER, or GOLD.', null, 400);
    }

    const updated = await prisma.account.update({
      where: { id: accountId },
      data: { tier, tierSetBy: 'SELF', updatedAt: new Date() },
    });

    await logAudit({
      organizationId: account.organizationId,
      action: 'CUSTOMER_TIER_SELF_UPDATED',
      entity: 'ACCOUNT',
      entityId: accountId,
      previousState: { tier: account.tier },
      newState: { tier, tierSetBy: 'SELF' },
    });

    return success(res, `Tier updated to ${tier}`, updated);
  } catch (err) {
    return error(res, 'Failed to update tier', err.message, 500);
  }
};

module.exports = {
  login,
  register,
  getMe,
  switchDemoUser,
  portalSignup,
  portalLogin,
  updatePortalTier,
};
