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

module.exports = {
  getInvoices,
  getInvoiceById,
  createInvoiceFromDeal,
  recordPayment,
};
