import React, { useState, useEffect, useRef } from 'react';
import { ClauseCard } from './ClauseCard';
import { RiskExplainerModal } from './RiskExplainerModal';
import { ClauseRedraftModal } from './ClauseRedraftModal';
import { DocumentChatbot } from './DocumentChatbot';
import { DocumentSummaryTab } from './DocumentSummaryTab';
import { RiskAnalyticsDashboard } from './RiskAnalyticsDashboard';
import { MilestoneCalendarView } from './MilestoneCalendarView';
import { ExecutiveVoiceBriefing } from './ExecutiveVoiceBriefing';
import { RiskBadge } from '../common/RiskBadge';
import {
  FileText,
  ShieldAlert,
  MessageSquare,
  Sparkles,
  Filter,
  Search,
  Download,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Printer,
  ShieldCheck,
  Scale,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Volume2,
  Clock,
  Radio,
  SlidersHorizontal,
  LayoutGrid,
  Columns2,
  Maximize2,
  BookOpen,
  ArrowRight,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const SplitDocumentViewer = ({ document, analysis, clauses = [], onReanalyze }) => {
  // Page mode: 'intelligence' (Full Intelligence & Alerts Hub), 'document' (Full Document Reader), or 'split'
  const [pageMode, setPageMode] = useState('intelligence'); 
  const [activeTab, setActiveTab] = useState('milestones'); // 'milestones', 'voice', 'clauses', 'compliance', 'chat', 'summary'
  const [selectedClause, setSelectedClause] = useState(clauses[0] || null);
  const [explainerClause, setExplainerClause] = useState(null);
  const [isExplainerOpen, setIsExplainerOpen] = useState(false);
  const [redraftClause, setRedraftClause] = useState(null);
  const [isRedraftOpen, setIsRedraftOpen] = useState(false);
  const [showClauseDrawer, setShowClauseDrawer] = useState(false);
  
  // Filters
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Document Page navigation
  const [currentPage, setCurrentPage] = useState(1);
  const clauseRefs = useRef({});

  const totalPages = document?.pageCount || 1;
  const complianceMatrix = analysis?.complianceMatrix || {
    gdpr_status: "REVIEW_NEEDED",
    gdpr_score: 75,
    ccpa_status: "REVIEW_NEEDED",
    ccpa_score: 75,
    eu_ai_act_status: "COMPLIANT",
    soc2_status: "REVIEW_NEEDED"
  };

  const milestones = analysis?.milestones || [];
  const renewalInfo = analysis?.renewalInfo || {};
  const executiveVoiceScript = analysis?.executiveVoiceScript || '';
  const estimatedAudioDuration = analysis?.estimatedAudioDuration || 58;

  // Extract unique categories
  const availableCategories = Array.from(new Set(clauses.map(c => c.category))).sort();

  // Filter clauses
  const filteredClauses = clauses.filter(c => {
    if (riskFilter !== 'ALL' && c.riskLevel !== riskFilter) return false;
    if (categoryFilter !== 'ALL' && c.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.heading.toLowerCase().includes(q) ||
        c.text.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSelectClause = (clause) => {
    setSelectedClause(clause);
    setCurrentPage(clause.pageNumber);
    setShowClauseDrawer(true);
    const el = clauseRefs.current[clause.clauseId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const openExplainer = (clause) => {
    setExplainerClause(clause);
    setIsExplainerOpen(true);
  };

  const openRedraft = (clause) => {
    setRedraftClause(clause);
    setIsRedraftOpen(true);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4.25rem)] bg-cream-50">
      {/* Top Document Header Bar */}
      <div className="bg-white border-b border-cream-300 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-burgundy-900 text-cream-100 flex items-center justify-center font-bold shadow-xs">
            <FileText className="w-5 h-5 text-cream-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-extrabold text-burgundy-950 truncate max-w-xs sm:max-w-md">
                {document.originalName}
              </h2>
              <span className="text-xs text-burgundy-900/60 font-mono hidden sm:inline">
                {document.totalClauses || clauses.length} Clauses • {document.pageCount || 1} Pages
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-slate-500">
                Audited {new Date(document.uploadedAt || Date.now()).toLocaleDateString()}
              </span>
              <span className="text-cream-400">•</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-burgundy-900">GDPR:</span>
                <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${
                  complianceMatrix.gdpr_status === 'COMPLIANT' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {complianceMatrix.gdpr_status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* PRIMARY PAGE VIEW SWITCHER (Two Dedicated Separate Pages) */}
        <div className="flex items-center gap-1 p-1 bg-cream-200/80 rounded-2xl border border-cream-300 shadow-2xs">
          <button
            onClick={() => setPageMode('intelligence')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              pageMode === 'intelligence'
                ? 'bg-burgundy-900 text-cream-50 shadow-sm shadow-burgundy-950/20'
                : 'text-burgundy-900/70 hover:text-burgundy-950 hover:bg-cream-100'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${pageMode === 'intelligence' ? 'text-cream-200' : 'text-burgundy-700'}`} />
            <span>Risk & Alerts Hub</span>
          </button>

          <button
            onClick={() => setPageMode('document')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              pageMode === 'document'
                ? 'bg-burgundy-900 text-cream-50 shadow-sm shadow-burgundy-950/20'
                : 'text-burgundy-900/70 hover:text-burgundy-950 hover:bg-cream-100'
            }`}
          >
            <BookOpen className={`w-4 h-4 ${pageMode === 'document' ? 'text-cream-200' : 'text-burgundy-700'}`} />
            <span>Document Reader</span>
          </button>

          <button
            onClick={() => setPageMode('split')}
            className={`p-2 rounded-xl text-xs font-bold transition-all hidden lg:flex items-center gap-1 ${
              pageMode === 'split'
                ? 'bg-burgundy-900 text-cream-50 shadow-sm'
                : 'text-burgundy-900/60 hover:text-burgundy-950 hover:bg-cream-100'
            }`}
            title="Side-by-Side Split View"
          >
            <Columns2 className="w-4 h-4" />
          </button>
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-cream-100 px-3 py-1 rounded-xl border border-cream-300">
            <span className="text-[11px] text-burgundy-900/70 font-semibold hidden md:inline">Score:</span>
            <RiskBadge level={document.overallRisk} score={document.overallScore} size="md" />
          </div>

          <Link
            to={`/report/${document._id}`}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-burgundy-800 hover:bg-burgundy-900 text-cream-50 transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-cream-200" />
            <span className="hidden sm:inline">Audit Report</span>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 1: DEDICATED CONTRACT RISK INTELLIGENCE & ALERT HUB (FULL WIDTH)     */}
      {/* ========================================================================= */}
      {pageMode === 'intelligence' && (
        <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Executive Intelligence Tab Bar */}
          <div className="flex items-center justify-between border-b border-cream-300 bg-white rounded-2xl p-1.5 border shadow-2xs overflow-x-auto">
            <div className="flex items-center gap-1 w-full">
              <button
                onClick={() => setActiveTab('milestones')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                  activeTab === 'milestones'
                    ? 'bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs'
                    : 'text-burgundy-900/70 hover:text-burgundy-950 hover:bg-cream-100'
                }`}
              >
                <Calendar className="w-4 h-4 text-amber-600" />
                <span>Milestones & Auto-Renewal Alerts</span>
              </button>

              <button
                onClick={() => setActiveTab('voice')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                  activeTab === 'voice'
                    ? 'bg-rose-100 text-rose-950 border border-rose-300 shadow-2xs'
                    : 'text-burgundy-900/70 hover:text-burgundy-950 hover:bg-cream-100'
                }`}
              >
                <Volume2 className="w-4 h-4 text-rose-600" />
                <span>60s Executive Voice Brief</span>
              </button>

              <button
                onClick={() => setActiveTab('clauses')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                  activeTab === 'clauses'
                    ? 'bg-burgundy-100 text-burgundy-950 border border-burgundy-300 shadow-2xs'
                    : 'text-burgundy-900/70 hover:text-burgundy-950 hover:bg-cream-100'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-burgundy-700" />
                <span>Risk Severity Breakdown ({clauses.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('compliance')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                  activeTab === 'compliance'
                    ? 'bg-emerald-100 text-emerald-950 border border-emerald-300 shadow-2xs'
                    : 'text-burgundy-900/70 hover:text-burgundy-950 hover:bg-cream-100'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Compliance Matrix</span>
              </button>

              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                  activeTab === 'chat'
                    ? 'bg-purple-100 text-purple-950 border border-purple-300 shadow-2xs'
                    : 'text-burgundy-900/70 hover:text-burgundy-950 hover:bg-cream-100'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-purple-600" />
                <span>Ask AI Copilot</span>
              </button>

              <button
                onClick={() => setActiveTab('summary')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                  activeTab === 'summary'
                    ? 'bg-burgundy-800 text-cream-50 shadow-xs'
                    : 'text-burgundy-900/70 hover:text-burgundy-950 hover:bg-cream-100'
                }`}
              >
                <Sparkles className="w-4 h-4 text-cream-200" />
                <span>Executive Verdict</span>
              </button>
            </div>
          </div>

          {/* TAB 1: Milestone Extraction & Auto-Renewal Alert Calendar */}
          {activeTab === 'milestones' && (
            <MilestoneCalendarView
              documentName={document.originalName}
              milestones={milestones}
              renewalInfo={renewalInfo}
              riskScore={document.overallScore}
            />
          )}

          {/* TAB 2: 60-Second Executive Voice Briefing */}
          {activeTab === 'voice' && (
            <ExecutiveVoiceBriefing
              documentName={document.originalName}
              riskScore={document.overallScore || 50}
              overallRisk={document.overallRisk || 'MEDIUM'}
              voiceScript={executiveVoiceScript}
              estimatedDuration={estimatedAudioDuration || 58}
            />
          )}

          {/* TAB 3: Full-Width Filterable Clause Risk Breakdown */}
          {activeTab === 'clauses' && (
            <div className="bg-white rounded-3xl border border-cream-300 p-6 sm:p-8 shadow-xs space-y-6">
              {/* Filter Controls Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-cream-200">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search clause text, heading, category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-cream-50 border border-cream-300 rounded-xl text-xs text-burgundy-950 focus:outline-none focus:ring-1 focus:ring-burgundy-500"
                  />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <select
                    value={riskFilter}
                    onChange={(e) => setRiskFilter(e.target.value)}
                    className="text-xs bg-white border border-cream-300 rounded-xl px-3 py-2 text-burgundy-950 font-bold focus:outline-none"
                  >
                    <option value="ALL">All Risk Severities</option>
                    <option value="CRITICAL">Critical Risk Only</option>
                    <option value="HIGH">High Risk Only</option>
                    <option value="MEDIUM">Medium Risk Only</option>
                    <option value="LOW">Low Risk Only</option>
                  </select>

                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="text-xs bg-white border border-cream-300 rounded-xl px-3 py-2 text-burgundy-950 font-bold focus:outline-none truncate max-w-[200px]"
                  >
                    <option value="ALL">All 16 Categories</option>
                    {availableCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Clause Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredClauses.length === 0 ? (
                  <div className="col-span-2 text-center py-16 text-slate-400 text-xs">
                    No clauses match the selected filters.
                  </div>
                ) : (
                  filteredClauses.map((clause) => (
                    <ClauseCard
                      key={clause.clauseId}
                      clause={clause}
                      isSelected={selectedClause?.clauseId === clause.clauseId}
                      onClick={() => handleSelectClause(clause)}
                      onExplainClick={openExplainer}
                      onRedraftClick={openRedraft}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Regulatory Compliance Matrix */}
          {activeTab === 'compliance' && (
            <div className="bg-white rounded-3xl border border-cream-300 p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-burgundy-950 mb-1 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  Regulatory Governance & Compliance Matrix
                </h3>
                <p className="text-xs text-slate-500">
                  Automated audit against global data privacy, consumer protection, and international enterprise standards.
                </p>
              </div>

              {/* Compliance Scorecards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl border border-cream-300 bg-cream-50/50 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold text-burgundy-950">GDPR (EU)</span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      complianceMatrix.gdpr_status === 'COMPLIANT' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {complianceMatrix.gdpr_status}
                    </span>
                  </div>
                  <div className="w-full bg-cream-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${complianceMatrix.gdpr_score || 70}%` }}></div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">Data portability & erasure rules</p>
                </div>

                <div className="p-5 rounded-2xl border border-cream-300 bg-cream-50/50 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold text-burgundy-950">CCPA / CPRA</span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      complianceMatrix.ccpa_status === 'COMPLIANT' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {complianceMatrix.ccpa_status}
                    </span>
                  </div>
                  <div className="w-full bg-cream-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${complianceMatrix.ccpa_score || 75}%` }}></div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">Do Not Sell & opt-out provisions</p>
                </div>

                <div className="p-5 rounded-2xl border border-cream-300 bg-cream-50/50 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold text-burgundy-950">EU AI Act</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {complianceMatrix.eu_ai_act_status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">Data training transparency & IP safeguards</p>
                </div>

                <div className="p-5 rounded-2xl border border-cream-300 bg-cream-50/50 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold text-burgundy-950">SOC 2 Type II</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                      {complianceMatrix.soc2_status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">Vendor security & sub-processor controls</p>
                </div>
              </div>

              {/* Remediation List */}
              <div className="pt-4 border-t border-cream-200">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-burgundy-900 mb-3">
                  Flagged Clauses Requiring Remediation
                </h4>
                <div className="space-y-3">
                  {clauses.filter(c => c.riskLevel === 'CRITICAL' || c.riskLevel === 'HIGH').map((c) => (
                    <div key={c.clauseId} className="p-4 rounded-2xl border border-cream-300 bg-cream-50/40 flex items-center justify-between gap-4 shadow-2xs">
                      <div>
                        <h5 className="text-xs font-bold text-burgundy-950">{c.heading}</h5>
                        <p className="text-[11px] text-slate-500 mt-0.5">{c.category}</p>
                      </div>
                      <button
                        onClick={() => openRedraft(c)}
                        className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-burgundy-800 hover:bg-burgundy-900 text-cream-50 flex items-center gap-1.5 shrink-0 transition-colors shadow-2xs"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-cream-200" />
                        <span>AI Redline</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Ask AI Contract Copilot */}
          {activeTab === 'chat' && (
            <div className="bg-white rounded-3xl border border-cream-300 p-6 shadow-xs min-h-[550px] flex flex-col">
              <DocumentChatbot
                documentId={document._id}
                onSelectClause={(cId) => {
                  const target = clauses.find(c => c.clauseId === cId);
                  if (target) handleSelectClause(target);
                }}
              />
            </div>
          )}

          {/* TAB 6: Executive Analytics & Utility Verdict */}
          {activeTab === 'summary' && (
            <div className="bg-white rounded-3xl border border-cream-300 p-6 sm:p-8 shadow-xs">
              <RiskAnalyticsDashboard
                analysis={analysis}
                document={document}
                clauses={clauses}
                onSelectClause={handleSelectClause}
              />
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAGE 2: DEDICATED FULL-WIDTH DOCUMENT READER PAGE                         */}
      {/* ========================================================================= */}
      {pageMode === 'document' && (
        <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Reader Toolbar */}
          <div className="bg-white rounded-2xl border border-cream-300 p-4 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <span className="font-extrabold text-xs sm:text-sm text-burgundy-950">Full Contract Stream</span>
              <span className="text-cream-400">|</span>
              <span className="text-xs text-slate-500 font-mono">Page {currentPage} of {totalPages}</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setPageMode('intelligence')}
                className="px-3.5 py-1.5 rounded-xl bg-cream-100 hover:bg-cream-200 text-burgundy-950 font-bold text-xs border border-cream-300 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-burgundy-700" />
                <span>Switch to Risk & Alerts Hub</span>
              </button>
            </div>
          </div>

          {/* Document Content Sheet */}
          <div className="bg-white rounded-3xl shadow-sm border border-cream-300 p-8 sm:p-12 space-y-8 font-legal">
            <div className="border-b border-cream-200 pb-6 text-center">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-burgundy-700 bg-cream-100 px-3 py-1 rounded-full border border-cream-300">
                Official Contract Stream
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold font-legal text-burgundy-950 uppercase tracking-wide mt-3">
                {document.originalName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')}
              </h1>
            </div>

            <div className="space-y-6">
              {clauses.map((clause) => {
                const isSelected = selectedClause?.clauseId === clause.clauseId;
                const isHighRisk = clause.riskLevel === 'CRITICAL' || clause.riskLevel === 'HIGH';
                const riskColors = {
                  CRITICAL: 'bg-rose-50/90 border-l-4 border-rose-600 text-rose-950 hover:bg-rose-100/80',
                  HIGH: 'bg-amber-50/90 border-l-4 border-amber-600 text-amber-950 hover:bg-amber-100/80',
                  MEDIUM: 'bg-blue-50/80 border-l-4 border-blue-500 text-blue-950 hover:bg-blue-100/70',
                  LOW: 'bg-emerald-50/70 border-l-4 border-emerald-600 text-emerald-950 hover:bg-emerald-100/60',
                };

                const currentStyle = riskColors[clause.riskLevel] || riskColors.LOW;

                return (
                  <div
                    key={clause.clauseId}
                    ref={(el) => (clauseRefs.current[clause.clauseId] = el)}
                    onClick={() => handleSelectClause(clause)}
                    className={`p-5 rounded-r-2xl transition-all cursor-pointer text-xs sm:text-sm leading-relaxed ${currentStyle} ${
                      isSelected ? 'ring-2 ring-burgundy-600 shadow-md' : 'shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between font-sans text-xs font-bold mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white/90 border border-current/20">
                          Page {clause.pageNumber}
                        </span>
                        <span className="font-extrabold text-slate-900">{clause.heading}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {isHighRisk && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openRedraft(clause);
                            }}
                            className="text-[11px] font-sans font-bold px-2.5 py-1 rounded-lg bg-white border border-burgundy-300 text-burgundy-800 hover:bg-burgundy-50 flex items-center gap-1 shadow-2xs"
                          >
                            <Sparkles className="w-3 h-3 text-burgundy-600" />
                            <span>AI Redline</span>
                          </button>
                        )}
                        <RiskBadge level={clause.riskLevel} score={clause.riskScore} size="sm" />
                      </div>
                    </div>

                    <p className="whitespace-pre-wrap font-legal">{clause.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* OPTIONAL SPLIT VIEW (Side-by-Side)                                        */}
      {/* ========================================================================= */}
      {pageMode === 'split' && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Column: Reader */}
          <div className="lg:col-span-6 flex flex-col bg-cream-100/40 border-r border-cream-300 overflow-y-auto p-6 space-y-4">
            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xs border border-cream-300 p-6 space-y-4">
              <h2 className="text-base font-extrabold font-legal text-burgundy-950 text-center border-b pb-3">
                {document.originalName}
              </h2>
              {clauses.map((clause) => (
                <div
                  key={clause.clauseId}
                  onClick={() => handleSelectClause(clause)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer ${
                    selectedClause?.clauseId === clause.clauseId ? 'ring-2 ring-burgundy-500 bg-cream-100' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span>{clause.heading}</span>
                    <RiskBadge level={clause.riskLevel} score={clause.riskScore} size="sm" />
                  </div>
                  <p className="font-legal line-clamp-3 text-slate-700">{clause.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Intelligence */}
          <div className="lg:col-span-6 flex flex-col bg-white overflow-y-auto p-6 space-y-4">
            <div className="flex border-b pb-2 gap-2">
              <button
                onClick={() => setActiveTab('milestones')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${activeTab === 'milestones' ? 'bg-amber-100 text-amber-950' : 'text-slate-600'}`}
              >
                Milestones
              </button>
              <button
                onClick={() => setActiveTab('voice')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${activeTab === 'voice' ? 'bg-rose-100 text-rose-950' : 'text-slate-600'}`}
              >
                60s Brief
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${activeTab === 'chat' ? 'bg-purple-100 text-purple-950' : 'text-slate-600'}`}
              >
                Ask AI
              </button>
            </div>

            {activeTab === 'milestones' && (
              <MilestoneCalendarView
                documentName={document.originalName}
                milestones={milestones}
                renewalInfo={renewalInfo}
                riskScore={document.overallScore}
              />
            )}
            {activeTab === 'voice' && (
              <ExecutiveVoiceBriefing
                documentName={document.originalName}
                riskScore={document.overallScore}
                overallRisk={document.overallRisk}
                voiceScript={executiveVoiceScript}
                estimatedDuration={estimatedAudioDuration}
              />
            )}
            {activeTab === 'chat' && <DocumentChatbot documentId={document._id} />}
          </div>
        </div>
      )}

      {/* Selected Clause Inspection Slide-over Drawer (When in Document Reader mode) */}
      {showClauseDrawer && selectedClause && pageMode === 'document' && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl border-l border-cream-300 p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-cream-200">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cream-100 text-burgundy-900 border border-cream-300">
                  P.{selectedClause.pageNumber}
                </span>
                <span className="text-xs font-bold uppercase text-slate-500">{selectedClause.category}</span>
              </div>
              <button
                onClick={() => setShowClauseDrawer(false)}
                className="p-1.5 rounded-lg hover:bg-cream-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="text-sm font-extrabold text-burgundy-950">{selectedClause.heading}</h3>
              <div className="mt-2">
                <RiskBadge level={selectedClause.riskLevel} score={selectedClause.riskScore} size="md" />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-cream-50 border border-cream-200 text-xs font-legal leading-relaxed text-slate-800 max-h-48 overflow-y-auto">
              "{selectedClause.text}"
            </div>

            {selectedClause.whyItMatters && (
              <div className="text-xs space-y-1">
                <strong className="text-burgundy-950 font-bold">Why it matters:</strong>
                <p className="text-slate-600 leading-relaxed">{selectedClause.whyItMatters}</p>
              </div>
            )}

            {selectedClause.recommendation && (
              <div className="p-3 rounded-xl bg-emerald-50 text-xs text-emerald-950 border border-emerald-200">
                <strong>Remediation:</strong> {selectedClause.recommendation}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-cream-200 flex items-center gap-3">
            <button
              onClick={() => openRedraft(selectedClause)}
              className="flex-1 py-2.5 rounded-xl bg-burgundy-800 hover:bg-burgundy-900 text-cream-50 font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-cream-200" />
              <span>Generate AI Redline</span>
            </button>
            <button
              onClick={() => openExplainer(selectedClause)}
              className="px-4 py-2.5 rounded-xl bg-cream-100 hover:bg-cream-200 text-burgundy-950 font-bold text-xs border border-cream-300"
            >
              Explain
            </button>
          </div>
        </div>
      )}

      {/* In-depth Risk Explainer Modal */}
      <RiskExplainerModal
        clause={explainerClause}
        isOpen={isExplainerOpen}
        onClose={() => setIsExplainerOpen(false)}
      />

      {/* AI Counter-Proposal & Redline Modal */}
      <ClauseRedraftModal
        documentId={document._id}
        clause={redraftClause}
        isOpen={isRedraftOpen}
        onClose={() => setIsRedraftOpen(false)}
      />
    </div>
  );
};
