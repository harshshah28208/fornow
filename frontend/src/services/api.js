import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('dealflow_token') || localStorage.getItem('dealflow_portal_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Standardized Error & Session Handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/portal')) {
        localStorage.removeItem('dealflow_token');
        localStorage.removeItem('dealflow_user');
      }
    }
    const message =
      (error.response && error.response.data && error.response.data.message) ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

// Centralized API Service Modules
export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  signup: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  switchRole: (role) => api.post('/auth/demo-switch', { role }),
  portalSignup: (data) => api.post('/portal/auth/signup', data),
  portalLogin: (email, password) => api.post('/portal/auth/login', { email, password }),
  updatePortalTier: (tier) => api.put('/portal/profile/tier', { tier }),
};

export const quotationService = {
  getAll: (params) => api.get('/quotes', { params }),
  getById: (id) => api.get(`/quotes/${id}`),
  create: (data) => api.post('/quotes', data),
  saveDraft: (data) => api.post('/quotes/save', data),
  preview: (data) => api.post('/quotes/preview', data),
  updateStage: (id, stage, notes) => api.put(`/quotes/${id}/stage`, { stage, notes }),
  createVersion: (id, notes) => api.post(`/quotes/${id}/versions`, { notes }),
};

export const approvalService = {
  getAll: (params) => api.get('/approvals', { params }),
  decide: (id, decision, comments, overrideDiscount) =>
    api.post(`/approvals/${id}/decide`, { decision, comments, overrideDiscount }),
};

export const productService = {
  getAll: () => api.get('/products'),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  getUpsells: () => api.get('/upsells'),
};

export const warehouseService = {
  getAll: () => api.get('/warehouses'),
  create: (data) => api.post('/warehouses', data),
  updateStock: (productId, warehouseId, quantity, reservedQty) =>
    api.post('/stock/update', { productId, warehouseId, quantity, reservedQty }),
};

export const subscriptionService = {
  getAll: (params) => api.get('/subscriptions', { params }),
  create: (data) => api.post('/subscriptions', data),
  cancel: (id) => api.post(`/subscriptions/${id}/cancel`),
};

export const invoiceService = {
  getAll: (params) => api.get('/invoices', { params }),
  getById: (id) => api.get(`/invoices/${id}`),
  generateFromDeal: (dealId, dueDateDays) => api.post('/invoices/generate', { dealId, dueDateDays }),
  recordPayment: (data) => api.post('/invoices/payment', data),
};

export const dealService = {
  getAll: (params) => api.get('/deals', { params }),
  getPipeline: () => api.get('/pipeline'),
  getById: (id) => api.get(`/deals/${id}`),
  create: (data) => api.post('/deals', data),
  update: (id, data) => api.put(`/deals/${id}`, data),
  updateStage: (id, stage) => api.post(`/deals/${id}/stage`, { stage }),
};

export const reportService = {
  getAnalytics: (params) => api.get('/reports', { params }),
  getRevenueAnalytics: () => api.get('/revenue/analytics'),
};

export const healthService = {
  getOverview: () => api.get('/dashboard/overview'),
  triggerAction: (dealId, actionType) => api.post('/dashboard/health-action', { dealId, actionType }),
};

export const portalService = {
  getQuote: (id) => api.get(`/portal/quotes/${id}`),
  negotiate: (id, data) => api.post(`/portal/quotes/${id}/negotiate`, data),
};

export default api;
