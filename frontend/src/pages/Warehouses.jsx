import React, { useState, useEffect } from 'react';
import { Boxes, MapPin, Truck, Plus, Package, RefreshCw, CheckCircle2 } from 'lucide-react';
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

  // Create Warehouse Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [whForm, setWhForm] = useState({
    name: '',
    code: '',
    location: '',
    shippingCostWeight: 1.0,
    isMain: false,
  });
  const [creatingWh, setCreatingWh] = useState(false);

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

  const handleCreateWarehouse = async (e) => {
    e.preventDefault();
    setCreatingWh(true);
    try {
      await api.post('/warehouses', {
        ...whForm,
        shippingCostWeight: parseFloat(whForm.shippingCostWeight) || 1.0,
      });
      setCreateModalOpen(false);
      setWhForm({ name: '', code: '', location: '', shippingCostWeight: 1.0, isMain: false });
      fetchWarehouses();
    } catch (err) {
      alert('Failed to create warehouse: ' + err.message);
    } finally {
      setCreatingWh(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Boxes className="w-6 h-6 text-brand-600" /> Multi-Warehouse Logistics & Stock Hubs
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Configure distribution centers, shipping cost weightings, and real-time inventory for dynamic auto-split fulfillment.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Warehouse Hub
        </button>
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
              className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-700 font-bold">
                    <Boxes className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{wh.name}</h3>
                      {wh.isMain && (
                        <span className="px-2 py-0.5 rounded bg-brand-100 text-brand-800 border border-brand-200 text-[10px] font-bold">
                          Primary Hub
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {wh.location || 'Central Location'} • Code: <strong className="font-mono text-slate-700">{wh.code}</strong>
                    </p>
                  </div>
                </div>

                <div className="text-right text-xs font-mono">
                  <span className="text-slate-500 text-[10px] block font-sans font-medium">Freight Cost Weight</span>
                  <strong className="text-brand-700 font-bold text-sm">{wh.shippingCostWeight}x Multiplier</strong>
                </div>
              </div>

              {/* Stock Items Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">On-Hand Inventory Levels</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-200 font-semibold">
                        <th className="pb-2">Product Name</th>
                        <th className="pb-2">SKU Code</th>
                        <th className="pb-2">Physical On-Hand</th>
                        <th className="pb-2">Reserved for Quotes</th>
                        <th className="pb-2">Available for Sale</th>
                        <th className="pb-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {wh.stockItems?.map((st) => (
                        <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 font-sans font-semibold text-slate-900">{st.product?.name}</td>
                          <td className="py-2.5 text-slate-500 text-[11px]">{st.product?.code}</td>
                          <td className="py-2.5 text-slate-900 font-bold">{st.quantity}</td>
                          <td className="py-2.5 text-amber-700 font-bold">{st.reservedQty}</td>
                          <td className="py-2.5 text-emerald-700 font-bold">{Math.max(0, st.quantity - st.reservedQty)}</td>
                          <td className="py-2.5 text-right font-sans">
                            <button
                              onClick={() => {
                                setStockModal({ isOpen: true, warehouse: wh, product: st.product, currentQty: st.quantity });
                                setNewQty(st.quantity);
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-[11px] font-semibold transition-all shadow-sm border border-slate-200"
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
          <p className="text-slate-700">
            Updating stock for <strong className="text-slate-900">{stockModal.product?.name}</strong> at <strong className="text-slate-900">{stockModal.warehouse?.name}</strong>.
          </p>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Total Physical Units in Warehouse *</label>
            <input
              type="number"
              min="0"
              required
              value={newQty}
              onChange={(e) => setNewQty(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-900 font-mono text-sm focus:outline-none focus:border-brand-500 shadow-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setStockModal({ isOpen: false, warehouse: null, product: null, currentQty: 0 })}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingStock}
              className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg shadow-sm transition-all"
            >
              {submittingStock ? 'Saving...' : 'Save Stock Level'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Warehouse Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Register New Warehouse Hub"
      >
        <form onSubmit={handleCreateWarehouse} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Warehouse Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Pune Tech Park Hub"
              value={whForm.name}
              onChange={(e) => setWhForm({ ...whForm, name: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-brand-500 shadow-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Hub Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. WH-PUN-01"
                value={whForm.code}
                onChange={(e) => setWhForm({ ...whForm, code: e.target.value.toUpperCase() })}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-mono text-slate-900 focus:outline-none focus:border-brand-500 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Location / Region</label>
              <input
                type="text"
                placeholder="e.g. Maharashtra, India"
                value={whForm.location}
                onChange={(e) => setWhForm({ ...whForm, location: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-brand-500 shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Shipping Cost Multiplier</label>
              <input
                type="number"
                step="0.05"
                min="0.5"
                max="3.0"
                value={whForm.shippingCostWeight}
                onChange={(e) => setWhForm({ ...whForm, shippingCostWeight: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono focus:outline-none focus:border-brand-500 shadow-sm"
              />
            </div>
            <div className="pt-4 flex items-center gap-2">
              <input
                type="checkbox"
                id="isMainHub"
                checked={whForm.isMain}
                onChange={(e) => setWhForm({ ...whForm, isMain: e.target.checked })}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
              />
              <label htmlFor="isMainHub" className="text-slate-800 font-semibold cursor-pointer">
                Designate as Primary Hub
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creatingWh}
              className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg shadow-sm transition-all"
            >
              {creatingWh ? 'Creating...' : 'Create Warehouse'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
