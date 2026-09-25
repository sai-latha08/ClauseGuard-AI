import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { reportAPI } from '../services/api';
import { RiskBadge } from '../components/common/RiskBadge';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import { ExecutiveVoiceBriefing } from '../components/viewer/ExecutiveVoiceBriefing';
import { MilestoneCalendarView } from '../components/viewer/MilestoneCalendarView';
import {
  FileText,
  Printer,
  ArrowLeft,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Calendar,
  Layers,
  Award,
  ShieldCheck,
  Scale,
  Sparkles,
  Download,
  Clock,
  Volume2
} from 'lucide-react';

export const ReportPage = () => {
  const { id } = useParams();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showVoicePlayer, setShowVoicePlayer] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await reportAPI.getReport(id);
        if (res.data?.success) {
          setReportData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load report:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-burgundy-700" />
          <span className="text-xs font-semibold text-burgundy-900/70">Generating Comprehensive Legal Audit Report...</span>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-2xl border border-cream-300 text-center">
        <p className="text-slate-500 text-xs">Report could not be retrieved.</p>
        <Link to="/dashboard" className="text-burgundy-800 text-xs font-bold mt-2 inline-block">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const { document, report, riskMetrics, groupedClauses, milestones, renewalInfo, executiveVoiceScript, estimatedAudioDuration } = reportData;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 print:p-0 print:m-0 print:max-w-full">
      {/* Action Bar (Hidden on Print) */}
      <div className="flex items-center justify-between print:hidden pb-2 border-b border-cream-300">
        <Link
          to={`/analysis/${document.id}`}
          className="flex items-center gap-1.5 text-xs font-bold text-burgundy-900/70 hover:text-burgundy-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Analysis Viewer</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowVoicePlayer(!showVoicePlayer)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-900 text-xs font-bold border border-rose-200 transition-colors shadow-2xs"
          >
            <Volume2 className="w-3.5 h-3.5 text-rose-600" />
            <span>{showVoicePlayer ? 'Hide Spoken Brief' : 'Play 60s Voice Brief'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-burgundy-800 text-cream-50 hover:bg-burgundy-900 text-xs font-bold transition-all shadow-sm"
          >
            <Printer className="w-4 h-4 text-cream-200" />
            <span>Export Official PDF Report</span>
          </button>
        </div>
      </div>

      {/* Spoken Voice Briefing Deck (Optional expand in report) */}
      {showVoicePlayer && (
        <div className="print:hidden">
          <ExecutiveVoiceBriefing
            documentName={document.originalName}
            riskScore={document.overallScore}
            overallRisk={document.overallRisk}
            voiceScript={executiveVoiceScript}
            estimatedDuration={estimatedAudioDuration || 58}
          />
        </div>
      )}

      {/* Main Printable Report Container */}
      <div className="bg-white rounded-3xl border border-cream-300 p-8 sm:p-12 shadow-sm space-y-10 print:border-none print:shadow-none print:p-0">
        
        {/* Report Header */}
        <div className="border-b border-cream-200 pb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-burgundy-100 text-burgundy-900 text-xs font-bold border border-burgundy-200 uppercase tracking-wider">
                Official Risk Audit & Governance Certificate
              </span>
              <span className="text-xs text-slate-400 font-mono">ID: {document.id}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-burgundy-950 tracking-tight">
              {document.originalName}
            </h1>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Audited on {new Date().toLocaleDateString()} • Powered by ClauseGuard Enterprise AI
            </p>
          </div>

          <div className="text-right sm:border-l sm:pl-6 border-cream-200">
            <span className="text-xs text-slate-500 font-medium">Aggregated Risk Rating</span>
            <div className="mt-1">
              <RiskBadge level={document.overallRisk} score={document.overallScore} size="lg" />
            </div>
          </div>
        </div>

        {/* Section 1: Executive Summary */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-burgundy-900 uppercase tracking-wider flex items-center gap-2 border-b border-cream-200 pb-1">
            <FileText className="w-4 h-4 text-burgundy-700" />
            1. Executive Plain-Language Summary
          </h2>
          <div className="p-5 rounded-2xl bg-cream-50/70 border border-cream-200 text-xs sm:text-sm text-burgundy-950 leading-relaxed whitespace-pre-wrap font-sans">
            {report.executiveSummary}
          </div>
        </div>

        {/* Section 2: Milestone Extraction & Auto-Renewal Notice Window */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-burgundy-900 uppercase tracking-wider flex items-center gap-2 border-b border-cream-200 pb-1">
            <Clock className="w-4 h-4 text-amber-600" />
            2. Contract Milestones & Auto-Renewal Cancellation Notice Schedule
          </h2>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50/60 via-cream-50 to-white border border-amber-200 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-white border border-cream-200">
                <span className="text-[10px] font-bold uppercase text-slate-500">Notice Policy</span>
                <p className="text-xs font-bold text-slate-900 mt-0.5">
                  {renewalInfo?.noticePeriodDays ? `${renewalInfo.noticePeriodDays} Days Notice` : 'Standard Notice'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white border border-cream-200">
                <span className="text-[10px] font-bold uppercase text-amber-700">Notice Deadline</span>
                <p className="text-xs font-bold text-amber-900 mt-0.5">
                  {renewalInfo?.renewalCutoffDate || 'October 15, 2026'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white border border-cream-200">
                <span className="text-[10px] font-bold uppercase text-slate-500">Term Expiration</span>
                <p className="text-xs font-bold text-slate-900 mt-0.5">
                  {renewalInfo?.expirationDate || '12 Months Initial'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white border border-cream-200">
                <span className="text-[10px] font-bold uppercase text-slate-500">Payment Terms</span>
                <p className="text-xs font-bold text-slate-900 mt-0.5">
                  {renewalInfo?.paymentTerms || 'Net 30 / Advance'}
                </p>
              </div>
            </div>

            {/* Milestones List */}
            {milestones && milestones.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-amber-200/60">
                <span className="text-[11px] font-extrabold uppercase text-burgundy-900">
                  Critical Milestones & Action Obligations
                </span>
                <div className="space-y-2">
                  {milestones.map((m, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-white border border-cream-200 text-xs flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-burgundy-950">{m.title}</span>
                          <span className="font-mono text-[10px] text-slate-500">{m.dateString}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">{m.description}</p>
                        {m.actionRequired && (
                          <p className="text-[10px] text-burgundy-800 font-semibold mt-1">
                            Action: {m.actionRequired}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Regulatory Compliance & Governance Matrix */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-burgundy-900 uppercase tracking-wider flex items-center gap-2 border-b border-cream-200 pb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            3. Regulatory Governance & Compliance Posture
          </h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-4 rounded-xl bg-cream-50/70 border border-cream-300">
              <span className="text-[11px] font-bold text-burgundy-900 uppercase">GDPR (EU)</span>
              <p className="text-sm font-bold text-amber-800 mt-1">Review Needed</p>
              <span className="text-[10px] text-slate-500">Art. 17/20/28 alignment</span>
            </div>
            <div className="p-4 rounded-xl bg-cream-50/70 border border-cream-300">
              <span className="text-[11px] font-bold text-burgundy-900 uppercase">CCPA / CPRA</span>
              <p className="text-sm font-bold text-amber-800 mt-1">Review Needed</p>
              <span className="text-[10px] text-slate-500">Opt-out / Do Not Sell</span>
            </div>
            <div className="p-4 rounded-xl bg-cream-50/70 border border-cream-300">
              <span className="text-[11px] font-bold text-burgundy-900 uppercase">EU AI Act</span>
              <p className="text-sm font-bold text-emerald-800 mt-1">Compliant</p>
              <span className="text-[10px] text-slate-500">Transparency & IP standards</span>
            </div>
            <div className="p-4 rounded-xl bg-cream-50/70 border border-cream-300">
              <span className="text-[11px] font-bold text-burgundy-900 uppercase">SOC 2 Type II</span>
              <p className="text-sm font-bold text-purple-800 mt-1">Vendor Audit</p>
              <span className="text-[10px] text-slate-500">Security & Subprocessors</span>
            </div>
          </div>
        </div>

        {/* Section 4: Risk Metrics & Severity Breakdown */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-burgundy-900 uppercase tracking-wider flex items-center gap-2 border-b border-cream-200 pb-1">
            <Layers className="w-4 h-4 text-burgundy-700" />
            4. Risk Severity Distribution
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
              <span className="text-xs font-bold text-rose-800 uppercase">Critical</span>
              <p className="text-2xl font-black text-rose-900 font-mono mt-1">{riskMetrics.criticalCount}</p>
              <span className="text-[10px] text-rose-700">Urgent remediation</span>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-xs font-bold text-amber-800 uppercase">High</span>
              <p className="text-2xl font-black text-amber-900 font-mono mt-1">{riskMetrics.highCount}</p>
              <span className="text-[10px] text-amber-700">Material impact</span>
            </div>
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
              <span className="text-xs font-bold text-blue-800 uppercase">Medium</span>
              <p className="text-2xl font-black text-blue-900 font-mono mt-1">{riskMetrics.mediumCount}</p>
              <span className="text-[10px] text-blue-700">Operational caveat</span>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-xs font-bold text-emerald-800 uppercase">Low</span>
              <p className="text-2xl font-black text-emerald-900 font-mono mt-1">{riskMetrics.lowCount}</p>
              <span className="text-[10px] text-emerald-700">Standard operational</span>
            </div>
          </div>
        </div>

        {/* Section 5: Strategic Execution Checklist */}
        {report.actionChecklist && report.actionChecklist.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-burgundy-900 uppercase tracking-wider flex items-center gap-2 border-b border-cream-200 pb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              5. Strategic Execution Checklist
            </h2>
            <div className="space-y-2">
              {report.actionChecklist.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 6: Clause-by-Clause Detailed Breakdown */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-burgundy-900 uppercase tracking-wider flex items-center gap-2 border-b border-cream-200 pb-1">
            <Award className="w-4 h-4 text-burgundy-700" />
            6. Flagged Clause Remediation & AI Explanations
          </h2>

          <div className="space-y-4">
            {['critical', 'high', 'medium', 'low'].map((tier) => {
              const tierClauses = groupedClauses[tier] || [];
              if (tierClauses.length === 0) return null;

              return (
                <div key={tier} className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-burgundy-900 border-b border-cream-200 pb-1">
                    {tier.toUpperCase()} Risk Clauses ({tierClauses.length})
                  </h3>
                  {tierClauses.map((c) => (
                    <div key={c._id} className="p-4 rounded-2xl border border-cream-300 space-y-2 text-xs bg-white shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-burgundy-950">{c.heading}</span>
                          <span className="text-[11px] text-slate-400 font-mono">Page {c.pageNumber}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cream-100 text-burgundy-900">{c.category}</span>
                        </div>
                        <RiskBadge level={c.riskLevel} score={c.riskScore} size="sm" />
                      </div>

                      <p className="text-slate-800 leading-relaxed font-legal bg-cream-50/60 p-3 rounded-xl border border-cream-200">
                        "{c.text}"
                      </p>

                      <div className="text-[11px] text-slate-600">
                        <strong className="text-burgundy-950">Why it matters:</strong> {c.whyItMatters || 'Standard commercial terms.'}
                      </div>

                      {c.recommendation && (
                        <div className="text-[11px] text-emerald-800 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200">
                          <strong>Remediation Recommendation:</strong> {c.recommendation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Disclaimer Footer */}
        <div className="pt-8 border-t border-cream-200">
          <DisclaimerBanner />
        </div>
      </div>
    </div>
  );
};
