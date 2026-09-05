import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, ArrowRight, Building2, Phone, Mail, CheckCircle2, Filter, Search } from 'lucide-react';
import api from '../api/client';
import { LoadingSpinner, EmptyState, ErrorAlert } from '../components/common/LoadingAndEmpty';
import { Modal } from '../components/common/Modal';

export const Leads = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    company: '',
    email: '',
    phone: '',
    source: 'WEBSITE',
    estimatedValue: '',
    notes: '',
  });
  const [submittingCreate, setSubmittingCreate] = useState(false);

  // Conversion Modal
  const [convertTargetLead, setConvertTargetLead] = useState(null);
  const [convertData, setConvertData] = useState({
    dealTitle: '',
    customerTier: 'GOLD',
    industry: 'Financial Technology',
  });
  const [submittingConvert, setSubmittingConvert] = useState(false);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/leads?status=${statusFilter}&search=${search}`);
      setLeads(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [statusFilter]);

  const handleCreateLead = async (e) => {
    e.preventDefault();
    setSubmittingCreate(true);
    try {
      await api.post('/leads', formData);
      setIsCreateModalOpen(false);
      setFormData({ firstName: '', lastName: '', company: '', email: '', phone: '', source: 'WEBSITE', estimatedValue: '', notes: '' });
      fetchLeads();
    } catch (err) {
      alert('Lead creation failed: ' + err.message);
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleConvertLead = async (e) => {
    e.preventDefault();
    if (!convertTargetLead) return;
    setSubmittingConvert(true);
    try {
      const res = await api.post(`/leads/${convertTargetLead.id}/convert`, convertData);
      setConvertTargetLead(null);
      alert('Lead successfully converted into Account, Contact & Deal!');
      navigate(`/deals/${res.data.deal.id}`);
    } catch (err) {
      alert('Lead conversion failed: ' + err.message);
    } finally {
      setSubmittingConvert(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-400" /> Inbound Leads & Prospecting
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Capture B2B leads and convert them with 1-click into unified Accounts, Contacts, and Governed Deals.
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs rounded-xl shadow-glow flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" /> Create Lead
        </button>
      </div>

      {/* Filters */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-[260px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search leads, companies, emails..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchLeads()}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="CONVERTED">Converted</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading inbound leads..." />
      ) : error ? (
        <ErrorAlert message={error} onRetry={fetchLeads} />
      ) : leads.length === 0 ? (
        <EmptyState
          title="No leads found"
          description="Capture new prospect contacts or import campaign lists."
          actionButton={
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-brand-500 text-slate-950 font-bold text-xs rounded-xl shadow-glow"
            >
              Add New Lead
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {leads.map((lead) => (
            <div
              key={lead.id}
              className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-brand-500/40 transition-all space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">{lead.firstName} {lead.lastName}</h3>
                    <p className="text-xs text-brand-300 font-semibold">{lead.company}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-300 border border-slate-700">
                    {lead.status}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{lead.email}</span>
                  </div>
                  {lead.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{lead.phone}</span>
                    </div>
                  )}
                </div>

                {lead.notes && (
                  <p className="text-[11px] text-slate-300 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 line-clamp-2">
                    {lead.notes}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="font-mono text-xs text-brand-400 font-bold">
                  Est: ₹{(lead.estimatedValue / 100000).toFixed(2)} L
                </span>

                {lead.status !== 'CONVERTED' ? (
                  <button
                    onClick={() => {
                      setConvertTargetLead(lead);
                      setConvertData({
                        dealTitle: `${lead.company} - Expansion Deal`,
                        customerTier: 'GOLD',
                        industry: 'Technology Services',
                      });
                    }}
                    className="px-3 py-1.5 bg-gradient-to-r from-brand-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-slate-950 font-extrabold text-[11px] rounded-lg shadow-glow flex items-center gap-1 transition-all"
                  >
                    1-Click Convert <ArrowRight className="w-3 h-3" />
                  </button>
                ) : (
                  <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Converted
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Lead Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Inbound Lead">
        <form onSubmit={handleCreateLead} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">First Name *</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Company / Organization *</label>
              <input
                type="text"
                required
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Estimated Value (₹)</label>
              <input
                type="number"
                value={formData.estimatedValue}
                onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Notes & Scope</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-brand-500 text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg">Cancel</button>
            <button type="submit" disabled={submittingCreate} className="px-4 py-2 bg-brand-500 text-slate-950 font-bold rounded-lg shadow-glow">
              {submittingCreate ? 'Saving...' : 'Save Lead'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Convert Lead Modal */}
      <Modal isOpen={!!convertTargetLead} onClose={() => setConvertTargetLead(null)} title="1-Click Lead Conversion">
        <form onSubmit={handleConvertLead} className="space-y-4 text-xs">
          <p className="text-slate-300">
            Converting lead <strong>{convertTargetLead?.firstName} {convertTargetLead?.lastName} ({convertTargetLead?.company})</strong> into an Account, Contact, and Governed Deal.
          </p>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Deal Title *</label>
            <input
              type="text"
              required
              value={convertData.dealTitle}
              onChange={(e) => setConvertData({ ...convertData, dealTitle: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Customer Tier</label>
              <select
                value={convertData.customerTier}
                onChange={(e) => setConvertData({ ...convertData, customerTier: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="GOLD">Gold Tier (Up to 15% discount)</option>
                <option value="SILVER">Silver Tier (Up to 10% discount)</option>
                <option value="BRONZE">Bronze Tier (Up to 5% discount)</option>
                <option value="PLATINUM">Platinum Tier (Up to 20% discount)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Industry</label>
              <input
                type="text"
                value={convertData.industry}
                onChange={(e) => setConvertData({ ...convertData, industry: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button type="button" onClick={() => setConvertTargetLead(null)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg">Cancel</button>
            <button type="submit" disabled={submittingConvert} className="px-5 py-2 bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold rounded-lg shadow-glow">
              {submittingConvert ? 'Converting...' : 'Execute Conversion'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
