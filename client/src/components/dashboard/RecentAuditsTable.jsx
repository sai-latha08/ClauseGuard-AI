import React from 'react';
import { Link } from 'react-router-dom';
import { RiskBadge } from '../common/RiskBadge';
import { FileText, ArrowRight, Trash2, ExternalLink, Clock } from 'lucide-react';

export const RecentAuditsTable = ({ documents = [], onDelete }) => {
  if (!documents || documents.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
          <FileText className="w-7 h-7" />
        </div>
        <h3 className="font-bold text-slate-800 text-base">No Documents Analyzed Yet</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
          Upload any Terms of Service or Privacy Policy document to begin your risk assessment.
        </p>
        <Link
          to="/upload"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white font-semibold text-xs hover:bg-brand-700 transition-colors shadow-sm"
        >
          <span>Analyze Your First Document</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Recent Contract Risk Audits</h3>
          <p className="text-xs text-slate-500 mt-0.5">Historical overview of evaluated documents</p>
        </div>
        <Link
          to="/upload"
          className="px-3.5 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold text-xs transition-colors"
        >
          + New Audit
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-5 py-3.5">Document Title</th>
              <th className="px-5 py-3.5">Risk Rating</th>
              <th className="px-5 py-3.5">Clauses / Pages</th>
              <th className="px-5 py-3.5">Audit Date</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {documents.map((doc) => (
              <tr key={doc._id} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-5 py-4 font-semibold text-slate-900">
                  <Link
                    to={`/analysis/${doc._id}`}
                    className="flex items-center gap-2.5 hover:text-brand-600 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-brand-600 shrink-0" />
                    <span className="truncate max-w-xs">{doc.originalName}</span>
                  </Link>
                </td>

                <td className="px-5 py-4">
                  <RiskBadge level={doc.overallRisk} score={doc.overallScore} size="sm" />
                </td>

                <td className="px-5 py-4 font-mono text-slate-600">
                  {doc.totalClauses || 0} clauses • {doc.pageCount || 1} p.
                </td>

                <td className="px-5 py-4 text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {new Date(doc.uploadedAt).toLocaleDateString()}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    doc.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                    doc.status === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-brand-100 text-brand-800 animate-pulse'
                  }`}>
                    {doc.status}
                  </span>
                </td>

                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      to={`/analysis/${doc._id}`}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 text-xs font-semibold transition-colors"
                    >
                      Inspect
                    </Link>
                    <button
                      onClick={() => onDelete && onDelete(doc._id)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
