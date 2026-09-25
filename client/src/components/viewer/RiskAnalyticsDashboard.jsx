import React from 'react';
import { RiskBadge } from '../common/RiskBadge';
import { 
  Scale, ShieldAlert, CheckCircle2, AlertTriangle, XCircle, 
  TrendingUp, TrendingDown, Layers, BarChart3, PieChart, Sparkles, 
  ShieldCheck, HelpCircle, ArrowRight 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const RiskAnalyticsDashboard = ({ analysis, document, clauses = [], onSelectClause }) => {
  if (!analysis) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs">
        Generating AI Risk analytics & decision matrix...
      </div>
    );
  }

  const score = document.overallScore || 50;
  const riskLevel = document.overallRisk || 'MEDIUM';

  // Compute category counts and highest risk in each
  const categoryStats = {};
  clauses.forEach(c => {
    if (!categoryStats[c.category]) {
      categoryStats[c.category] = { count: 0, maxScore: 0, hasCritical: false, hasHigh: false };
    }
    categoryStats[c.category].count += 1;
    if (c.riskScore > categoryStats[c.category].maxScore) {
      categoryStats[c.category].maxScore = c.riskScore;
    }
    if (c.riskLevel === 'CRITICAL') categoryStats[c.category].hasCritical = true;
    if (c.riskLevel === 'HIGH') categoryStats[c.category].hasHigh = true;
  });

  const categoryEntries = Object.entries(categoryStats).sort((a, b) => b[1].maxScore - a[1].maxScore);

  // Compute Utility Index
  const criticalCount = clauses.filter(c => c.riskLevel === 'CRITICAL').length;
  const highCount = clauses.filter(c => c.riskLevel === 'HIGH').length;
  const utilityIndex = Math.max(15, Math.round(100 - (criticalCount * 22 + highCount * 12)));

  // AI Recommendation Logic
  let verdictTitle = '';
  let verdictDesc = '';
  let verdictStyle = '';
  let verdictIcon = null;

  if (score >= 70 || criticalCount >= 2) {
    verdictTitle = 'REVISE / DO NOT SIGN WITHOUT AMENDMENTS';
    verdictDesc = 'This agreement contains heavily one-sided terms, including unilateral termination powers, mandatory class action waivers, and expansive liability disclaimers. Use our AI Redline tool to request amendments.';
    verdictStyle = 'bg-rose-50 border-rose-300 text-rose-950';
    verdictIcon = <XCircle className="w-6 h-6 text-rose-600 shrink-0" />;
  } else if (score >= 45 || highCount >= 2) {
    verdictTitle = 'CONDITIONAL / SIGN WITH CAUTION';
    verdictDesc = 'Standard operational terms with moderate vendor protections (e.g. automatic renewal notice windows and standard indemnities). Ensure cancellation deadlines and backup procedures are noted.';
    verdictStyle = 'bg-amber-50 border-amber-300 text-amber-950';
    verdictIcon = <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />;
  } else {
    verdictTitle = 'COMMERCIALLY FAIR / ACCEPTABLE FOR EXECUTION';
    verdictDesc = 'Terms are balanced, bilateral, and align with standard commercial best practices and international privacy regulations with low legal exposure.';
    verdictStyle = 'bg-emerald-50 border-emerald-300 text-emerald-950';
    verdictIcon = <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />;
  }

  // Circular gauge calculations
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* 1. AI Decision & Commercial Utility Verdict Box */}
      <div className={`p-6 rounded-2xl border ${verdictStyle} shadow-sm space-y-4`}>
        <div className="flex items-start gap-3.5">
          {verdictIcon}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-white/80 border border-current shadow-2xs">
                AI Legal Executive Verdict
              </span>
              <span className="text-xs font-mono font-bold opacity-80">Risk Score: {score}/100</span>
            </div>
            <h3 className="text-base font-extrabold tracking-tight">{verdictTitle}</h3>
            <p className="text-xs mt-1 leading-relaxed opacity-90">{verdictDesc}</p>
          </div>
        </div>

        {/* Pros & Cons / Decision Factors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-current/20">
          <div className="p-3 rounded-xl bg-white/70 border border-current/20 space-y-1.5">
            <span className="text-[11px] font-bold text-emerald-800 uppercase flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Beneficial / Standard Aspects
            </span>
            <ul className="text-xs text-slate-700 space-y-1">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Defined scope of services and eligibility</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Standard copyright and trademark reservations</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Clear governing law venue designated</span>
              </li>
            </ul>
          </div>

          <div className="p-3 rounded-xl bg-white/70 border border-current/20 space-y-1.5">
            <span className="text-[11px] font-bold text-rose-800 uppercase flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              High-Risk / Harmful Caveats
            </span>
            <ul className="text-xs text-slate-700 space-y-1">
              {criticalCount > 0 && (
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  <span>{criticalCount} Critical clauses surrender judicial rights or data</span>
                </li>
              )}
              {highCount > 0 && (
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  <span>{highCount} High-risk provisions on billing/indemnity</span>
                </li>
              )}
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                <span>Unilateral terms modification without notice</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 2. Visual Risk Score Gauges & Utility Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Risk Score Circular Gauge */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-5">
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="text-slate-100"
                strokeWidth="10"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                className={`transition-all duration-1000 ease-out ${
                  score >= 70 ? 'text-red-500' : score >= 40 ? 'text-amber-500' : 'text-emerald-500'
                }`}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="font-mono text-xl font-black text-slate-900">{score}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase">/ 100</span>
            </div>
          </div>

          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overall Risk Rating</span>
            <div className="mt-1">
              <RiskBadge level={riskLevel} score={score} size="md" />
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Weighted calculation based on 14 legal risk categories.
            </p>
          </div>
        </div>

        {/* Business Utility Index */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-brand-600" />
              Business Utility Score
            </span>
            <span className="text-xs font-mono font-bold text-brand-600 px-2 py-0.5 rounded bg-brand-50 border border-brand-200">
              {utilityIndex} / 100
            </span>
          </div>

          <div className="my-3">
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  utilityIndex >= 70 ? 'bg-emerald-500' : utilityIndex >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${utilityIndex}%` }}
              ></div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            Measures the operational value of services vs the legal liability incurred.
          </p>
        </div>
      </div>

      {/* 3. Category Risk Distribution Horizontal Bar Chart */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-brand-600" />
            Category Risk Heatmap Breakdown
          </h4>
          <span className="text-[11px] text-slate-400 font-mono">{categoryEntries.length} Identified Categories</span>
        </div>

        <div className="space-y-3">
          {categoryEntries.slice(0, 7).map(([category, stats]) => {
            const barWidth = Math.min(100, Math.max(10, stats.maxScore));
            const barColor = stats.maxScore >= 70
              ? 'bg-gradient-to-r from-red-500 to-rose-600'
              : stats.maxScore >= 45
              ? 'bg-gradient-to-r from-amber-400 to-orange-500'
              : 'bg-gradient-to-r from-emerald-400 to-teal-500';

            return (
              <div key={category} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-800 truncate max-w-[220px]">{category}</span>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-slate-400">{stats.count} clause{stats.count > 1 ? 's' : ''}</span>
                    <span className={`font-bold ${stats.maxScore >= 70 ? 'text-red-700' : stats.maxScore >= 45 ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {stats.maxScore} pts
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                    style={{ width: `${barWidth}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Strategic Checklist & Key Findings */}
      {analysis.keyFindings && analysis.keyFindings.length > 0 && (
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-orange-600" />
            Key Findings & Critical Highlights
          </h4>
          <div className="space-y-2">
            {analysis.keyFindings.map((finding, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-orange-50/50 border border-orange-200/80 text-xs text-orange-950 flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-orange-500 mt-1 shrink-0"></span>
                <span className="leading-relaxed">{finding}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
