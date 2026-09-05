import React, { useState, useEffect } from 'react';
import { Boxes, MapPin, Truck, Plus, Package, RefreshCw } from 'lucide-react';
import api from '../api/client';
import { LoadingSpinner, EmptyState, ErrorAlert } from '../components/common/LoadingAndEmpty';
import { Modal } from '../components/common/Modal';

export const Warehouses = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stock Edit Modal
  const [stockModal, setStockModal] = useState({ isOpen: false, warehouse: null, product: null, currentQty: 0 });
  const [newQty, setNewQty] = useState(0);
  const [submittingStock, setSubmittingStock] = useState(false);

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/warehouses');
      setWarehouses(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch warehouses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleUpdateStock = async (e) => {
    e.preventDefault();
    if (!stockModal.warehouse || !stockModal.product) return;
    setSubmittingStock(true);
    try {
      await api.post('/stock/update', {
        warehouseId: stockModal.warehouse.id,
        productId: stockModal.product.id,
        quantity: parseInt(newQty, 10),
      });
      setStockModal({ isOpen: false, warehouse: null, product: null, currentQty: 0 });
      fetchWarehouses();
    } catch (err) {
      alert('Stock update failed: ' + err.message);
    } finally {
      setSubmittingStock(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Boxes className="w-6 h-6 text-brand-400" /> Multi-Warehouse Logistics & Stock Hubs
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure distribution centers, shipping cost weightings, and real-time inventory for auto-split fulfillment.
        </p>
      </div>

      {loading ? (
        <LoadingSpinner message="Fetching inventory distribution..." />
      ) : error ? (
        <ErrorAlert message={error} onRetry={fetchWarehouses} />
      ) : warehouses.length === 0 ? (
        <EmptyState title="No warehouses configured" />
      ) : (
        <div className="space-y-6">
          {warehouses.map((wh) => (
            <div
              key={wh.id}
              className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400">
                    <Boxes className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{wh.name}</h3>
                      {wh.isMain && (
                        <span className="px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30 text-[10px] font-bold">
                          Primary Hub
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {wh.location || 'Central Location'} • Code: <strong className="font-mono text-slate-300">{wh.code}</strong>
                    </p>
                  </div>
                </div>

                <div className="text-right text-xs font-mono">
                  <span className="text-slate-400 text-[10px] block font-sans">Freight Cost Weight</span>
                  <strong className="text-brand-300 font-bold">{wh.shippingCostWeight}x Multiplier</strong>
                </div>
              </div>

              {/* Stock Items Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">On-Hand Inventory Levels</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-400 border-b border-slate-800 font-semibold">
                        <th className="pb-2">Product Name</th>
                        <th className="pb-2">SKU Code</th>
                        <th className="pb-2">Physical On-Hand</th>
                        <th className="pb-2">Reserved for Quotes</th>
                        <th className="pb-2">Available for Sale</th>
                        <th className="pb-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {wh.stockItems?.map((st) => (
                        <tr key={st.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-2.5 font-sans font-semibold text-slate-200">{st.product?.name}</td>
                          <td className="py-2.5 text-slate-400 text-[11px]">{st.product?.code}</td>
                          <td className="py-2.5 text-white font-bold">{st.quantity}</td>
                          <td className="py-2.5 text-amber-400">{st.reservedQty}</td>
                          <td className="py-2.5 text-emerald-400 font-bold">{Math.max(0, st.quantity - st.reservedQty)}</td>
                          <td className="py-2.5 text-right font-sans">
                            <button
                              onClick={() => {
                                setStockModal({ isOpen: true, warehouse: wh, product: st.product, currentQty: st.quantity });
                                setNewQty(st.quantity);
                              }}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-semibold transition-all"
                            >
                              Update Stock
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stock Edit Modal */}
      <Modal
        isOpen={stockModal.isOpen}
        onClose={() => setStockModal({ isOpen: false, warehouse: null, product: null, currentQty: 0 })}
        title="Adjust Warehouse Inventory Stock"
      >
        <form onSubmit={handleUpdateStock} className="space-y-4 text-xs">
          <p className="text-slate-300">
            Updating stock for <strong>{stockModal.product?.name}</strong> at <strong>{stockModal.warehouse?.name}</strong>.
          </p>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Total Physical Units in Warehouse *</label>
            <input
              type="number"
              min="0"
              required
              value={newQty}
              onChange={(e) => setNewQty(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 font-mono text-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setStockModal({ isOpen: false, warehouse: null, product: null, currentQty: 0 })}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingStock}
              className="px-5 py-2 bg-brand-500 text-slate-950 font-bold rounded-lg shadow-glow"
            >
              {submittingStock ? 'Saving...' : 'Save Stock Level'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
