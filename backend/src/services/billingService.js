const prisma = require('../config/db');
const { logAudit } = require('./auditLogService');
const { sendNotification, notifyRole } = require('./notificationService');

/**
 * Generates an invoice for an approved deal/contract with proper one-time and recurring breakdown.
 */
const generateInvoiceForDeal = async ({
  organizationId,
  dealId,
  userId,
  dueDateDays = 30,
}) => {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: {
      account: true,
      quotes: {
        where: { status: { in: ['APPROVED', 'ACCEPTED'] } },
        orderBy: { version: 'desc' },
        include: { items: { include: { product: true } } },
      },
      contracts: {
        where: { status: { in: ['APPROVED', 'SIGNED'] } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!deal || deal.organizationId !== organizationId) {
    throw new Error('Deal not found or unauthorized');
  }

  const activeQuote = deal.quotes[0];
  if (!activeQuote) {
    throw new Error('No approved quote found for this deal.');
  }

  const contract = deal.contracts[0] || null;

  // Generate unique Invoice Number
  const count = await prisma.invoice.count({ where: { organizationId } });
  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + dueDateDays);

  // Create Invoice and Invoice Items
  const invoice = await prisma.invoice.create({
    data: {
      organizationId,
      dealId: deal.id,
      contractId: contract ? contract.id : null,
      accountId: deal.accountId,
      invoiceNumber,
      dueDate,
      subtotal: activeQuote.subtotal,
      discountAmount: activeQuote.discountAmount,
      taxAmount: activeQuote.taxAmount,
      totalAmount: activeQuote.totalAmount,
      amountPaid: 0.0,
      amountDue: activeQuote.totalAmount,
      status: 'ISSUED',
      items: {
        create: activeQuote.items.map((item) => ({
          productId: item.productId,
          description: `${item.product.name} (${item.billingModel})`,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountAmount: item.discountAmount,
          taxAmount: item.taxAmount,
          totalAmount: item.totalAmount,
          billingType: item.billingModel,
        })),
      },
    },
    include: {
      items: true,
      account: true,
    },
  });

  // Provision Subscriptions for any recurring lines
  for (const item of activeQuote.items) {
    if (item.billingModel === 'RECURRING') {
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      await prisma.subscription.create({
        data: {
          organizationId,
          accountId: deal.accountId,
          dealId: deal.id,
          productId: item.productId,
          productPlanId: item.productPlanId,
          status: 'ACTIVE',
          billingCycle: activeQuote.billingFrequency || 'MONTHLY',
          recurringAmount: item.totalAmount,
          currentPeriodStart: new Date(),
          currentPeriodEnd: periodEnd,
          nextBillingDate: periodEnd,
        },
      });
    }
  }

  // Audit Log
  await logAudit({
    organizationId,
    userId,
    action: 'INVOICE_CREATED',
    entity: 'INVOICE',
    entityId: invoice.id,
    newState: { invoiceNumber, totalAmount: invoice.totalAmount, status: 'ISSUED' },
  });

  // Notify Finance Team
  await notifyRole({
    organizationId,
    role: 'FINANCE',
    title: `New Invoice Generated: ${invoiceNumber}`,
    message: `Invoice for ${deal.account.name} generated with amount ₹${invoice.totalAmount.toLocaleString('en-IN')}`,
    type: 'INFO',
    entityType: 'INVOICE',
    entityId: invoice.id,
  });

  return invoice;
};

/**
 * Records a real payment against an invoice and recognizes revenue.
 */
const recordPaymentForInvoice = async ({
  organizationId,
  invoiceId,
  amount,
  paymentMethod = 'BANK_TRANSFER',
  reference = null,
  notes = null,
  userId,
}) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { account: true, deal: true },
  });

  if (!invoice || invoice.organizationId !== organizationId) {
    throw new Error('Invoice not found or unauthorized');
  }

  const paymentAmount = Math.min(invoice.amountDue, Math.max(0.01, parseFloat(amount)));
  if (paymentAmount <= 0) {
    throw new Error('Payment amount must be greater than zero.');
  }

  const newAmountPaid = invoice.amountPaid + paymentAmount;
  const newAmountDue = Math.max(0, invoice.totalAmount - newAmountPaid);
  const newStatus = newAmountDue <= 0.01 ? 'PAID' : 'PARTIALLY_PAID';

  const count = await prisma.payment.count({ where: { organizationId } });
  const paymentNumber = `PAY-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

  // Create payment record
  const payment = await prisma.payment.create({
    data: {
      organizationId,
      invoiceId: invoice.id,
      paymentNumber,
      amount: paymentAmount,
      paymentMethod,
      reference,
      notes,
      status: 'COMPLETED',
    },
  });

  // Update Invoice
  const updatedInvoice = await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      amountPaid: Number(newAmountPaid.toFixed(2)),
      amountDue: Number(newAmountDue.toFixed(2)),
      status: newStatus,
    },
    include: { payments: true, account: true, deal: true },
  });

  // Record Recognized Revenue
  const now = new Date();
  await prisma.revenueRecord.create({
    data: {
      organizationId,
      invoiceId: invoice.id,
      dealId: invoice.dealId,
      accountId: invoice.accountId,
      amount: paymentAmount,
      type: invoice.deal ? 'ONE_TIME' : 'RECURRING',
      recognizedDate: now,
      periodMonth: now.getMonth() + 1,
      periodYear: now.getFullYear(),
      notes: `Payment ${paymentNumber} recorded for invoice ${invoice.invoiceNumber}`,
    },
  });

  // Audit Log
  await logAudit({
    organizationId,
    userId,
    action: 'PAYMENT_RECEIVED',
    entity: 'PAYMENT',
    entityId: payment.id,
    newState: { paymentNumber, amount: paymentAmount, invoiceNumber: invoice.invoiceNumber, invoiceStatus: newStatus },
  });

  // Notifications
  await notifyRole({
    organizationId,
    role: 'FINANCE',
    title: `Payment Received: ₹${paymentAmount.toLocaleString('en-IN')}`,
    message: `Payment ${paymentNumber} received for ${invoice.account.name}. Invoice ${invoice.invoiceNumber} is now ${newStatus}.`,
    type: 'PAYMENT',
    entityType: 'INVOICE',
    entityId: invoice.id,
  });

  return { payment, updatedInvoice };
};

module.exports = {
  generateInvoiceForDeal,
  recordPaymentForInvoice,
};
