import React, { useState, useEffect } from 'react';
import { Package, Plus, Sparkles, Server, Laptop, Wrench, RefreshCw } from 'lucide-react';
import api from '../api/client';
import { LoadingSpinner, EmptyState, ErrorAlert } from '../components/common/LoadingAndEmpty';
import { Modal } from '../components/common/Modal';

export const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'HARDWARE',
    billingModel: 'ONE_TIME',
    basePrice: '',
    costPrice: '',
    unit: 'Unit',
    taxPercent: 18,
    description: '',
    isPromoted: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products');
      setProducts(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/products', formData);
      setIsModalOpen(false);
      setFormData({ name: '', code: '', category: 'HARDWARE', billingModel: 'ONE_TIME', basePrice: '', costPrice: '', unit: 'Unit', taxPercent: 18, description: '', isPromoted: false });
      fetchProducts();
    } catch (err) {
      alert('Failed to create product: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-brand-600" /> Products & Subscription Plans
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Configure Hardware, Implementation Services, and SaaS Recurring Plans with cost bases.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading product catalog..." />
      ) : error ? (
        <ErrorAlert message={error} onRetry={fetchProducts} />
      ) : products.length === 0 ? (
        <EmptyState title="No products configured" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <div
              key={p.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-brand-400 transition-all space-y-3 flex flex-col justify-between shadow-sm"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{p.name}</h3>
                    <span className="text-[10px] font-mono text-slate-500 font-semibold">{p.code}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-700">
                    {p.category}
                  </span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2">{p.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500 font-sans">Base Price:</span>
                  <strong className="text-brand-700 text-sm font-bold">₹{p.basePrice?.toLocaleString('en-IN')}</strong>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Cost: ₹{p.costPrice?.toLocaleString('en-IN')}</span>
                  <span className="font-semibold text-slate-700">Avail Stock: {p.availableStock}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Product">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-brand-500 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Product Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. HW-SRV-900"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-brand-500 font-mono shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-brand-500 shadow-sm"
              >
                <option value="HARDWARE">Hardware (Physical Asset)</option>
                <option value="SERVICES">Implementation & Services</option>
                <option value="SUBSCRIPTION">Software / SaaS Subscription</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Billing Model</label>
              <select
                value={formData.billingModel}
                onChange={(e) => setFormData({ ...formData, billingModel: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-brand-500 shadow-sm"
              >
                <option value="ONE_TIME">One-Time Charge</option>
                <option value="RECURRING">Recurring Subscription</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Base Price (₹) *</label>
              <input
                type="number"
                required
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-brand-500 font-mono shadow-sm"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Cost Base Price (₹)</label>
              <input
                type="number"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-brand-500 font-mono shadow-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Description</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-brand-500 text-xs shadow-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg shadow-sm">
              {submitting ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
