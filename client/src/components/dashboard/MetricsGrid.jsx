import React from 'react';
import { FileText, ShieldAlert, Activity, CheckCircle2 } from 'lucide-react';

export const MetricsGrid = ({ metrics = {} }) => {
  const cards = [
    {
      title: 'Total Audits',
      value: metrics.totalDocuments || 0,
      sub: 'Uploaded agreements',
      icon: FileText,
      color: 'bg-brand-50 text-brand-700 border-brand-200',
    },
    {
      title: 'High / Critical Risk Flags',
      value: metrics.highRiskDocuments || 0,
      sub: 'Requiring attention',
      icon: ShieldAlert,
      color: 'bg-red-50 text-red-700 border-red-200',
    },
    {
      title: 'Average Risk Score',
      value: `${metrics.averageRiskScore || 0}/100`,
      sub: 'Cross-document aggregate',
      icon: Activity,
      color: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    {
      title: 'NLP Service Status',
      value: 'Online',
      sub: 'LegalBERT & ChromaDB',
      icon: CheckCircle2,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.title}</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">{card.value}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">{card.sub}</p>
            </div>
            <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${card.color}`}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
