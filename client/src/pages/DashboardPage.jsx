import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { documentAPI } from '../services/api';
import { MetricsGrid } from '../components/dashboard/MetricsGrid';
import { RecentAuditsTable } from '../components/dashboard/RecentAuditsTable';
import { UpcomingRenewalsWidget } from '../components/dashboard/UpcomingRenewalsWidget';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import { UploadCloud, FileText, Sparkles, Loader2, Plus, ShieldCheck, ClipboardPaste, ArrowRight, Bot, Calendar } from 'lucide-react';

export const DashboardPage = () => {
  const [documents, setDocuments] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [demoLoading, setDemoLoading] = useState(false);
  const navigate = useNavigate();

  const fetchDocuments = async () => {
    try {
      const res = await documentAPI.getAll();
      if (res.data?.success) {
        setDocuments(res.data.data);
        setMetrics(res.data.metrics || {});
      }
    } catch (err) {
      console.error('Failed to load user documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document and its risk analysis data?')) {
      return;
    }
    try {
      await documentAPI.delete(docId);
      fetchDocuments();
    } catch (err) {
      alert('Failed to delete document');
    }
  };

  const handleLoadDemo = async () => {
    setDemoLoading(true);
    try {
      const res = await documentAPI.loadDemo();
      if (res.data?.success) {
        navigate(`/analysis/${res.data.data._id}`);
      }
    } catch (err) {
      alert('Could not load sample document');
      setDemoLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-burgundy-700" />
          <span className="text-xs font-semibold text-burgundy-900/70">Loading audit records...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-cream-300">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-burgundy-950 tracking-tight">Contract Audit Intelligence</h1>
          <p className="text-xs sm:text-sm text-burgundy-900/70 mt-1">
            Monitor risk distribution, AI redlines, auto-renewal alert calendars, and executive voice briefings
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleLoadDemo}
            disabled={demoLoading}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-cream-100 hover:bg-cream-200 text-burgundy-900 font-bold text-xs transition-colors flex items-center justify-center gap-2 border border-cream-300"
          >
            {demoLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5 text-burgundy-700" />}
            <span>Load Sample Terms</span>
          </button>

          <Link
            to="/ai-assistant"
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 border border-purple-200"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-700" />
            <span>AI Copilot</span>
          </Link>

          <Link
            to="/upload"
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-burgundy-800 hover:bg-burgundy-900 text-cream-50 font-bold text-xs shadow-md shadow-burgundy-950/20 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Audit / Paste Terms</span>
          </Link>
        </div>
      </div>

      <DisclaimerBanner />

      {/* Upcoming Renewal Sentinel Widget */}
      <UpcomingRenewalsWidget documents={documents} />

      {/* Quick Access Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/upload"
          className="p-5 rounded-2xl bg-white border border-cream-300 hover:border-burgundy-400 hover:shadow-md transition-all group flex items-start justify-between"
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-burgundy-50 border border-burgundy-200 flex items-center justify-center text-burgundy-800">
                <ClipboardPaste className="w-4 h-4" />
              </div>
              <span className="font-bold text-burgundy-950 text-sm">Direct Paste / PDF Upload</span>
            </div>
            <p className="text-xs text-burgundy-900/70 leading-relaxed">
              Paste raw Terms & Conditions or drop a contract PDF for instant risk scoring, graph analytics, and redline suggestions.
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-burgundy-600 group-hover:translate-x-1 transition-transform shrink-0 mt-1" />
        </Link>

        <Link
          to="/ai-assistant"
          className="p-5 rounded-2xl bg-gradient-to-r from-purple-50/60 to-white border border-purple-200/80 hover:border-purple-400 hover:shadow-md transition-all group flex items-start justify-between"
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-800">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-bold text-purple-950 text-sm">AI Contract Copilot & Interrogation</span>
            </div>
            <p className="text-xs text-purple-900/70 leading-relaxed">
              Ask deep questions about governing law, liability caps, and termination penalties with verbatim clause citations.
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-purple-600 group-hover:translate-x-1 transition-transform shrink-0 mt-1" />
        </Link>
      </div>

      {/* Aggregate Metrics Grid */}
      <MetricsGrid metrics={metrics} />

      {/* Recent Audits Table */}
      <RecentAuditsTable documents={documents} onDelete={handleDelete} />
    </div>
  );
};
