import React from 'react';
import { RiskBadge } from '../common/RiskBadge';
import { X, ShieldAlert, AlertCircle, CheckCircle2, HelpCircle, FileText, ArrowRight } from 'lucide-react';

export const RiskExplainerModal = ({ clause, isOpen, onClose }) => {
  if (!isOpen || !clause) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {clause.category}
                </span>
                <span className="text-xs text-slate-400">• Page {clause.pageNumber}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 leading-snug">
                {clause.heading || `Clause ${clause.clauseNumber}`}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Risk Level & Score */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div>
              <span className="text-xs text-slate-500 font-medium">Assessed Risk Severity</span>
              <div className="mt-1">
                <RiskBadge level={clause.riskLevel} score={clause.riskScore} size="lg" />
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 font-medium">Model Confidence</span>
              <p className="font-mono text-sm font-bold text-slate-800 mt-1">
                {Math.round((clause.confidence || 0.85) * 100)}%
              </p>
            </div>
          </div>

          {/* Trigger Language / Detected Snippet */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-2">
              <FileText className="w-3.5 h-3.5 text-brand-600" />
              Trigger Language in Agreement
            </h4>
            <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-950 font-legal leading-relaxed">
              "{clause.detectedSnippet || clause.text}"
            </div>
          </div>

          {/* Why This Matters */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-2">
              <HelpCircle className="w-3.5 h-3.5 text-brand-600" />
              Why This Matters
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              {clause.whyItMatters || 'This clause defines standard operational guidelines between the user and service provider.'}
            </p>
          </div>

          {/* Actionable Recommendations */}
          {clause.recommendation && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Consider Checking
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200">
                {clause.recommendation}
              </p>
            </div>
          )}

          {/* Risk Factors List */}
          {clause.riskFactors && clause.riskFactors.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Identified Risk Factors
              </h4>
              <ul className="space-y-1.5">
                {clause.riskFactors.map((factor, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0"></span>
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Mandatory Legal Disclaimer */}
          <div className="p-3 rounded-lg bg-slate-100 text-[11px] text-slate-500 leading-relaxed border border-slate-200">
            <strong>Disclaimer:</strong> ClauseGuard AI provides automated informational analysis and is not a substitute for professional legal advice.
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold rounded-xl bg-slate-800 text-white hover:bg-slate-900 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
