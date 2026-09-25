import React from 'react';
import { RiskBadge } from '../common/RiskBadge';
import { FileText, CheckCircle2, AlertTriangle, ArrowRight, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DocumentSummaryTab = ({ analysis, document, onSelectClause }) => {
  if (!analysis) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>Summary is being processed...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-2xl border border-slate-200 space-y-6 overflow-y-auto">
      {/* Executive Overview Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-navy-900 text-white shadow-md">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Executive AI Summary
            </span>
          </div>
          <RiskBadge level={document.overallRisk} score={document.overallScore} size="md" />
        </div>

        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
          {analysis.summary}
        </p>
      </div>

      {/* Critical Findings */}
      {analysis.keyFindings && analysis.keyFindings.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
            <ShieldAlert className="w-4 h-4 text-orange-600" />
            Key Findings & Risk Highlights
          </h3>
          <div className="space-y-2">
            {analysis.keyFindings.map((finding, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-orange-50/50 border border-orange-200/80 text-xs text-orange-950 flex items-start gap-2.5"
              >
                <span className="w-2 h-2 rounded-full bg-orange-500 mt-1 shrink-0"></span>
                <span className="leading-relaxed">{finding}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Checklist */}
      {analysis.actionChecklist && analysis.actionChecklist.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            User Action Checklist Before Agreeing
          </h3>
          <div className="space-y-2">
            {analysis.actionChecklist.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-emerald-50/40 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2.5"
              >
                <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold mt-0.5 shrink-0">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Audit Report Link */}
      <div className="pt-2">
        <Link
          to={`/report/${document._id}`}
          className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors flex items-center justify-center gap-2 border border-slate-300"
        >
          <span>Open Printable Audit Report</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
