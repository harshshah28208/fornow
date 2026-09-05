import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  Kanban,
  Table as TableIcon,
  Plus,
  Search,
  ArrowUpDown,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Building2,
  Percent,
  CheckCircle2,
  Clock,
  Send,
  Boxes,
  RefreshCw,
} from 'lucide-react';
import api from '../api/client';
import { StatusBadge, RiskBadge, TierBadge } from '../components/common/Badge';
import { LoadingSpinner, EmptyState } from '../components/common/LoadingAndEmpty';
import { Modal } from '../components/common/Modal';

export const Quotations = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'table'
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State for New Quotation
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deals, setDeals] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedDealId, setSelectedDealId] = useState('');
  const [quoteItems, setQuoteItems] = useState([]);
  const [orderDiscount, setOrderDiscount] = useState(0);
  const [billingFrequency, setBillingFrequency] = useState('MONTHLY');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [pricingPreview, setPricingPreview] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/quotes', {
        params: { status: statusFilter, search },
      });
      setQuotes(res.data || []);
    } catch (err) {
      console.error('Failed to load quotes:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFormMetadata = async () => {
    try {
      const [dealsRes, productsRes, whRes] = await Promise.all([
        api.get('/deals'),
        api.get('/products'),
        api.get('/warehouses'),
      ]);
      setDeals(dealsRes.data || []);
      setProducts(productsRes.data || []);
      setWarehouses(whRes.data || []);
    } catch (err) {
      console.error('Failed to load metadata:', err);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, [statusFilter]);

  useEffect(() => {
    fetchFormMetadata();
  }, []);

  // Recalculate pricing preview whenever items or order discount change
  const triggerPricingCalculation = async (items, discount, dealId) => {
    if (!items.length) {
      setPricingPreview(null);
      return;
    }
    setCalculating(true);
    try {
      const deal = deals.find((d) => d.id === dealId);
      const res = await api.post('/quotes/preview', {
        items: items.map((it) => ({
          productId: it.productId,
          productPlanId: it.productPlanId || undefined,
          quantity: parseInt(it.quantity || 1, 10),
          discountPercent: parseFloat(it.discountPercent || 0),
        })),
        orderLevelDiscount: parseFloat(discount || 0),
        accountId: deal ? deal.accountId : undefined,
      });
      setPricingPreview(res.data);
    } catch (err) {
      console.error('Pricing preview error:', err);
    } finally {
      setCalculating(false);
    }
  };

  const handleAddItem = () => {
    if (!products.length) return;
    const defaultProduct = products[0];
    const newItems = [
      ...quoteItems,
      {
        productId: defaultProduct.id,
        productPlanId: defaultProduct.plans?.[0]?.id || '',
        quantity: 1,
        unitPrice: defaultProduct.basePrice,
        discountPercent: 0,
        warehouseId: warehouses[0]?.id || '',
      },
    ];
    setQuoteItems(newItems);
    triggerPricingCalculation(newItems, orderDiscount, selectedDealId);
  };

  const handleUpdateItem = (index, field, value) => {
    const updated = [...quoteItems];
    updated[index][field] = value;

    if (field === 'productId') {
      const prod = products.find((p) => p.id === value);
      if (prod) {
        updated[index].unitPrice = prod.basePrice;
        updated[index].productPlanId = prod.plans?.[0]?.id || '';
      }
    }
    setQuoteItems(updated);
    triggerPricingCalculation(updated, orderDiscount, selectedDealId);
  };

  const handleRemoveItem = (index) => {
    const updated = quoteItems.filter((_, i) => i !== index);
    setQuoteItems(updated);
    triggerPricingCalculation(updated, orderDiscount, selectedDealId);
  };

  const handleSaveQuote = async (isSubmitForApproval = false) => {
    if (!selectedDealId) {
      alert('Please select an active deal.');
      return;
    }
    if (!quoteItems.length) {
      alert('Please add at least one product item.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/quotes/save', {
        dealId: selectedDealId,
        items: quoteItems.map((it) => ({
          productId: it.productId,
          productPlanId: it.productPlanId || undefined,
          quantity: parseInt(it.quantity || 1, 10),
          discountPercent: parseFloat(it.discountPercent || 0),
        })),
        orderLevelDiscount: parseFloat(orderDiscount || 0),
        billingFrequency,
        notes: quoteNotes,
        isSubmitForApproval,
        warehouseAllocations: quoteItems.map((it) => ({
          productId: it.productId,
          warehouseId: it.warehouseId,
        })),
      });

      alert(res.message || 'Quotation created successfully!');
      setShowCreateModal(false);
      // Reset
      setQuoteItems([]);
      setOrderDiscount(0);
      setPricingPreview(null);
      fetchQuotes();
    } catch (err) {
      alert('Failed to save quotation: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransitionStage = async (quoteId, nextStage) => {
    try {
      await api.put(`/quotes/${quoteId}/stage`, { stage: nextStage });
      fetchQuotes();
    } catch (err) {
      alert('Stage transition error: ' + err.message);
    }
  };

  // Kanban Columns Definition
  const kanbanColumns = [
    { id: 'DRAFT', title: 'Draft', color: 'border-slate-300 bg-slate-50/50' },
    { id: 'PENDING_APPROVAL', title: 'Pending Approval', color: 'border-amber-300 bg-amber-50/30' },
    { id: 'APPROVED', title: 'Approved', color: 'border-teal-300 bg-teal-50/30' },
    { id: 'NEGOTIATION', title: 'Negotiation', color: 'border-indigo-300 bg-indigo-50/30' },
    { id: 'CONFIRMED', title: 'Confirmed', color: 'border-emerald-300 bg-emerald-50/30' },
  ];

  // Group quotes by column
  const getColumnQuotes = (colId) => {
    return quotes.filter((q) => {
      if (colId === 'CONFIRMED') return q.status === 'ACCEPTED' || q.status === 'CONFIRMED';
      if (colId === 'APPROVED') return q.status === 'APPROVED' || q.status === 'SENT';
      return q.status === colId;
    });
  };

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* Header with View Switcher & Action */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-teal-600" /> Quotations Engine
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Rule-driven CPQ quotation generator, margin protection, and multi-tier approval governance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Switcher Toggle */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white text-teal-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" /> Kanban Board
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-teal-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" /> Table View
            </button>
          </div>

          <button
            onClick={() => {
              setShowCreateModal(true);
              if (deals.length && !selectedDealId) setSelectedDealId(deals[0].id);
              if (!quoteItems.length && products.length) {
                handleAddItem();
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> New Quotation
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Search and Filters */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by quote code, account, or deal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchQuotes()}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-teal-500"
          >
            <option value="ALL">All Stages</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="NEGOTIATION">Negotiation</option>
            <option value="CONFIRMED">Confirmed</option>
          </select>

          <button
            onClick={fetchQuotes}
            title="Reload quotations"
            className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded-lg"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Main Content Area */}
      {/* ------------------------------------------------------------- */}
      {loading ? (
        <LoadingSpinner message="Fetching quotations from PostgreSQL..." />
      ) : quotes.length === 0 ? (
        <EmptyState
          title="No quotations found"
          description="Create your first rule-governed quotation with live pricing calculation."
          actionText="+ New Quotation"
          onAction={() => setShowCreateModal(true)}
        />
      ) : viewMode === 'kanban' ? (
        /* ---------------- KANBAN BOARD VIEW ---------------- */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
          {kanbanColumns.map((col) => {
            const colQuotes = getColumnQuotes(col.id);
            const totalColValue = colQuotes.reduce((sum, q) => sum + (q.totalAmount || 0), 0);

            return (
              <div
                key={col.id}
                className={`rounded-2xl border p-3 flex flex-col gap-3 min-h-[480px] ${col.color}`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-slate-800 tracking-tight">{col.title}</span>
                    <span className="px-2 py-0.5 rounded-full bg-white text-slate-600 text-[10px] font-bold border border-slate-200 shadow-xs">
                      {colQuotes.length}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-extrabold text-teal-700">
                    ₹{totalColValue.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[70vh]">
                  {colQuotes.map((quote) => (
                    <div
                      key={quote.id}
                      className="bg-white p-4 rounded-xl border border-slate-200 hover:border-teal-300 hover:shadow-md transition-all space-y-3 relative group"
                    >
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                            {quote.quoteNumber}
                          </span>
                          <h4 className="font-bold text-xs text-slate-900 mt-1 line-clamp-1">
                            {quote.deal?.account?.name || 'Enterprise Account'}
                          </h4>
                          <p className="text-[10px] text-slate-500 truncate">{quote.deal?.title}</p>
                        </div>
                        <StatusBadge status={quote.status} />
                      </div>

                      {/* Items & Margins Summary */}
                      <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <span className="text-slate-400 block font-semibold">Subtotal</span>
                          <strong className="text-slate-800 font-mono">
                            ₹{quote.subtotal?.toLocaleString('en-IN')}
                          </strong>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 block font-semibold">Total Price</span>
                          <strong className="text-teal-700 font-mono font-extrabold text-xs">
                            ₹{quote.totalAmount?.toLocaleString('en-IN')}
                          </strong>
                        </div>
                      </div>

                      {/* Badges: Discount, Margin & Risk */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {quote.discountPercent > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            {quote.discountPercent}% OFF
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {quote.marginPercent}% Margin
                        </span>
                        {quote.blendedRiskScore > 0 && (
                          <RiskBadge score={quote.blendedRiskScore} />
                        )}
                      </div>

                      {/* Customer Portal Feedback if present */}
                      {quote.customerFeedback && (
                        <div className="p-2 rounded bg-indigo-50 border border-indigo-200 text-[10px] text-indigo-900 font-medium">
                          <span className="font-bold block">Customer Counter:</span>
                          "{quote.customerFeedback}"
                        </div>
                      )}

                      {/* Card Actions Footer */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                        <button
                          onClick={() => navigate(`/portal/${quote.quoteNumber}`)}
                          className="text-teal-600 hover:text-teal-800 font-bold flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" /> Customer Portal
                        </button>

                        {/* Fast stage transition select */}
                        <select
                          value={quote.status}
                          onChange={(e) => handleTransitionStage(quote.id, e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-[10px] text-slate-700 font-semibold focus:outline-none"
                        >
                          <option value="DRAFT">Draft</option>
                          <option value="PENDING_APPROVAL">Pending Approval</option>
                          <option value="APPROVED">Approved</option>
                          <option value="NEGOTIATION">Negotiation</option>
                          <option value="ACCEPTED">Confirmed</option>
                          <option value="REJECTED">Rejected</option>
                        </select>
                      </div>
                    </div>
                  ))}

                  {colQuotes.length === 0 && (
                    <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl bg-white/40">
                      <p className="text-[11px] text-slate-400 font-medium">No quotes in {col.title}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ---------------- TABLE VIEW ---------------- */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-extrabold">
                <tr>
                  <th className="py-3 px-4">Quotation Code</th>
                  <th className="py-3 px-4">Account & Deal</th>
                  <th className="py-3 px-4">Customer Tier</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Margin %</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-700">
                      {quote.quoteNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <strong className="text-slate-900 block">{quote.deal?.account?.name}</strong>
                      <span className="text-[11px] text-slate-500">{quote.deal?.title}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <TierBadge tier={quote.deal?.account?.tier || 'BRONZE'} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {quote.items?.length || 0} product(s)
                    </td>
                    <td className="py-3.5 px-4">
                      {quote.discountPercent > 0 ? (
                        <span className="font-bold text-amber-700">{quote.discountPercent}%</span>
                      ) : (
                        <span className="text-slate-400">0%</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {quote.marginPercent}%
                    </td>
                    <td className="py-3.5 px-4 font-mono font-extrabold text-slate-900 text-sm">
                      ₹{quote.totalAmount?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={quote.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/portal/${quote.quoteNumber}`)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center gap-1 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" /> Portal
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Reactive + New Quotation Builder Modal */}
      {/* ------------------------------------------------------------- */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New Rule-Governed Quotation"
          size="2xl"
        >
          <div className="space-y-5 text-xs">
            {/* Deal Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Target Deal & Account *</label>
                <select
                  value={selectedDealId}
                  onChange={(e) => {
                    setSelectedDealId(e.target.value);
                    triggerPricingCalculation(quoteItems, orderDiscount, e.target.value);
                  }}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-semibold focus:outline-none focus:border-teal-500 shadow-xs"
                >
                  <option value="">-- Select Active Deal --</option>
                  {deals.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title} ({d.account?.name} - {d.account?.tier})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Billing Frequency</label>
                <select
                  value={billingFrequency}
                  onChange={(e) => setBillingFrequency(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-semibold focus:outline-none focus:border-teal-500 shadow-xs"
                >
                  <option value="MONTHLY">Monthly Billing</option>
                  <option value="QUARTERLY">Quarterly Billing</option>
                  <option value="ANNUAL">Annual Billing</option>
                  <option value="ONE_TIME">One-Time Billing</option>
                </select>
              </div>
            </div>

            {/* Line Items Builder */}
            <div className="space-y-3 pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">
                  Quotation Line Items ({quoteItems.length})
                </h3>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-3 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold rounded-lg text-xs flex items-center gap-1 border border-teal-200"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Product Line
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {quoteItems.map((item, idx) => {
                  const prod = products.find((p) => p.id === item.productId);

                  return (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-12 gap-2 items-center"
                    >
                      <div className="col-span-4">
                        <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Product</label>
                        <select
                          value={item.productId}
                          onChange={(e) => handleUpdateItem(idx, 'productId', e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-semibold focus:outline-none"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (₹{p.basePrice?.toLocaleString('en-IN')})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(idx, 'quantity', e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-mono font-bold"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Disc %</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discountPercent}
                          onChange={(e) => handleUpdateItem(idx, 'discountPercent', e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-mono font-bold"
                        />
                      </div>

                      <div className="col-span-3">
                        <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Warehouse</label>
                        <select
                          value={item.warehouseId}
                          onChange={(e) => handleUpdateItem(idx, 'warehouseId', e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-semibold focus:outline-none"
                        >
                          {warehouses.map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-1 text-right pt-4">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-rose-500 hover:text-rose-700 font-bold text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Level Discount & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Overall Order Discount % (Triggers Governance)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={orderDiscount}
                    onChange={(e) => {
                      setOrderDiscount(e.target.value);
                      triggerPricingCalculation(quoteItems, e.target.value, selectedDealId);
                    }}
                    className="w-32 bg-white border border-slate-300 rounded-xl p-2 font-mono font-bold text-slate-900 focus:outline-none focus:border-teal-500"
                  />
                  <span className="text-slate-500 text-xs font-bold">%</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Quotation Notes & Terms</label>
                <input
                  type="text"
                  placeholder="e.g. Volume tier discount applied."
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2 text-slate-900 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {/* Real-time Pricing Preview Banner */}
            {pricingPreview && (
              <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-800">
                    Live Server Pricing Engine Preview
                  </span>
                  {calculating && <span className="text-[10px] text-teal-600 font-bold animate-pulse">Calculating...</span>}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-teal-200 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block font-semibold">Subtotal</span>
                    <strong className="text-slate-900 font-mono">
                      ₹{pricingPreview.pricing?.subtotal?.toLocaleString('en-IN')}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block font-semibold">Discount Amount</span>
                    <strong className="text-amber-700 font-mono">
                      -₹{pricingPreview.pricing?.discountAmount?.toLocaleString('en-IN')}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block font-semibold">Tax (18% GST)</span>
                    <strong className="text-slate-800 font-mono">
                      ₹{pricingPreview.pricing?.taxAmount?.toLocaleString('en-IN')}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block font-semibold">Final Total</span>
                    <strong className="text-teal-800 font-mono font-extrabold text-sm">
                      ₹{pricingPreview.pricing?.totalAmount?.toLocaleString('en-IN')}
                    </strong>
                  </div>
                </div>

                {/* Governance Alert if Approval Required */}
                {pricingPreview.discountEval?.requiresApproval && (
                  <div className="p-2.5 rounded-lg bg-amber-100/70 border border-amber-300 text-amber-900 text-[11px] flex items-center gap-2 mt-2">
                    <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                    <div>
                      <strong className="block">Approval Threshold Exceeded:</strong>
                      {pricingPreview.discountEval.approvalReason} • Escalates to <strong>{pricingPreview.discountEval.requiredApprovalRole}</strong>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={submitting || !quoteItems.length}
                onClick={() => handleSaveQuote(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition-colors"
              >
                Save as Draft
              </button>

              <button
                type="button"
                disabled={submitting || !quoteItems.length}
                onClick={() => handleSaveQuote(true)}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-xl text-xs shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Submit for Approval / Release
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export const QuotationsPage = Quotations;
export default Quotations;
