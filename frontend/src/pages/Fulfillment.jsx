import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Truck,
  CheckCircle2,
  Clock,
  Building2,
  Calendar,
  Package,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import api from '../api/client';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/Badge';
import { LoadingSpinner, EmptyState } from '../components/common/LoadingAndEmpty';

export const Fulfillment = () => {
  const [contracts, setContracts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFulfillmentData = async () => {
    setLoading(true);
    try {
      const [cRes, wRes] = await Promise.all([
        api.get('/contracts'),
        api.get('/warehouses'),
      ]);
      setContracts(cRes.data || []);
      setWarehouses(wRes.data || []);
    } catch (err) {
      console.error('Failed to load fulfillment data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFulfillmentData();
  }, []);

  if (loading) return <LoadingSpinner message="Loading fulfillment milestones & stock allocations..." />;

  const activeContracts = contracts.filter((c) => c.status === 'SIGNED' || c.status === 'APPROVED');
  const pendingContracts = contracts.filter((c) => c.status === 'DRAFT' || c.status === 'LEGAL_REVIEW');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Truck className="w-5 h-5 text-teal-600" /> Fulfillment & Provisioning Operations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Post-sale customer onboarding, multi-warehouse delivery routing, provisioning milestones, and SLA guarantees.
          </p>
        </div>

        <button
          onClick={fetchFulfillmentData}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Hubs
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Provisioning"
          value={activeContracts.length}
          subtitle="Signed contracts in delivery"
          color="teal"
          icon={Truck}
        />
        <StatCard
          title="Regional Distribution Hubs"
          value={warehouses.length}
          subtitle="Multi-warehouse active routing"
          color="indigo"
          icon={Boxes}
        />
        <StatCard
          title="Average Fulfillment SLA"
          value="4.2 Days"
          subtitle="From contract signing"
          color="emerald"
          icon={CheckCircle2}
        />
        <StatCard
          title="Pending Legal Review"
          value={pendingContracts.length}
          subtitle="Awaiting sign-off"
          color="amber"
          icon={Clock}
        />
      </div>

      {/* Two Column Section: Fulfillment Milestones & Regional Warehouses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fulfillment Pipeline */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600" /> Customer Provisioning Milestones
            </h3>
            <span className="text-[10px] text-slate-400 font-bold uppercase">{contracts.length} Orders</span>
          </div>

          <div className="space-y-3">
            {contracts.length === 0 ? (
              <EmptyState title="No orders to fulfill" description="Fulfillment tracks signed contracts." />
            ) : (
              contracts.map((c) => (
                <div key={c.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {c.contractNumber}
                      </span>
                      <h4 className="font-bold text-xs text-slate-900 mt-1">{c.title}</h4>
                      <p className="text-[11px] text-slate-500">Account: <strong>{c.account?.name}</strong></p>
                    </div>
                    <div className="text-right">
                      <strong className="text-xs font-mono font-bold text-slate-900 block">
                        ₹{c.value?.toLocaleString('en-IN')}
                      </strong>
                      <StatusBadge status={c.status} />
                    </div>
                  </div>

                  {/* Step Milestone Bar */}
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5 text-teal-700 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5" /> 1. Contract Executed
                    </div>
                    <ArrowRight className="w-3 h-3 text-slate-300" />
                    <div className="flex items-center gap-1.5 text-teal-700 font-bold">
                      <Boxes className="w-3.5 h-3.5" /> 2. Stock Allocated
                    </div>
                    <ArrowRight className="w-3 h-3 text-slate-300" />
                    <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                      <Truck className="w-3.5 h-3.5" /> 3. Provisioning Active
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Regional Warehouses Stock Capacity */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Boxes className="w-4 h-4 text-indigo-600" /> Regional Stock Hubs
            </h3>
            <span className="text-[10px] text-slate-400 font-bold uppercase">{warehouses.length} Active</span>
          </div>

          <div className="space-y-3">
            {warehouses.map((wh) => (
              <div key={wh.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-900">{wh.name}</h4>
                  <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {wh.code}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">{wh.location || 'Central Regional Facility'}</p>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px]">
                  <span className="text-slate-600">Inventory Items: <strong>{wh.stockItems?.length || 0}</strong></span>
                  <span className="text-emerald-700 font-bold">● Active Route</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Fulfillment;
