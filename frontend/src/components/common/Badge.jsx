import React from 'react';

export const StageBadge = ({ stage }) => {
  const stageConfig = {
    LEAD: { label: 'Lead', bg: 'bg-slate-100 text-slate-800 border-slate-300' },
    QUALIFIED: { label: 'Qualified', bg: 'bg-blue-50 text-blue-800 border-blue-200' },
    OPPORTUNITY: { label: 'Opportunity', bg: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
    QUOTE_DRAFT: { label: 'Quote Draft', bg: 'bg-amber-50 text-amber-900 border-amber-300' },
    QUOTE_SENT: { label: 'Quote Sent', bg: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
    NEGOTIATION: { label: 'Negotiation', bg: 'bg-purple-50 text-purple-800 border-purple-200' },
    APPROVAL_REQUIRED: { label: 'Approval Required', bg: 'bg-rose-100 text-rose-800 border-rose-300 font-bold animate-pulse' },
    APPROVED: { label: 'Approved', bg: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
    CONTRACT_REVIEW: { label: 'Legal Review', bg: 'bg-yellow-50 text-yellow-900 border-yellow-300' },
    CONTRACT_APPROVED: { label: 'Contract Approved', bg: 'bg-teal-50 text-teal-800 border-teal-300' },
    CLOSED_WON: { label: 'Closed Won', bg: 'bg-emerald-100 text-emerald-900 border-emerald-400 font-bold' },
    CLOSED_LOST: { label: 'Closed Lost', bg: 'bg-red-100 text-red-900 border-red-300' },
  };

  const config = stageConfig[stage] || { label: stage, bg: 'bg-slate-100 text-slate-700 border-slate-300' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg}`}>
      {config.label}
    </span>
  );
};

export const TierBadge = ({ tier }) => {
  const tierConfig = {
    GOLD: { label: 'Gold (15% Max)', bg: 'bg-amber-100 text-amber-900 border-amber-300' },
    SILVER: { label: 'Silver (10% Max)', bg: 'bg-slate-200 text-slate-800 border-slate-300' },
    BRONZE: { label: 'Bronze (5% Max)', bg: 'bg-orange-100 text-orange-900 border-orange-300' },
    PLATINUM: { label: 'Platinum (20% Max)', bg: 'bg-purple-100 text-purple-900 border-purple-300' },
  };

  const config = tierConfig[tier] || { label: tier, bg: 'bg-slate-100 text-slate-700 border-slate-300' };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${config.bg}`}>
      {config.label}
    </span>
  );
};

export const RiskBadge = ({ riskScore }) => {
  const score = parseFloat(riskScore || 0);
  let color = 'bg-emerald-50 text-emerald-800 border-emerald-300';
  let label = `Low Risk (${score.toFixed(1)})`;

  if (score > 10.0) {
    color = 'bg-red-100 text-red-900 border-red-400 font-bold';
    label = `Critical Risk (${score.toFixed(1)})`;
  } else if (score > 4.0) {
    color = 'bg-amber-100 text-amber-900 border-amber-300 font-semibold';
    label = `Moderate Risk (${score.toFixed(1)})`;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${color}`}>
      <span className="w-2 h-2 rounded-full bg-current" />
      {label}
    </span>
  );
};

export const StatusBadge = ({ status }) => {
  const map = {
    PENDING: { label: 'Pending', bg: 'bg-amber-100 text-amber-900 border-amber-300' },
    APPROVED: { label: 'Approved', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
    REJECTED: { label: 'Rejected', bg: 'bg-rose-100 text-rose-900 border-rose-300' },
    DRAFT: { label: 'Draft', bg: 'bg-slate-100 text-slate-800 border-slate-300' },
    SENT: { label: 'Sent', bg: 'bg-blue-100 text-blue-900 border-blue-300' },
    ACCEPTED: { label: 'Accepted', bg: 'bg-teal-100 text-teal-900 border-teal-300' },
    SIGNED: { label: 'Signed', bg: 'bg-emerald-100 text-emerald-950 border-emerald-400 font-bold' },
    ISSUED: { label: 'Issued', bg: 'bg-indigo-100 text-indigo-900 border-indigo-300' },
    PARTIALLY_PAID: { label: 'Partially Paid', bg: 'bg-cyan-100 text-cyan-900 border-cyan-300' },
    PAID: { label: 'Paid in Full', bg: 'bg-emerald-100 text-emerald-950 border-emerald-400 font-bold' },
    ACTIVE: { label: 'Active', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  };

  const config = map[status] || { label: status, bg: 'bg-slate-100 text-slate-700 border-slate-300' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg}`}>
      {config.label}
    </span>
  );
};
