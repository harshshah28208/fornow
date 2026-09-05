const prisma = require('../config/db');
const { success, error } = require('../utils/responseHelper');
const { logAudit } = require('../services/auditLogService');
const { sendNotification, notifyRole } = require('../services/notificationService');

const getContracts = async (req, res) => {
  try {
    const { status, dealId } = req.query;
    const where = { organizationId: req.organizationId };

    if (status && status !== 'ALL') where.status = status;
    if (dealId) where.dealId = dealId;

    const contracts = await prisma.contract.findMany({
      where,
      include: {
        account: true,
        deal: { include: { owner: true } },
        quote: true,
        legalReviewer: true,
        versions: { orderBy: { version: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return success(res, 'Contracts retrieved', contracts);
  } catch (err) {
    return error(res, 'Failed to fetch contracts', err.message, 500);
  }
};

const createContract = async (req, res) => {
  try {
    const { dealId, quoteId, title, terms, startDate, endDate } = req.body;

    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: {
        account: true,
        quotes: { where: { id: quoteId }, include: { items: { include: { product: true } } } },
      },
    });

    if (!deal || deal.organizationId !== req.organizationId) {
      return error(res, 'Deal not found', null, 404);
    }

    const quote = deal.quotes[0];
    if (!quote) {
      return error(res, 'Referenced quote not found', null, 404);
    }

    if (!['APPROVED', 'ACCEPTED'].includes(quote.status)) {
      return error(res, 'A contract can only be generated for an APPROVED or ACCEPTED quote.', null, 400);
    }

    const count = await prisma.contract.count({ where: { organizationId: req.organizationId } });
    const contractNumber = `CTR-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const defaultTerms = terms || `MASTER SERVICES & PRODUCT AGREEMENT\n\nThis Agreement is entered into between ${req.user.organization.name} ("Provider") and ${deal.account.name} ("Client").\n\nTotal Contract Value: ₹${quote.totalAmount.toLocaleString('en-IN')}\n\n1. Scope of Products/Services:\n${quote.items.map((i) => `- ${i.product.name} (Qty: ${i.quantity}, Price: ₹${i.totalAmount})`).join('\n')}\n\n2. Payment Terms: Net 30 Days from invoice issuance.\n3. Warranty & SLA: 99.9% uptime SLA and standard hardware warranty.\n4. Governing Law: High Court jurisdiction.`;

    const contract = await prisma.contract.create({
      data: {
        organizationId: req.organizationId,
        dealId: deal.id,
        quoteId: quote.id,
        accountId: deal.accountId,
        contractNumber,
        title: title || `Enterprise Agreement - ${deal.account.name}`,
        value: quote.totalAmount,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        terms: defaultTerms,
        status: 'LEGAL_REVIEW',
        versions: {
          create: {
            version: 1,
            terms: defaultTerms,
            changesDescription: 'Initial Contract Draft from Approved Quote',
            createdById: req.user.id,
          },
        },
      },
      include: { account: true, deal: true, versions: true },
    });

    // Update Deal stage
    await prisma.deal.update({
      where: { id: deal.id },
      data: { stage: 'CONTRACT_REVIEW', lastActivityAt: new Date() },
    });

    await logAudit({
      organizationId: req.organizationId,
      userId: req.user.id,
      action: 'CONTRACT_CREATED',
      entity: 'CONTRACT',
      entityId: contract.id,
      newState: contract,
    });

    // Notify Legal Team
    await notifyRole({
      organizationId: req.organizationId,
      role: 'LEGAL',
      title: `New Contract Requires Review: ${contract.contractNumber}`,
      message: `Contract for ${deal.account.name} (Value: ₹${contract.value.toLocaleString('en-IN')}) requires legal review.`,
      type: 'CONTRACT_REVIEW',
      entityType: 'CONTRACT',
      entityId: contract.id,
    });

    return success(res, 'Contract generated and sent to Legal Review', contract, 201);
  } catch (err) {
    return error(res, 'Failed to generate contract', err.message, 500);
  }
};

const legalReviewDecision = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, notes, revisedTerms } = req.body; // decision: 'APPROVED' | 'CHANGES_REQUESTED'

    const contract = await prisma.contract.findUnique({
      where: { id },
      include: { deal: true, account: true, versions: true },
    });

    if (!contract || contract.organizationId !== req.organizationId) {
      return error(res, 'Contract not found', null, 404);
    }

    if (!['LEGAL', 'ORG_ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
      return error(res, 'Only Legal Counsel or Administrators can perform contract reviews.', null, 403);
    }

    const nextStatus = decision === 'APPROVED' ? 'APPROVED' : 'CHANGES_REQUESTED';
    const nextDealStage = decision === 'APPROVED' ? 'CONTRACT_APPROVED' : 'CONTRACT_REVIEW';

    const updated = await prisma.$transaction(async (tx) => {
      let termsToSave = contract.terms;
      if (revisedTerms && revisedTerms !== contract.terms) {
        termsToSave = revisedTerms;
        await tx.contractVersion.create({
          data: {
            contractId: contract.id,
            version: contract.versions.length + 1,
            terms: revisedTerms,
            changesDescription: notes || 'Legal modifications applied',
            createdById: req.user.id,
          },
        });
      }

      const c = await tx.contract.update({
        where: { id },
        data: {
          status: nextStatus,
          legalReviewerId: req.user.id,
          legalNotes: notes,
          terms: termsToSave,
        },
        include: { legalReviewer: true, versions: true },
      });

      await tx.deal.update({
        where: { id: contract.dealId },
        data: { stage: nextDealStage, lastActivityAt: new Date() },
      });

      return c;
    });

    await logAudit({
      organizationId: req.organizationId,
      userId: req.user.id,
      action: decision === 'APPROVED' ? 'CONTRACT_LEGAL_APPROVED' : 'CONTRACT_CHANGES_REQUESTED',
      entity: 'CONTRACT',
      entityId: id,
      newState: { status: nextStatus, reviewer: req.user.email, notes },
    });

    return success(res, `Contract legal review status updated to ${nextStatus}`, updated);
  } catch (err) {
    return error(res, 'Failed to process legal review', err.message, 500);
  }
};

const signContract = async (req, res) => {
  try {
    const { id } = req.params;
    const { signerName, signerEmail } = req.body;

    const contract = await prisma.contract.findUnique({
      where: { id },
      include: { deal: true, account: true },
    });

    if (!contract || contract.organizationId !== req.organizationId) {
      return error(res, 'Contract not found', null, 404);
    }

    if (contract.status !== 'APPROVED') {
      return error(res, 'Contract must be approved by Legal before it can be executed/signed.', null, 400);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const c = await tx.contract.update({
        where: { id },
        data: {
          status: 'SIGNED',
          signedAt: new Date(),
          signerName: signerName || `${contract.account.name} Representative`,
          signerEmail: signerEmail || 'signatory@client.com',
        },
      });

      // Advance deal to CLOSED_WON
      await tx.deal.update({
        where: { id: contract.dealId },
        data: {
          stage: 'CLOSED_WON',
          probability: 100,
          lastActivityAt: new Date(),
        },
      });

      return c;
    });

    await logAudit({
      organizationId: req.organizationId,
      userId: req.user.id,
      action: 'CONTRACT_SIGNED',
      entity: 'CONTRACT',
      entityId: id,
      newState: { status: 'SIGNED', signedAt: new Date(), signerName },
    });

    return success(res, 'Contract signed successfully! Deal is now CLOSED_WON.', updated);
  } catch (err) {
    return error(res, 'Failed to sign contract', err.message, 500);
  }
};

module.exports = {
  getContracts,
  createContract,
  legalReviewDecision,
  signContract,
};
