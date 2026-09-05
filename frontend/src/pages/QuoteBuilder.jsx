import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Plus,
  Trash2,
  Building2,
  Boxes,
  ShieldAlert,
  CheckCircle2,
  TrendingUp,
  Percent,
  ArrowRight,
  Package,
  Server,
  Layers,
  HelpCircle,
  Truck,
  RotateCcw,
} from 'lucide-react';
import api from '../api/client';
import { StageBadge, TierBadge, RiskBadge } from '../components/common/Badge';
import { LoadingSpinner, ErrorAlert } from '../components/common/LoadingAndEmpty';
import { Modal } from '../components/common/Modal';

export const QuoteBuilder = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dealIdParam = searchParams.get('dealId');

  const [deals, setDeals] = useState([]);
  const [selectedDealId, setSelectedDealId] = useState(dealIdParam || '');
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  // Cart items: [{ productId, productPlanId, quantity, discountPercent }]
  const [cartItems, setCartItems] = useState([]);
  const [orderDiscount, setOrderDiscount] = useState(0);
  const [billingFrequency, setBillingFrequency] = useState('MONTHLY');
  const [notes, setNotes] = useState('');

  // Live Telemetry from Preview API
  const [previewData, setPreviewData] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [upsells, setUpsells] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Fulfillment Split Modal State
  const [showFulfillmentModal, setShowFulfillmentModal] = useState(false);
  const [customWarehouseAllocations, setCustomWarehouseAllocations] = useState([]);

  // Initial Data Fetch
  useEffect(() => {
    const initData = async () => {
      try {
        const [dealsRes, productsRes, whRes] = await Promise.all([
          api.get('/deals'),
          api.get('/products'),
          api.get('/warehouses'),
        ]);
        setDeals(dealsRes.data || []);
        setProducts(productsRes.data || []);
        setWarehouses(whRes.data || []);

        if (dealIdParam) {
          const found = (dealsRes.data || []).find((d) => d.id === dealIdParam);
          if (found) setSelectedDeal(found);
        }
      } catch (err) {
        console.error('Failed to init quote builder data:', err);
      }
    };
    initData();
  }, [dealIdParam]);

  // Update selected deal object
  useEffect(() => {
    if (selectedDealId && deals.length) {
      const found = deals.find((d) => d.id === selectedDealId);
      setSelectedDeal(found || null);
    }
  }, [selectedDealId, deals]);

  // Recalculate Live Preview & Upsells whenever cart changes
  useEffect(() => {
    if (!cartItems.length) {
      setPreviewData(null);
      setUpsells([]);
      return;
    }

    const timer = setTimeout(async () => {
      setCalculating(true);
      try {
        const previewRes = await api.post('/quotes/preview', {
          items: cartItems,
          orderLevelDiscount: orderDiscount,
          accountId: selectedDeal?.accountId,
        });
        setPreviewData(previewRes.data);

        // Fetch dynamic upsell recommendations
        const pIds = cartItems.map((i) => i.productId).join(',');
        const upsellRes = await api.get(`/upsells?productIds=${pIds}`);
        setUpsells(upsellRes.data || []);
      } catch (err) {
        console.error('Preview calc error:', err);
      } finally {
        setCalculating(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [cartItems, orderDiscount, selectedDeal]);

  // Cart operations
  const handleAddProduct = (product) => {
    const existingIndex = cartItems.findIndex((i) => i.productId === product.id);
    if (existingIndex > -1) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += 1;
      setCartItems(updated);
    } else {
      setCartItems([
        ...cartItems,
        {
          productId: product.id,
          productPlanId: product.plans?.[0]?.id || null,
          quantity: 1,
          discountPercent: orderDiscount || 0,
        },
      ]);
    }
  };

  const handleUpdateItem = (index, field, value) => {
    const updated = [...cartItems];
    updated[index][field] = value;
    setCartItems(updated);
  };

  const handleRemoveItem = (index) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  const handleApplyOrderDiscount = (pct) => {
    const val = Math.max(0, Math.min(100, parseFloat(pct || 0)));
    setOrderDiscount(val);
    setCartItems(cartItems.map((it) => ({ ...it, discountPercent: val })));
  };

  // Submit quote to backend
  const handleSaveQuote = async (isSubmitForApproval) => {
    if (!selectedDealId) {
      alert('Please select a target deal');
      return;
    }
    if (!cartItems.length) {
      alert('Please add at least one product to the quote');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/quotes/save', {
        dealId: selectedDealId,
        items: cartItems,
        orderLevelDiscount: orderDiscount,
        billingFrequency,
        notes,
        isSubmitForApproval,
        warehouseAllocations: customWarehouseAllocations,
      });

      alert(res.message || 'Quote saved successfully!');
      navigate(`/deals/${selectedDealId}`);
    } catch (err) {
      alert('Quote creation error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-brand-400" /> Quotation Builder & Pricing Engine
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Build multi-line quotes with live margin telemetry, blended risk governance, and multi-warehouse split.
          </p>
        </div>

        {/* Target Deal Selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-400">Target Deal:</label>
          <select
            value={selectedDealId}
            onChange={(e) => setSelectedDealId(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-brand-500 font-semibold"
          >
            <option value="">-- Choose Opportunity --</option>
            {deals.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title} ({d.account?.name} - {d.account?.tier})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Target Account Badge Strip */}
      {selectedDeal && (
        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs">
            <Building2 className="w-4 h-4 text-brand-400" />
            <span className="text-white font-bold">{selectedDeal.account?.name}</span>
            <TierBadge tier={selectedDeal.account?.tier} />
            <span className="text-slate-400">
              Discretionary Ceiling: <strong className="text-brand-300 font-mono">{selectedDeal.account?.tier === 'GOLD' ? '15%' : selectedDeal.account?.tier === 'SILVER' ? '10%' : '5%'}</strong>
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Current Stage: <strong className="text-slate-200">{selectedDeal.stage}</strong>
          </span>
        </div>
      )}

      {/* Grid: Product Catalog (Left) + Cart & Pricing Engine (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Product Selector (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-brand-400" /> Product Catalog
            </h3>
            <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-brand-500/40 transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white group-hover:text-brand-300 transition-colors truncate">
                        {p.name}
                      </h4>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {p.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{p.description}</p>
                    <div className="flex items-center gap-3 text-[11px] font-mono mt-1 text-slate-300">
                      <span>Base: <strong>₹{p.basePrice.toLocaleString('en-IN')}</strong></span>
                      <span className="text-slate-400">Avail Stock: {p.availableStock}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddProduct(p)}
                    className="p-2 bg-brand-500/15 hover:bg-brand-500/30 text-brand-300 border border-brand-500/30 rounded-lg text-xs font-bold transition-all flex-shrink-0"
                    title="Add to Quote"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Cart & Pricing & Governance (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-400" /> Quotation Cart ({cartItems.length} items)
              </h3>

              {/* Order Level Discount Input */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 font-semibold">Bulk Discount %:</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={orderDiscount}
                  onChange={(e) => handleApplyOrderDiscount(e.target.value)}
                  className="w-16 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-center text-amber-400 font-bold focus:outline-none focus:border-brand-500 font-mono text-xs"
                />
              </div>
            </div>

            {/* Cart Items Table */}
            {cartItems.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Your cart is empty. Select products from the catalog to configure pricing.
              </div>
            ) : (
              <div className="space-y-3">
                {cartItems.map((item, index) => {
                  const product = products.find((p) => p.id === item.productId);
                  const evalItem = previewData?.pricing?.items?.[index];

                  return (
                    <div
                      key={index}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <strong className="text-white font-bold">{product?.name}</strong>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                            {product?.category}
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-4 gap-3 pt-2 items-center">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(index, 'quantity', parseInt(e.target.value || 1, 10))}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-center font-mono text-white text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Line Discount %</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discountPercent}
                            onChange={(e) => handleUpdateItem(index, 'discountPercent', parseFloat(e.target.value || 0))}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-center font-mono text-amber-400 font-bold text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Line Margin</label>
                          <span className="font-mono text-emerald-400 font-bold block pt-1">
                            {evalItem?.marginPercent || 32.5}%
                          </span>
                        </div>

                        <div className="text-right">
                          <label className="text-[10px] text-slate-400 block mb-0.5">Line Total</label>
                          <strong className="font-mono text-brand-400 font-bold text-sm block">
                            ₹{evalItem?.totalAmount?.toLocaleString('en-IN') || (product?.basePrice * item.quantity).toLocaleString('en-IN')}
                          </strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* Live Telemetry: Blended Risk Score & Margin Engine */}
            {/* ------------------------------------------------------------- */}
            {previewData && (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-brand-400" /> Pricing & Governance Telemetry
                  </span>
                  <RiskBadge riskScore={previewData.discountEval?.blendedRiskScore} />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block font-sans">Subtotal</span>
                    <strong className="text-white">₹{previewData.pricing.subtotal.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block font-sans">Discount Amt</span>
                    <strong className="text-amber-400">-₹{previewData.pricing.discountAmount.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block font-sans">Tax (18%)</span>
                    <strong className="text-slate-300">₹{previewData.pricing.taxAmount.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-brand-950/40 border border-brand-500/40">
                    <span className="text-brand-300 text-[10px] block font-sans font-bold">Grand Total</span>
                    <strong className="text-brand-400 text-sm font-extrabold">₹{previewData.pricing.totalAmount.toLocaleString('en-IN')}</strong>
                  </div>
                </div>

                {/* Blended Governance Status Box */}
                <div
                  className={`p-3.5 rounded-xl border text-xs ${
                    previewData.discountEval?.requiresApproval
                      ? 'bg-rose-950/25 border-rose-800/50 text-rose-300'
                      : 'bg-emerald-950/25 border-emerald-800/50 text-emerald-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold mb-1">
                    {previewData.discountEval?.requiresApproval ? (
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                    <span>
                      {previewData.discountEval?.requiresApproval
                        ? `Approval Required: Route to ${previewData.discountEval?.requiredApprovalRole}`
                        : 'Approved automatically (Within Sales Rep Discretion)'}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    {previewData.discountEval?.approvalReason}
                  </p>
                </div>

                {/* Warehouse Split Quick Trigger */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-brand-400" /> Auto-Split Warehouses: <strong>{previewData.warehouseSplit?.totalShipments || 1} Shipment(s)</strong>
                  </span>
                  <button
                    onClick={() => setShowFulfillmentModal(true)}
                    className="text-brand-400 hover:underline font-semibold"
                  >
                    View Warehouse Split Details
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => handleSaveQuote(false)}
                disabled={submitting || !cartItems.length}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all"
              >
                Save as Draft
              </button>

              <button
                onClick={() => handleSaveQuote(true)}
                disabled={submitting || !cartItems.length}
                className="px-6 py-2.5 bg-gradient-to-r from-brand-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-slate-950 font-extrabold rounded-xl shadow-glow text-xs flex items-center gap-2 transition-all"
              >
                {submitting ? 'Submitting...' : previewData?.discountEval?.requiresApproval ? 'Submit for Approval' : 'Finalize & Approve Quote'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* Live Upsell / Cross-Sell Suggestions (PDF Page 7, B5) */}
          {/* ------------------------------------------------------------- */}
          {upsells.length > 0 && (
            <div className="glass-panel p-5 rounded-2xl border border-brand-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-brand-400" /> Recommended Upsells & Cross-Sell Add-ons
                </h4>
                <span className="text-[10px] text-brand-300 font-semibold px-2 py-0.5 rounded bg-brand-500/10 border border-brand-500/20">
                  AI Deal Optimizer
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {upsells.map((u) => (
                  <div
                    key={u.id}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-brand-500/40 transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="text-xs font-bold text-white line-clamp-1">{u.name}</h5>
                        <span className="text-[10px] text-amber-400 font-semibold">{u.promotionTag}</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">
                        +{u.marginDelta}% Margin
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                      <span className="font-mono text-xs text-white">₹{u.basePrice.toLocaleString('en-IN')}</span>
                      <button
                        onClick={() => {
                          const prod = products.find((p) => p.id === u.productId);
                          if (prod) handleAddProduct(prod);
                        }}
                        className="px-2.5 py-1 bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold rounded-lg text-[11px] transition-all"
                      >
                        + Add to Quote
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fulfillment & Warehouse Split Modal */}
      <Modal
        isOpen={showFulfillmentModal}
        onClose={() => setShowFulfillmentModal(false)}
        title="Multi-Warehouse Fulfillment Split & Stock Allocation"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-300">
            Based on real-time stock across hubs, DealFlow360 recommends splitting fulfillment to minimize shipping freight costs and transit delays.
          </p>

          <div className="space-y-3">
            {previewData?.warehouseSplit?.warehouseShipments?.map((ws, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white">{ws.warehouseName}</h4>
                  <p className="text-[11px] text-slate-400">{ws.totalUnits} Units • {ws.itemsCount} Product Line(s)</p>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] block">Est. Freight Cost</span>
                  <strong className="font-mono text-brand-300">₹{ws.estimatedCost.toLocaleString('en-IN')}</strong>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-800">
            <button
              onClick={() => setShowFulfillmentModal(false)}
              className="px-4 py-2 bg-brand-500 text-slate-950 font-bold rounded-lg shadow-glow"
            >
              Accept Recommended Split
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
