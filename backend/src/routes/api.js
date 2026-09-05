const express = require('express');
const router = express.Router();

const { authenticate, authorizeRoles } = require('../middleware/auth');

// Controllers
const authController = require('../controllers/authController');
const leadController = require('../controllers/leadController');
const accountController = require('../controllers/accountController');
const contactController = require('../controllers/contactController');
const productController = require('../controllers/productController');
const dealController = require('../controllers/dealController');
const quoteController = require('../controllers/quoteController');
const approvalController = require('../controllers/approvalController');
const contractController = require('../controllers/contractController');
const invoiceController = require('../controllers/invoiceController');
const revenueController = require('../controllers/revenueController');
const dashboardController = require('../controllers/dashboardController');
const settingsController = require('../controllers/settingsController');
const notificationController = require('../controllers/notificationController');
const auditController = require('../controllers/auditController');

// -------------------------------------------------------------
// Public Routes
// -------------------------------------------------------------
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);
router.post('/auth/signup', authController.register); // alias

// Customer Portal Auth (Dedicated flow)
router.post('/portal/auth/signup', authController.portalSignup);
router.post('/portal/auth/login', authController.portalLogin);

// Customer Portal Public Endpoints (Accessible with Quote ID)
router.get('/portal/quotes/:id', quoteController.getPortalQuote);
router.get('/portal/quotations/:id', quoteController.getPortalQuote); // alias
router.post('/portal/quotes/:id/negotiate', quoteController.submitCustomerNegotiation);
router.post('/portal/quotations/:id/messages', quoteController.submitCustomerNegotiation); // alias
router.post('/portal/quotations/:id/confirm', quoteController.submitCustomerNegotiation); // alias

// -------------------------------------------------------------
// Protected Routes (Require JWT & Active Organization)
// -------------------------------------------------------------
router.use(authenticate);

// Auth & Session
router.get('/auth/me', authController.getMe);
router.post('/auth/demo-switch', authController.switchDemoUser);
router.put('/portal/profile/tier', authController.updatePortalTier);

// Dashboard & Health Monitoring
router.get('/dashboard/overview', dashboardController.getDashboardOverview);
router.get('/dashboard/deal-health', dashboardController.getDashboardOverview); // alias
router.post('/dashboard/health-action', dashboardController.triggerHealthAction);

// Leads
router.get('/leads', leadController.getLeads);
router.get('/leads/:id', leadController.getLeadById);
router.post('/leads', leadController.createLead);
router.put('/leads/:id', leadController.updateLead);
router.post('/leads/:id/convert', leadController.convertLead);
router.delete('/leads/:id', leadController.deleteLead);

// Customers / Accounts
router.get('/accounts', accountController.getAccounts);
router.get('/accounts/:id', accountController.getAccountById);
router.post('/accounts', accountController.createAccount);
router.put('/accounts/:id', accountController.updateAccount);
router.delete('/accounts/:id', accountController.deleteAccount);
router.put('/customers/:id/tier', accountController.adminOverrideCustomerTier);
router.put('/accounts/:id/tier', accountController.adminOverrideCustomerTier); // alias

// Contacts
router.get('/contacts', contactController.getContacts);
router.post('/contacts', contactController.createContact);
router.put('/contacts/:id', contactController.updateContact);
router.delete('/contacts/:id', contactController.deleteContact);

// Products, Warehouses & Stock
router.get('/products', productController.getProducts);
router.post('/products', productController.createProduct);
router.put('/products/:id', productController.updateProduct);
router.get('/warehouses', productController.getWarehouses);
router.post('/warehouses', productController.createWarehouse);
router.post('/stock/update', productController.updateStockLevel);
router.get('/upsells', productController.getUpsells);

// Deals & Pipeline
router.get('/deals', dealController.getDeals);
router.get('/pipeline', dealController.getPipelineBoard);
router.get('/deals/:id', dealController.getDealById);
router.post('/deals', dealController.createDeal);
router.put('/deals/:id', dealController.updateDeal);
router.post('/deals/:id/stage', dealController.updateDealStage);

// Quotes & Pricing Engine
router.get('/quotes', quoteController.getQuotes);
router.post('/quotes', quoteController.saveQuote);
router.post('/quotes/preview', quoteController.previewQuotePricing);
router.post('/quotes/save', quoteController.saveQuote);
router.get('/quotes/:id', quoteController.getQuoteById);
router.put('/quotes/:id/stage', quoteController.updateQuoteStage);
router.post('/quotes/:id/versions', quoteController.createQuoteVersion);

// Discount Approvals
router.get('/approvals', approvalController.getApprovals);
router.post('/approvals/:id/decide', approvalController.decideApproval);

// Contracts & Legal Review
router.get('/contracts', contractController.getContracts);
router.post('/contracts', contractController.createContract);
router.post('/contracts/:id/review', contractController.legalReviewDecision);
router.post('/contracts/:id/sign', contractController.signContract);

// Finance: Invoices, Subscriptions & Payments
router.get('/invoices', invoiceController.getInvoices);
router.get('/invoices/:id', invoiceController.getInvoiceById);
router.post('/invoices/generate', invoiceController.createInvoiceFromDeal);
router.post('/invoices/payment', invoiceController.recordPayment);
router.get('/subscriptions', invoiceController.getSubscriptions);
router.post('/subscriptions', invoiceController.createSubscription);
router.post('/subscriptions/:id/cancel', invoiceController.cancelSubscription);

// Revenue, Forecasting & Reports
router.get('/revenue/analytics', revenueController.getRevenueAnalytics);
router.get('/reports', revenueController.getReportsAnalytics);

// Settings, Discount Rules & Users
router.get('/settings/organization', settingsController.getOrgSettings);
router.put('/settings/organization', settingsController.updateOrgSettings);
router.get('/settings/users', settingsController.getUsers);
router.post('/settings/users', settingsController.createUser);
router.put('/settings/users/:id', settingsController.updateUser);
router.get('/settings/discount-rules', settingsController.getDiscountRules);
router.post('/settings/discount-rules', settingsController.createDiscountRule);
router.put('/settings/discount-rules/:id', settingsController.updateDiscountRule);
router.get('/settings/billing', settingsController.getBillingInfo);
router.post('/settings/billing/plan', settingsController.updateBillingPlan);

// Notifications
router.get('/notifications', notificationController.getNotifications);
router.put('/notifications/:id/read', notificationController.markAsRead);

// Audit Logs
router.get('/audit-logs', auditController.getAuditLogs);

module.exports = router;
