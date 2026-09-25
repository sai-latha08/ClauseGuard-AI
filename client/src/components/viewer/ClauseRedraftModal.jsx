import React, { useState, useEffect } from 'react';
import { riskAPI } from '../../services/api';
import { RiskBadge } from '../common/RiskBadge';
import { 
  X, Sparkles, Copy, Check, ShieldCheck, Scale, ArrowRight, 
  Lightbulb, AlertCircle, FileCheck, RefreshCw, Send, CheckCircle2 
} from 'lucide-react';

export const ClauseRedraftModal = ({ documentId, clause, isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [redraftData, setRedraftData] = useState(null);
  const [error, setError] = useState(null);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedMemo, setCopiedMemo] = useState(false);

  useEffect(() => {
    if (isOpen && clause && documentId) {
      loadRedraft();
    } else {
      setRedraftData(null);
      setError(null);
    }
  }, [isOpen, clause, documentId]);

  const loadRedraft = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await riskAPI.redraftClause(documentId, clause.clauseId);
      if (res.data?.success) {
        setRedraftData(res.data.data);
      }
    } catch (err) {
      console.error('Error generating redline alternative:', err);
      setError(err.response?.data?.message || 'Failed to generate fair alternative. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyClause = () => {
    if (!redraftData?.proposedText) return;
    navigator.clipboard.writeText(redraftData.proposedText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleCopyNegotiationMemo = () => {
    if (!redraftData) return;
    const memo = `SUBJECT: Proposed Contract Amendment - ${clause.heading || 'Clause ' + clause.clauseNumber}

ORIGINAL LANGUAGE:
"${clause.text}"

CONCERNS / RATIONALE:
${redraftData.rationale}

KEY AMENDMENTS REQUESTED:
${redraftData.keyChanges.map(c => `• ${c}`).join('\n')}

PROPOSED REVISED LANGUAGE:
"${redraftData.proposedText}"

REGULATORY CONTEXT:
${redraftData.complianceTags.join(', ')}

Please confirm if this revised wording is acceptable for inclusion in the final execution agreement.`;

    navigator.clipboard.writeText(memo);
    setCopiedMemo(true);
    setTimeout(() => setCopiedMemo(false), 2000);
  };

  if (!isOpen || !clause) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-brand-900 to-slate-900 text-white rounded-t-2xl">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-400/30 flex items-center justify-center text-brand-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded bg-brand-500/20 text-brand-200 border border-brand-400/30">
                  AI Legal Counter-Proposal
                </span>
                <span className="text-xs text-slate-300">• Page {clause.pageNumber}</span>
              </div>
              <h3 className="text-lg font-bold text-white leading-snug">
                {clause.heading || `Clause ${clause.clauseNumber}`}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {loading && (
            <div className="py-16 text-center">
              <RefreshCw className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-slate-800">Synthesizing Balanced Alternative...</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Analyzing clause vulnerabilities, regulatory frameworks, and drafting mutual legal safeguards.
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Unable to generate redline</p>
                <p className="mt-0.5 text-red-600">{error}</p>
                <button
                  onClick={loadRedraft}
                  className="mt-2 text-xs font-semibold text-red-800 underline hover:no-underline"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {!loading && redraftData && (
            <>
              {/* Compliance & Risk Badges */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Original Risk:</span>
                  <RiskBadge level={clause.riskLevel} score={clause.riskScore} size="sm" />
                </div>

                {redraftData.complianceTags && redraftData.complianceTags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-slate-500 font-medium">Frameworks:</span>
                    {redraftData.complianceTags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1"
                      >
                        <ShieldCheck className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Side-by-side or stacked clause comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Original Clause */}
                <div className="p-4 rounded-xl bg-red-50/40 border border-red-200/80 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-red-800 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                        Original Language
                      </span>
                      <span className="text-[10px] font-semibold text-red-700 px-1.5 py-0.5 rounded bg-red-100">
                        High Risk
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-legal">
                      "{clause.text}"
                    </p>
                  </div>
                </div>

                {/* Proposed Fair Alternative */}
                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-300 flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-emerald-700" />
                        Proposed Fair Alternative
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-800 px-1.5 py-0.5 rounded bg-emerald-100">
                        Balanced
                      </span>
                    </div>
                    <p className="text-xs text-emerald-950 font-medium leading-relaxed font-legal">
                      "{redraftData.proposedText}"
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-emerald-200/80 flex justify-end">
                    <button
                      onClick={handleCopyClause}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      {copiedText ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Alternative</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Rationale and Key Changes */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Legal Rationale & Risk Mitigation
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    {redraftData.rationale}
                  </p>
                </div>

                {redraftData.keyChanges && redraftData.keyChanges.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Key Amendments Inserted
                    </h4>
                    <ul className="space-y-2">
                      {redraftData.keyChanges.map((change, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{change}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Negotiation Tip Box */}
                {redraftData.negotiationTip && (
                  <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex items-start gap-3">
                    <Lightbulb className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-bold text-blue-900 mb-0.5">Negotiation Strategy Tip</h5>
                      <p className="text-xs text-blue-800 leading-relaxed">
                        {redraftData.negotiationTip}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={handleCopyNegotiationMemo}
            disabled={!redraftData || loading}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {copiedMemo ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Memo Copied!</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy Counter-Proposal Email Memo</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-white hover:bg-slate-900 transition-colors shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
