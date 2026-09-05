import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Kanban as KanbanIcon,
  Plus,
  Building2,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import api from '../api/client';
import { StageBadge, TierBadge, RiskBadge } from '../components/common/Badge';
import { LoadingSpinner, ErrorAlert } from '../components/common/LoadingAndEmpty';

const STAGE_ORDER = [
  'LEAD',
  'QUALIFIED',
  'OPPORTUNITY',
  'QUOTE_DRAFT',
  'APPROVAL_REQUIRED',
  'APPROVED',
  'CONTRACT_REVIEW',
  'CLOSED_WON',
  'CLOSED_LOST',
];

export const Pipeline = () => {
  const navigate = useNavigate();
  const [boardData, setBoardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPipeline = async () => {
    setLoading(true);
    try {
      const res = await api.get('/pipeline');
      setBoardData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load pipeline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipeline();
  }, []);

  const handleStageChange = async (dealId, targetStage) => {
    try {
      await api.post(`/deals/${dealId}/stage`, { targetStage });
      fetchPipeline();
    } catch (err) {
      alert('Stage Transition Rejected: ' + err.message);
    }
  };

  if (loading) return <LoadingSpinner message="Loading Deal Pipeline from PostgreSQL..." />;
  if (error) return <ErrorAlert message={error} onRetry={fetchPipeline} />;

  const { columns, totalPipelineValue, weightedPipelineValue, totalDealsCount } = boardData || {};

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Telemetry */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <KanbanIcon className="w-6 h-6 text-teal-600" /> Deal Flow Pipeline
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Governed opportunity stages with real-time backend state machine transition enforcement.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="glass-panel px-4 py-2 rounded-2xl border border-slate-200 bg-white text-right shadow-xs">
            <span className="text-slate-400 text-[10px] block font-sans uppercase font-bold">Total Pipeline</span>
            <strong className="text-slate-900 text-sm font-black">₹{((totalPipelineValue || 0) / 100000).toFixed(2)} Lakhs</strong>
          </div>
          <div className="glass-panel px-4 py-2 rounded-2xl border border-slate-200 bg-white text-right shadow-xs">
            <span className="text-slate-400 text-[10px] block font-sans uppercase font-bold">Weighted</span>
            <strong className="text-teal-700 text-sm font-black">₹{((weightedPipelineValue || 0) / 100000).toFixed(2)} Lakhs</strong>
          </div>
          <button
            onClick={() => navigate('/deals')}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-sm text-xs flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" /> New Deal
          </button>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="flex gap-4 overflow-x-auto pb-6 pt-2">
        {STAGE_ORDER.map((stageKey) => {
          const dealsInColumn = columns?.[stageKey] || [];
          const columnTotal = dealsInColumn.reduce((s, d) => s + (d.value || 0), 0);

          return (
            <div
              key={stageKey}
              className="w-72 flex-shrink-0 bg-slate-100 border border-slate-200 rounded-2xl p-3 flex flex-col max-h-[75vh] shadow-xs"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 px-1">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 tracking-wide">
                    {stageKey.replace(/_/g, ' ')}
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono font-bold">
                    ₹{(columnTotal / 100000).toFixed(1)} L
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200 text-[11px] font-bold">
                  {dealsInColumn.length}
                </span>
              </div>

              {/* Deals List */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {dealsInColumn.length === 0 ? (
                  <p className="text-[11px] text-slate-400 text-center py-6">No deals</p>
                ) : (
                  dealsInColumn.map((deal) => {
                    const latestQuote = deal.quotes?.[0];
                    return (
                      <div
                        key={deal.id}
                        onClick={() => navigate(`/deals/${deal.id}`)}
                        className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-teal-500 hover:shadow-md cursor-pointer transition-all space-y-2.5 shadow-xs group"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-1">
                            {deal.title}
                          </h4>
                          {deal.account?.tier && <TierBadge tier={deal.account.tier} />}
                        </div>

                        <p className="text-[11px] text-slate-600 flex items-center gap-1 font-medium">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" /> {deal.account?.name}
                        </p>

                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                          <span className="font-mono font-bold text-teal-700">
                            ₹{(deal.value / 100000).toFixed(2)} L
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold">
                            {deal.probability}% Prob.
                          </span>
                        </div>

                        {latestQuote?.blendedRiskScore > 0 && (
                          <div className="pt-1">
                            <RiskBadge riskScore={latestQuote.blendedRiskScore} />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
