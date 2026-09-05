const prisma = require('../config/db');
const { success, error } = require('../utils/responseHelper');
const { logAudit } = require('../services/auditLogService');

const getContacts = async (req, res) => {
  try {
    const { accountId, search } = req.query;
    const where = { organizationId: req.organizationId };

    if (accountId) where.accountId = accountId;
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { jobTitle: { contains: search } },
      ];
    }

    const contacts = await prisma.contact.findMany({
      where,
      include: { account: true },
      orderBy: { createdAt: 'desc' },
    });

    return success(res, 'Contacts retrieved', contacts);
  } catch (err) {
    return error(res, 'Failed to fetch contacts', err.message, 500);
  }
};

const createContact = async (req, res) => {
  try {
    const { accountId, firstName, lastName, email, phone, jobTitle, isDecisionMaker, notes } = req.body;
    if (!accountId || !firstName || !lastName || !email) {
      return error(res, 'Account, First name, Last name, and Email are required', null, 400);
    }

    const contact = await prisma.contact.create({
      data: {
        organizationId: req.organizationId,
        accountId,
        firstName,
        lastName,
        email: email.toLowerCase().trim(),
        phone,
        jobTitle,
        isDecisionMaker: Boolean(isDecisionMaker),
        notes,
      },
      include: { account: true },
    });

    await logAudit({
      organizationId: req.organizationId,
      userId: req.user.id,
      action: 'CONTACT_CREATED',
      entity: 'CONTACT',
      entityId: contact.id,
      newState: contact,
    });

    return success(res, 'Contact created successfully', contact, 201);
  } catch (err) {
    return error(res, 'Failed to create contact', err.message, 500);
  }
};

const updateContact = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.contact.findUnique({ where: { id } });

    if (!existing || existing.organizationId !== req.organizationId) {
      return error(res, 'Contact not found', null, 404);
    }

    const { firstName, lastName, email, phone, jobTitle, isDecisionMaker, notes } = req.body;

    const updated = await prisma.contact.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email: email ? email.toLowerCase().trim() : undefined,
        phone,
        jobTitle,
        isDecisionMaker: isDecisionMaker !== undefined ? Boolean(isDecisionMaker) : undefined,
        notes,
      },
      include: { account: true },
    });

    return success(res, 'Contact updated successfully', updated);
  } catch (err) {
    return error(res, 'Failed to update contact', err.message, 500);
  }
};

const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await prisma.contact.findUnique({ where: { id } });

    if (!contact || contact.organizationId !== req.organizationId) {
      return error(res, 'Contact not found', null, 404);
    }

    await prisma.contact.delete({ where: { id } });
    return success(res, 'Contact deleted successfully');
  } catch (err) {
    return error(res, 'Failed to delete contact', err.message, 500);
  }
};

module.exports = {
  getContacts,
  createContact,
  updateContact,
  deleteContact,
};
