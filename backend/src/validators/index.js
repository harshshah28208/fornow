const { z } = require('zod');

// Authentication schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  organizationName: z.string().min(2, 'Organization name is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['SUPER_ADMIN', 'ORG_ADMIN', 'SALES_REP', 'SALES_MANAGER', 'FINANCE', 'LEGAL', 'OPERATIONS']).optional(),
});

// Quote schemas
const quoteItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  productPlanId: z.string().optional().nullable(),
  quantity: z.number().int().positive('Quantity must be positive'),
  unitPrice: z.number().nonnegative('Unit price must be non-negative').optional(),
  discountPercent: z.number().min(0).max(100).optional().default(0),
  warehouseId: z.string().optional().nullable(),
});

const createQuoteSchema = z.object({
  dealId: z.string().min(1, 'Deal ID is required'),
  items: z.array(quoteItemSchema).min(1, 'At least one line item is required'),
  orderLevelDiscount: z.number().min(0).max(100).optional().default(0),
  billingFrequency: z.enum(['ONE_TIME', 'MONTHLY', 'QUARTERLY', 'ANNUAL']).optional().default('MONTHLY'),
  notes: z.string().optional().nullable(),
  terms: z.string().optional().nullable(),
  isSubmitForApproval: z.boolean().optional().default(false),
  warehouseAllocations: z.array(z.object({
    productId: z.string(),
    warehouseId: z.string(),
  })).optional().default([]),
});

const quoteStageTransitionSchema = z.object({
  stage: z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'NEGOTIATION', 'ACCEPTED', 'CONFIRMED', 'REJECTED']),
  notes: z.string().optional().nullable(),
});

// Deal schemas
const createDealSchema = z.object({
  title: z.string().min(2, 'Deal title is required'),
  accountId: z.string().min(1, 'Account ID is required'),
  contactId: z.string().optional().nullable(),
  ownerId: z.string().optional().nullable(),
  value: z.number().nonnegative().optional().default(0),
  stage: z.string().optional().default('LEAD'),
  probability: z.number().int().min(0).max(100).optional().default(10),
  expectedCloseDate: z.string().optional().nullable(),
  deliveryPromiseDate: z.string().optional().nullable(),
});

// Approval decision schema
const approvalDecisionSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT', 'REVISION_REQUESTED']),
  comments: z.string().optional().nullable(),
  overrideDiscount: z.number().min(0).max(100).optional(),
});

// Invoice payment schema
const recordPaymentSchema = z.object({
  amount: z.number().positive('Payment amount must be greater than 0'),
  paymentMethod: z.enum(['BANK_TRANSFER', 'CREDIT_CARD', 'UPI', 'CHECK']).optional().default('BANK_TRANSFER'),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// Generic middleware validator
const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse(req.body);
    req.validatedBody = parsed;
    next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
    }
    return res.status(400).json({ success: false, message: 'Invalid request payload' });
  }
};

module.exports = {
  loginSchema,
  registerSchema,
  quoteItemSchema,
  createQuoteSchema,
  quoteStageTransitionSchema,
  createDealSchema,
  approvalDecisionSchema,
  recordPaymentSchema,
  validate,
};
