const prisma = require('../config/db');
const { success, error } = require('../utils/responseHelper');
const { generateInvoiceForDeal, recordPaymentForInvoice } = require('../services/billingService');

const getInvoices = async (req, res) => {
  try {
    const { status, accountId, search } = req.query;
    const where = { organizationId: req.organizationId };

    if (status && status !== 'ALL') where.status = status;
    if (accountId) where.accountId = accountId;
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search } },
        { account: { name: { contains: search } } },
      ];
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        account: true,
        deal: true,
        contract: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return success(res, 'Invoices retrieved', invoices);
  } catch (err) {
    return error(res, 'Failed to fetch invoices', err.message, 500);
  }
};

const getInvoiceById = async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        account: true,
        deal: { include: { owner: true } },
        contract: true,
        items: { include: { product: true } },
        payments: { orderBy: { paymentDate: 'desc' } },
        revenueRecords: true,
      },
    });

    if (!invoice || invoice.organizationId !== req.organizationId) {
      return error(res, 'Invoice not found', null, 404);
    }

    return success(res, 'Invoice details retrieved', invoice);
  } catch (err) {
    return error(res, 'Failed to retrieve invoice', err.message, 500);
  }
};

const createInvoiceFromDeal = async (req, res) => {
  try {
    const { dealId, dueDateDays = 30 } = req.body;
    if (!dealId) {
      return error(res, 'dealId is required', null, 400);
    }

    const invoice = await generateInvoiceForDeal({
      organizationId: req.organizationId,
      dealId,
      userId: req.user.id,
      dueDateDays: parseInt(dueDateDays, 10),
    });

    return success(res, 'Invoice generated successfully', invoice, 201);
  } catch (err) {
    return error(res, err.message, null, 400);
  }
};

const recordPayment = async (req, res) => {
  try {
    const { invoiceId, amount, paymentMethod, reference, notes } = req.body;
    if (!invoiceId || !amount) {
      return error(res, 'invoiceId and amount are required', null, 400);
    }

    const result = await recordPaymentForInvoice({
      organizationId: req.organizationId,
      invoiceId,
      amount: parseFloat(amount),
      paymentMethod,
      reference,
      notes,
      userId: req.user.id,
    });

    return success(res, 'Payment recorded successfully', result);
  } catch (err) {
    return error(res, err.message, null, 400);
  }
};

const getSubscriptions = async (req, res) => {
  try {
    const { status = 'ALL', accountId } = req.query;
    const where = { organizationId: req.organizationId };

    if (status && status !== 'ALL') where.status = status;
    if (accountId) where.accountId = accountId;

    const subscriptions = await prisma.subscription.findMany({
      where,
      include: {
        account: true,
        product: true,
        productPlan: true,
        deal: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return success(res, 'Subscriptions retrieved', subscriptions);
  } catch (err) {
    return error(res, 'Failed to fetch subscriptions', err.message, 500);
  }
};

const createSubscription = async (req, res) => {
  try {
    const { accountId, dealId, productId, productPlanId, recurringAmount, billingCycle = 'MONTHLY' } = req.body;
    if (!accountId || !productId || !recurringAmount) {
      return error(res, 'accountId, productId, and recurringAmount are required', null, 400);
    }

    const nextBilling = new Date();
    if (billingCycle === 'ANNUAL') nextBilling.setFullYear(nextBilling.getFullYear() + 1);
    else if (billingCycle === 'QUARTERLY') nextBilling.setMonth(nextBilling.getMonth() + 3);
    else nextBilling.setMonth(nextBilling.getMonth() + 1);

    const subscription = await prisma.subscription.create({
      data: {
        organizationId: req.organizationId,
        accountId,
        dealId: dealId || null,
        productId,
        productPlanId: productPlanId || null,
        recurringAmount: parseFloat(recurringAmount),
        billingCycle,
        currentPeriodStart: new Date(),
        currentPeriodEnd: nextBilling,
        nextBillingDate: nextBilling,
        status: 'ACTIVE',
      },
      include: { account: true, product: true, productPlan: true },
    });

    return success(res, 'Subscription created successfully', subscription, 201);
  } catch (err) {
    return error(res, 'Failed to create subscription', err.message, 500);
  }
};

const cancelSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await prisma.subscription.update({
      where: { id },
      data: { status: 'CANCELLED', updatedAt: new Date() },
    });
    return success(res, 'Subscription cancelled', updated);
  } catch (err) {
    return error(res, 'Failed to cancel subscription', err.message, 500);
  }
};

module.exports = {
  getInvoices,
  getInvoiceById,
  createInvoiceFromDeal,
  recordPayment,
  getSubscriptions,
  createSubscription,
  cancelSubscription,
};
