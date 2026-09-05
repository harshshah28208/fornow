import React, { useState, useEffect } from 'react';
import { Contact as ContactIcon, Plus, Mail, Phone, Building2, CheckCircle2 } from 'lucide-react';
import api from '../api/client';
import { LoadingSpinner, EmptyState, ErrorAlert } from '../components/common/LoadingAndEmpty';
import { Modal } from '../components/common/Modal';

export const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    accountId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    isDecisionMaker: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const [contRes, accRes] = await Promise.all([
        api.get('/contacts'),
        api.get('/accounts'),
      ]);
      setContacts(contRes.data || []);
      setAccounts(accRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch contacts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/contacts', formData);
      setIsModalOpen(false);
      setFormData({ accountId: '', firstName: '', lastName: '', email: '', phone: '', jobTitle: '', isDecisionMaker: true });
      fetchContacts();
    } catch (err) {
      alert('Failed to add contact: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <ContactIcon className="w-6 h-6 text-brand-400" /> Contacts & Decision Makers
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Maintain account key stakeholders, procurement decision makers, and signers.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs rounded-xl shadow-glow flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Contact
        </button>
      </div>

      {loading ? (
        <LoadingSpinner message="Fetching contacts directory..." />
      ) : error ? (
        <ErrorAlert message={error} onRetry={fetchContacts} />
      ) : contacts.length === 0 ? (
        <EmptyState title="No contacts found" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((c) => (
            <div
              key={c.id}
              className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-brand-500/40 transition-all space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">{c.firstName} {c.lastName}</h3>
                  <p className="text-xs text-brand-300 font-semibold">{c.jobTitle || 'Key Stakeholder'}</p>
                </div>
                {c.isDecisionMaker && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                    Decision Maker
                  </span>
                )}
              </div>

              <div className="space-y-1 text-xs text-slate-400 pt-1">
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-200">{c.account?.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{c.email}</span>
                </div>
                {c.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{c.phone}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Contact">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Associated Account *</label>
            <select
              required
              value={formData.accountId}
              onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value="">Select Account</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

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
              <label className="block text-slate-400 font-semibold mb-1">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-brand-500 text-slate-950 font-bold rounded-lg shadow-glow">
              {submitting ? 'Saving...' : 'Save Contact'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
