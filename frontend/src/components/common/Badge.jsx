import React from 'react';

export const StageBadge = ({ stage }) => {
  const stageConfig = {
    LEAD: { label: 'Lead', bg: 'bg-slate-800 text-slate-300 border-slate-700' },
    QUALIFIED: { label: 'Qualified', bg: 'bg-blue-950 text-blue-300 border-blue-800' },
    OPPORTUNITY: { label: 'Opportunity', bg: 'bg-cyan-950 text-cyan-300 border-cyan-800' },
    QUOTE_DRAFT: { label: 'Quote Draft', bg: 'bg-amber-950 text-amber-300 border-amber-800' },
    QUOTE_SENT: { label: 'Quote Sent', bg: 'bg-indigo-950 text-indigo-300 border-indigo-800' },
    NEGOTIATION: { label: 'Negotiation', bg: 'bg-purple-950 text-purple-300 border-purple-800' },
    APPROVAL_REQUIRED: { label: 'Approval Required', bg: 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse' },
    APPROVED: { label: 'Approved', bg: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
    CONTRACT_REVIEW: { label: 'Legal Review', bg: 'bg-yellow-950 text-yellow-300 border-yellow-800' },
    CONTRACT_APPROVED: { label: 'Contract Approved', bg: 'bg-teal-950 text-teal-300 border-teal-800' },
    CLOSED_WON: { label: 'Closed Won', bg: 'bg-emerald-900 text-emerald-200 border-emerald-600' },
    CLOSED_LOST: { label: 'Closed Lost', bg: 'bg-red-950 text-red-400 border-red-800' },
  };

  const config = stageConfig[stage] || { label: stage, bg: 'bg-slate-800 text-slate-400 border-slate-700' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg}`}>
      {config.label}
    </span>
  );
};

export const TierBadge = ({ tier }) => {
  const tierConfig = {
    GOLD: { label: 'Gold (15% Max)', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
    SILVER: { label: 'Silver (10% Max)', bg: 'bg-slate-300/20 text-slate-200 border-slate-300/40' },
    BRONZE: { label: 'Bronze (5% Max)', bg: 'bg-orange-600/20 text-orange-300 border-orange-600/40' },
    PLATINUM: { label: 'Platinum (20% Max)', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
  };

  const config = tierConfig[tier] || { label: tier, bg: 'bg-slate-800 text-slate-400 border-slate-700' };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${config.bg}`}>
      {config.label}
    </span>
  );
};

export const RiskBadge = ({ riskScore }) => {
  const score = parseFloat(riskScore || 0);
  let color = 'bg-emerald-950 text-emerald-300 border-emerald-800';
  let label = `Low Risk (${score.toFixed(1)})`;

  if (score > 10.0) {
    color = 'bg-red-950 text-red-300 border-red-800';
    label = `Critical Risk (${score.toFixed(1)})`;
  } else if (score > 4.0) {
    color = 'bg-amber-950 text-amber-300 border-amber-800';
    label = `Moderate Risk (${score.toFixed(1)})`;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
};

export const StatusBadge = ({ status }) => {
  const map = {
    PENDING: { label: 'Pending', bg: 'bg-amber-950 text-amber-300 border-amber-800' },
    APPROVED: { label: 'Approved', bg: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
    REJECTED: { label: 'Rejected', bg: 'bg-rose-950 text-rose-300 border-rose-800' },
    DRAFT: { label: 'Draft', bg: 'bg-slate-800 text-slate-300 border-slate-700' },
    SENT: { label: 'Sent', bg: 'bg-blue-950 text-blue-300 border-blue-800' },
    ACCEPTED: { label: 'Accepted', bg: 'bg-teal-950 text-teal-300 border-teal-800' },
    SIGNED: { label: 'Signed', bg: 'bg-emerald-900 text-emerald-200 border-emerald-600' },
    ISSUED: { label: 'Issued', bg: 'bg-indigo-950 text-indigo-300 border-indigo-800' },
    PARTIALLY_PAID: { label: 'Partially Paid', bg: 'bg-cyan-950 text-cyan-300 border-cyan-800' },
    PAID: { label: 'Paid in Full', bg: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
    ACTIVE: { label: 'Active', bg: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
  };

  const config = map[status] || { label: status, bg: 'bg-slate-800 text-slate-400 border-slate-700' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg}`}>
      {config.label}
    </span>
  );
};
