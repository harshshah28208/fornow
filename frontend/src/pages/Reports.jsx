import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  FileSpreadsheet,
  Award,
  DollarSign,
  Package,
  Users,
  RefreshCw,
  PieChart,
  BarChart3,
  Calendar,
} from 'lucide-react';
import api from '../api/client';
import { StatCard } from '../components/common/StatCard';
import { LoadingSpinner } from '../components/common/LoadingAndEmpty';

export const Reports = () => {
  const [reportsData, setReportsData] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [repRes, revRes] = await Promise.all([
        api.get('/reports'),
        api.get('/revenue/analytics'),
      ]);
      setReportsData(repRes.data || {});
      setRevenueData(revRes.data || {});
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) return <LoadingSpinner message="Synthesizing revenue forecast & commission analytics..." />;

  const weightedPipeline = reportsData?.weightedPipeline || 0;
  const totalPipeline = reportsData?.totalPipelineValue || 0;
  const productPerformance = reportsData?.productPerformance || [];
  const repCommissions = reportsData?.repCommissions || [];
  const stageBreakdown = reportsData?.dealStageBreakdown || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-600" /> Revenue Forecasting & Executive Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Probability-weighted pipeline models, product revenue contributions, and sales rep commission reconciliations.
          </p>
        </div>

        <button
          onClick={fetchReports}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Analytics
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Weighted Pipeline Forecast"
          value={`₹${weightedPipeline.toLocaleString('en-IN')}`}
          subtitle="Probability-adjusted revenue"
          color="teal"
          icon={TrendingUp}
        />
        <StatCard
          title="Gross Pipeline Value"
          value={`₹${totalPipeline.toLocaleString('en-IN')}`}
          subtitle="Total open deal volume"
          color="indigo"
          icon={DollarSign}
        />
        <StatCard
          title="Total Recognized Revenue"
          value={`₹${(revenueData?.totalRecognizedRevenue || 0).toLocaleString('en-IN')}`}
          subtitle="Settled ledger entries"
          color="emerald"
          icon={Award}
        />
        <StatCard
          title="MRR Run Rate"
          value={`₹${(revenueData?.mrr || 0).toLocaleString('en-IN')}`}
          subtitle="Annualized: ₹{(revenueData?.arr || 0).toLocaleString('en-IN')}"
          color="amber"
          icon={Calendar}
        />
      </div>

      {/* Two Column Grid: Rep Commissions & Stage Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rep Commissions Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-600" /> Rep Performance & Accrued Commission
            </h3>
            <span className="text-[10px] text-slate-400 font-bold uppercase">5% Won Commission</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-100 text-[10px] uppercase font-bold">
                <tr>
                  <th className="pb-2">Sales Rep</th>
                  <th className="pb-2">Deals</th>
                  <th className="pb-2">Won Volume</th>
                  <th className="pb-2 text-right">Accrued Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {repCommissions.map((rep) => (
                  <tr key={rep.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 font-bold text-slate-900">{rep.name}</td>
                    <td className="py-2.5 text-slate-600 font-mono">{rep.dealsCount}</td>
                    <td className="py-2.5 text-slate-800 font-mono">₹{rep.wonAmount?.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 text-right font-mono font-extrabold text-teal-700">
                      ₹{rep.estimatedCommission?.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Product Performance Table */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-600" /> Top Revenue Contributing SKUs
            </h3>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Gross Bookings</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-100 text-[10px] uppercase font-bold">
                <tr>
                  <th className="pb-2">Product Name</th>
                  <th className="pb-2">Category</th>
                  <th className="pb-2">Units Sold</th>
                  <th className="pb-2 text-right">Gross Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productPerformance.slice(0, 6).map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 font-bold text-slate-900">{prod.name}</td>
                    <td className="py-2.5 text-[11px] text-slate-500 font-semibold">{prod.category}</td>
                    <td className="py-2.5 text-slate-700 font-mono">{prod.unitsSold}</td>
                    <td className="py-2.5 text-right font-mono font-extrabold text-indigo-700">
                      ₹{prod.grossRevenue?.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
