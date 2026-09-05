const prisma = require('../config/db');
const { success, error } = require('../utils/responseHelper');
const { logAudit } = require('../services/auditLogService');
const { sendNotification } = require('../services/notificationService');

const getLeads = async (req, res) => {
  try {
    const { status, search, ownerId } = req.query;
    const where = { organizationId: req.organizationId };

    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (ownerId) {
      where.ownerId = ownerId;
    }
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { company: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const leads = await prisma.lead.findMany({
      where,
      include: { owner: true },
      orderBy: { createdAt: 'desc' },
    });

    return success(res, 'Leads retrieved', leads);
  } catch (err) {
    return error(res, 'Failed to fetch leads', err.message, 500);
  }
};

const getLeadById = async (req, res) => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: req.params.id },
      include: { owner: true, activities: { include: { user: true }, orderBy: { createdAt: 'desc' } } },
    });

    if (!lead || lead.organizationId !== req.organizationId) {
      return error(res, 'Lead not found', null, 404);
    }

    return success(res, 'Lead details retrieved', lead);
  } catch (err) {
    return error(res, 'Failed to retrieve lead', err.message, 500);
  }
};

const createLead = async (req, res) => {
  try {
    const { firstName, lastName, company, email, phone, source, estimatedValue, notes, followUpDate, ownerId } = req.body;

    if (!firstName || !lastName || !company || !email) {
      return error(res, 'First name, last name, company, and email are required', null, 400);
    }

    const lead = await prisma.lead.create({
      data: {
        organizationId: req.organizationId,
        ownerId: ownerId || req.user.id,
        firstName,
        lastName,
        company,
        email: email.toLowerCase().trim(),
        phone,
        source: source || 'WEBSITE',
        status: 'NEW',
        estimatedValue: parseFloat(estimatedValue || 0),
        notes,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
      },
      include: { owner: true },
    });

    await logAudit({
      organizationId: req.organizationId,
      userId: req.user.id,
      action: 'LEAD_CREATED',
      entity: 'LEAD',
      entityId: lead.id,
      newState: lead,
    });

    if (lead.ownerId && lead.ownerId !== req.user.id) {
      await sendNotification({
        organizationId: req.organizationId,
        userId: lead.ownerId,
        title: 'New Lead Assigned',
        message: `Lead ${lead.firstName} ${lead.lastName} (${lead.company}) assigned to you.`,
        type: 'INFO',
        entityType: 'LEAD',
        entityId: lead.id,
      });
    }

    return success(res, 'Lead created successfully', lead, 201);
  } catch (err) {
    return error(res, 'Failed to create lead', err.message, 500);
  }
};

const updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.lead.findUnique({ where: { id } });

    if (!existing || existing.organizationId !== req.organizationId) {
      return error(res, 'Lead not found', null, 404);
    }

    const { firstName, lastName, company, email, phone, source, status, estimatedValue, notes, followUpDate, ownerId } = req.body;

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        firstName,
        lastName,
        company,
        email: email ? email.toLowerCase().trim() : undefined,
        phone,
        source,
        status,
        estimatedValue: estimatedValue !== undefined ? parseFloat(estimatedValue) : undefined,
        notes,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        ownerId,
      },
      include: { owner: true },
    });

    await logAudit({
      organizationId: req.organizationId,
      userId: req.user.id,
      action: 'LEAD_UPDATED',
      entity: 'LEAD',
      entityId: id,
      previousState: existing,
      newState: updated,
    });

    return success(res, 'Lead updated successfully', updated);
  } catch (err) {
    return error(res, 'Failed to update lead', err.message, 500);
  }
};

/**
 * 1-Click Lead Conversion to Account, Contact, and Opportunity Deal.
 */
const convertLead = async (req, res) => {
  try {
    const { id } = req.params;
    const { dealTitle, customerTier = 'BRONZE', industry = 'Technology', expectedCloseDays = 30 } = req.body;

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead || lead.organizationId !== req.organizationId) {
      return error(res, 'Lead not found', null, 404);
    }

    if (lead.status === 'CONVERTED') {
      return error(res, 'Lead is already converted', null, 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create or link Account
      let account = await tx.account.findFirst({
        where: {
          organizationId: req.organizationId,
          name: lead.company,
        },
      });

      if (!account) {
        account = await tx.account.create({
          data: {
            organizationId: req.organizationId,
            ownerId: lead.ownerId || req.user.id,
            name: lead.company,
            tier: customerTier,
            industry,
            phone: lead.phone,
            status: 'ACTIVE',
          },
        });
      }

      // 2. Create Contact
      const contact = await tx.contact.create({
        data: {
          organizationId: req.organizationId,
          accountId: account.id,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone,
          jobTitle: 'Key Stakeholder',
          isDecisionMaker: true,
        },
      });

      // 3. Create Opportunity Deal
      const expectedClose = new Date();
      expectedClose.setDate(expectedClose.getDate() + (expectedCloseDays || 30));

      const deal = await tx.deal.create({
        data: {
          organizationId: req.organizationId,
          accountId: account.id,
          contactId: contact.id,
          ownerId: lead.ownerId || req.user.id,
          title: dealTitle || `${lead.company} - Expansion Deal`,
          value: lead.estimatedValue || 100000,
          stage: 'OPPORTUNITY',
          probability: 35,
          expectedCloseDate: expectedClose,
        },
      });

      // 4. Mark Lead Converted
      const updatedLead = await tx.lead.update({
        where: { id: lead.id },
        data: {
          status: 'CONVERTED',
          convertedAccountId: account.id,
          convertedContactId: contact.id,
          convertedDealId: deal.id,
        },
      });

      return { account, contact, deal, lead: updatedLead };
    });

    await logAudit({
      organizationId: req.organizationId,
      userId: req.user.id,
      action: 'LEAD_CONVERTED',
      entity: 'LEAD',
      entityId: id,
      newState: {
        accountId: result.account.id,
        contactId: result.contact.id,
        dealId: result.deal.id,
      },
    });

    return success(res, 'Lead converted into Account, Contact, and Deal successfully', result);
  } catch (err) {
    console.error('Lead conversion error:', err);
    return error(res, 'Failed to convert lead', err.message, 500);
  }
};

const deleteLead = async (req, res) => {
  try {
    const { id } = req.params;
    const lead = await prisma.lead.findUnique({ where: { id } });

    if (!lead || lead.organizationId !== req.organizationId) {
      return error(res, 'Lead not found', null, 404);
    }

    await prisma.lead.delete({ where: { id } });

    await logAudit({
      organizationId: req.organizationId,
      userId: req.user.id,
      action: 'LEAD_DELETED',
      entity: 'LEAD',
      entityId: id,
    });

    return success(res, 'Lead deleted successfully');
  } catch (err) {
    return error(res, 'Failed to delete lead', err.message, 500);
  }
};

module.exports = {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  convertLead,
  deleteLead,
};
