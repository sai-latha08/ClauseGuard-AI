import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  AlertTriangle,
  CalendarPlus,
  Volume2,
  ArrowRight,
  ShieldAlert,
  Download,
  CheckCircle2
} from 'lucide-react';

export const UpcomingRenewalsWidget = ({ documents = [] }) => {
  // Find documents that have potential auto-renewal or high risk
  const completedDocs = documents.filter(d => d.status === 'COMPLETED');
  
  if (completedDocs.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-cream-100 via-white to-cream-50 rounded-2xl border border-cream-300 p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                Auto-Renewal Sentinel
              </span>
              <span className="text-xs font-semibold text-slate-500">Milestone Calendar Tracking</span>
            </div>
            <h3 className="text-base font-extrabold text-burgundy-950 mt-0.5">
              Active Contracts & Cancellation Notice Windows
            </h3>
          </div>
        </div>

        <Link
          to={`/analysis/${completedDocs[0]._id}`}
          className="text-xs font-bold text-burgundy-800 hover:text-burgundy-950 flex items-center gap-1 shrink-0"
        >
          <span>Open Full Timeline</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
        {completedDocs.slice(0, 3).map((doc, idx) => {
          const isHighRisk = doc.overallRisk === 'CRITICAL' || doc.overallRisk === 'HIGH';
          
          return (
            <div
              key={doc._id || idx}
              className="p-4 rounded-xl bg-white border border-cream-300 hover:border-burgundy-400 hover:shadow-sm transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${
                    isHighRisk 
                      ? 'bg-rose-50 text-rose-800 border-rose-200' 
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                    {doc.overallRisk || 'MEDIUM'} RISK ({doc.overallScore || 50}/100)
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {doc.totalClauses || 10} Clauses
                  </span>
                </div>
                <h4 className="text-xs font-bold text-burgundy-950 truncate" title={doc.originalName}>
                  {doc.originalName}
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-amber-600" />
                  <span>Notice Window: 60 Days Prior to Expiry</span>
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <Link
                  to={`/analysis/${doc._id}`}
                  className="text-[11px] font-bold text-burgundy-800 hover:text-burgundy-950 flex items-center gap-1"
                >
                  <Volume2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>60s Audio Brief</span>
                </Link>

                <Link
                  to={`/analysis/${doc._id}`}
                  className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                >
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>Sync Alerts</span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
