import React from 'react';
import { RiskBadge } from '../common/RiskBadge';
import { ChevronRight, AlertTriangle, Sparkles, ShieldCheck } from 'lucide-react';

export const ClauseCard = ({ clause, isSelected, onClick, onExplainClick, onRedraftClick }) => {
  const isHighRisk = clause.riskLevel === 'CRITICAL' || clause.riskLevel === 'HIGH';

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl border transition-all cursor-pointer select-none relative ${
        isSelected
          ? 'bg-brand-50/50 border-brand-500 shadow-sm ring-1 ring-brand-500'
          : isHighRisk
          ? 'bg-white border-slate-200 hover:border-orange-300 hover:shadow-sm'
          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-mono font-bold text-slate-500 px-1.5 py-0.5 rounded bg-slate-100">
            P.{clause.pageNumber}
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {clause.category}
          </span>
          {clause.complianceTags && clause.complianceTags.length > 0 && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60 flex items-center gap-1">
              <ShieldCheck className="w-2.5 h-2.5" />
              {clause.complianceTags[0]}
            </span>
          )}
        </div>

        <RiskBadge level={clause.riskLevel} score={clause.riskScore} size="sm" />
      </div>

      <h4 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-1 mb-1.5">
        {clause.heading || `Clause ${clause.clauseNumber}`}
      </h4>

      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
        {clause.text}
      </p>

      {clause.riskFactors && clause.riskFactors.length > 0 && isHighRisk && (
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-orange-700 font-medium">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{clause.riskFactors[0]}</span>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-xs font-medium pt-1">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onExplainClick) onExplainClick(clause);
            }}
            className="hover:underline text-[11px] text-slate-500 hover:text-slate-800"
          >
            Why this matters
          </button>

          {isHighRisk && onRedraftClick && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRedraftClick(clause);
              }}
              className="text-[11px] text-brand-700 hover:text-brand-900 font-semibold flex items-center gap-1 px-2 py-0.5 rounded bg-brand-50 hover:bg-brand-100 border border-brand-200 transition-colors"
            >
              <Sparkles className="w-3 h-3 text-brand-600" />
              <span>Counter-Proposal</span>
            </button>
          )}
        </div>

        <span className="flex items-center text-[11px] text-brand-600 font-semibold">
          Inspect <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};
