import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { documentAPI } from '../services/api';
import {
  ShieldCheck,
  ShieldAlert,
  FileText,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock,
  Cpu,
  Layers,
  MessageSquare,
  Clock,
  Volume2
} from 'lucide-react';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import { RiskBadge } from '../components/common/RiskBadge';

export const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleTryDemo = async () => {
    if (!isAuthenticated) {
      navigate('/register');
      return;
    }
    try {
      const res = await documentAPI.loadDemo();
      if (res.data?.success) {
        navigate(`/analysis/${res.data.data._id}`);
      }
    } catch (e) {
      navigate('/upload');
    }
  };

  const featureCards = [
    {
      icon: Clock,
      title: 'Milestone & Auto-Renewal Alerts',
      desc: 'Detects cancellation notice windows, payment milestones, and expiration dates with 1-click Google / Outlook calendar sync and 30/60/90 day reminders.',
      tag: 'Google & Outlook Sync'
    },
    {
      icon: Volume2,
      title: '60-Second Executive Voice Brief',
      desc: 'In-browser AI voice narration provides busy executives with a 60-second verbal briefing on overall risk, critical gotchas, and cancellation deadlines.',
      tag: 'Spoken AI Narration'
    },
    {
      icon: ShieldAlert,
      title: 'Real-Time Risk Scoring',
      desc: 'Evaluates automatic renewals, sweeping indemnification, hidden fees, and unilateral amendments with weighted severity scoring.',
      tag: '0–100 Risk Score'
    },
    {
      icon: Sparkles,
      title: 'AI Redline Counter-Proposals',
      desc: 'Automatically drafts fair, bilateral redline amendments to replace heavily one-sided vendor clauses and protects your company.',
      tag: 'Bilateral Counter-Terms'
    },
    {
      icon: MessageSquare,
      title: 'Grounded Contract Q&A',
      desc: 'RAG-powered conversational assistant with exact page numbers and verbatim clause citations. Zero hallucinations.',
      tag: 'ChromaDB Vectors'
    },
    {
      icon: Layers,
      title: '16 Legal Categories',
      desc: 'Automatic taxonomy segmentation across Termination, Liability, Data Sharing, Arbitration, Warranty, and IP Licensing.',
      tag: 'Full Taxonomy'
    }
  ];

  return (
    <div className="bg-cream-50 text-burgundy-950 min-h-screen">
      <DisclaimerBanner className="rounded-none border-x-0 border-t-0" />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32 bg-gradient-to-b from-cream-100 via-cream-50 to-cream-200/50 border-b border-cream-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-burgundy-100 border border-burgundy-200 text-burgundy-800 text-xs font-bold mb-6 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-burgundy-700" />
              <span>Intelligent Legal Document Risk Intelligence</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-burgundy-950 tracking-tight leading-tight">
              Understand the fine print <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-burgundy-700 via-burgundy-800 to-burgundy-950">
                before you agree.
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-burgundy-900/70 leading-relaxed max-w-2xl mx-auto">
              ClauseGuard AI parses Terms & Conditions, segments complex clauses, detects unfair provisions, and explains risks in plain language.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                to={isAuthenticated ? "/upload" : "/register"}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-burgundy-800 hover:bg-burgundy-900 text-cream-50 font-bold text-xs shadow-md shadow-burgundy-950/20 transition-all flex items-center justify-center gap-2 border border-burgundy-950"
              >
                <span>Analyze a Document</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                onClick={handleTryDemo}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-cream-100 hover:bg-cream-200 text-burgundy-950 font-bold text-xs border border-cream-300 shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4 text-burgundy-700" />
                <span>Try Sample Agreement</span>
              </button>
            </div>
          </div>

          {/* Interactive Document Preview Mockup */}
          <div className="mt-14 max-w-5xl mx-auto rounded-2xl bg-cream-50 border border-cream-300 shadow-xl overflow-hidden">
            <div className="bg-burgundy-950 px-5 py-3.5 flex items-center justify-between text-xs text-cream-200">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                </div>
                <span className="font-mono text-[11px] text-cream-300 ml-2">CloudSphere_Terms_and_Conditions.pdf</span>
              </div>
              <RiskBadge level="CRITICAL" score={85} size="sm" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 p-6 gap-6 bg-cream-100/60">
              {/* Left sample clause */}
              <div className="md:col-span-7 bg-white p-5 rounded-xl border border-cream-200 space-y-3 font-legal text-xs leading-relaxed text-burgundy-950">
                <div className="flex items-center justify-between font-sans border-b border-cream-200 pb-2">
                  <span className="font-bold text-burgundy-950">Section 3. Subscription Billing & Renewal</span>
                  <RiskBadge level="HIGH" score={72} size="sm" />
                </div>
                <p className="bg-orange-50/70 p-3 rounded border-l-4 border-orange-600 text-orange-950">
                  "The subscription will automatically renew at the end of each billing cycle for successive periods unless you cancel prior to the end of the billing cycle..."
                </p>
                <p className="text-burgundy-900/60">
                  4. All payments are strictly non-refundable and non-transferable under any circumstances...
                </p>
              </div>

              {/* Right sample explain card */}
              <div className="md:col-span-5 bg-white p-5 rounded-xl border border-cream-200 space-y-3 text-xs">
                <div className="flex items-center gap-2 text-burgundy-800 font-bold">
                  <ShieldAlert className="w-4 h-4 text-orange-600" />
                  <span>Why This Risk Matters</span>
                </div>
                <p className="text-burgundy-900/80 leading-relaxed bg-cream-100/80 p-3 rounded-lg border border-cream-200">
                  The agreement may renew your payment method continuously without explicit renewal reminders.
                </p>
                <div className="text-[11px] text-emerald-900 bg-emerald-50 p-2.5 rounded border border-emerald-200">
                  <strong>Recommendation:</strong> Check cancellation cut-off requirements before subscribing.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-cream-100/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-burgundy-700">Architecture & Intelligence</h2>
            <h3 className="text-3xl font-extrabold text-burgundy-950 tracking-tight mt-1.5">
              Engineered for Genuine Legal Document Analysis
            </h3>
            <p className="text-sm text-burgundy-900/70 mt-2">
              No simulated outputs or superficial keyword matches. Powered by deep NLP text extraction, multi-stage scoring, and vector retrieval.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featureCards.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="p-6 rounded-2xl bg-white border border-cream-300 hover:border-burgundy-400 transition-colors flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-cream-100 border border-cream-300 flex items-center justify-center text-burgundy-800 mb-4 shadow-xs">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-burgundy-800 bg-burgundy-100 px-2 py-0.5 rounded">
                      {f.tag}
                    </span>
                    <h4 className="font-bold text-burgundy-950 text-base mt-2 mb-1.5">{f.title}</h4>
                    <p className="text-xs text-burgundy-900/70 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5-Step Pipeline Section */}
      <section className="py-20 bg-burgundy-950 text-cream-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-cream-400">Processing Methodology</span>
            <h3 className="text-3xl font-bold tracking-tight mt-1.5">The ClauseGuard 5-Stage Pipeline</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { num: '01', title: 'Extraction', desc: 'PyMuPDF text extraction with OCR fallback for scanned docs' },
              { num: '02', title: 'Segmentation', desc: 'Numbered clause & section heading boundary detection' },
              { num: '03', title: 'Classification', desc: '16-Category legal taxonomy semantic mapping' },
              { num: '04', title: 'Risk Scoring', desc: 'Weighted factor scoring & plain-language explainability' },
              { num: '05', title: 'ChromaDB RAG', desc: 'Dense vector embeddings for grounded document Q&A' },
            ].map((s, idx) => (
              <div key={idx} className="p-5 rounded-xl bg-burgundy-900/90 border border-burgundy-800 text-left">
                <span className="text-cream-400 font-mono text-xl font-black block mb-2">{s.num}</span>
                <h4 className="font-bold text-sm text-cream-100">{s.title}</h4>
                <p className="text-xs text-cream-300/70 mt-1 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
