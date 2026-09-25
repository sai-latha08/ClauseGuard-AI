import React, { useState, useEffect, useRef } from 'react';
import { documentAPI, qaAPI, riskAPI } from '../services/api';
import { RiskBadge } from '../components/common/RiskBadge';
import {
  Sparkles,
  Bot,
  Send,
  FileText,
  ShieldAlert,
  HelpCircle,
  Scale,
  Copy,
  Check,
  ChevronRight,
  RefreshCw,
  Zap,
  ArrowRight,
  BookOpen,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  Layers,
  Search,
  CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';

const POWER_PROMPTS = [
  {
    title: 'Top 3 Dangerous Clauses',
    desc: 'Identify the most high-risk provisions and why they matter',
    prompt: 'What are the top 3 most critical or dangerous clauses in this contract and how do they disadvantage the user?'
  },
  {
    title: 'Account Termination & Data',
    desc: 'Can the provider delete my account or data without notice?',
    prompt: 'Can the company terminate or suspend my account without prior notice, and what happens to my stored data?'
  },
  {
    title: 'Commercial Data Sharing',
    desc: 'Does the provider monetize or share personal data?',
    prompt: 'Does this agreement permit sharing or selling personal information with third-party advertisers or commercial partners?'
  },
  {
    title: 'Arbitration & Rights Waiver',
    desc: 'Are class actions or jury trials surrendered?',
    prompt: 'Does this contract force mandatory binding individual arbitration and waive class action or jury trial rights?'
  },
  {
    title: 'Auto-Renewal & Refund Terms',
    desc: 'Check recurring billing deadlines and cancellation policy',
    prompt: 'How does subscription renewal and cancellation work, and are refunds provided upon cancellation or downtime?'
  },
  {
    title: 'Business Utility Verdict',
    desc: 'Is this agreement balanced and safe to sign?',
    prompt: 'Based on this contract, provide a comprehensive verdict on whether this agreement is commercially fair or heavily one-sided.'
  }
];

export const AIAssistantPage = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [loadingDocs, setLoadingDocs] = useState(true);
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);
  const [docAnalysis, setDocAnalysis] = useState(null);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (selectedDocId) {
      loadDocumentData(selectedDocId);
    }
  }, [selectedDocId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingChat]);

  const fetchDocuments = async () => {
    setLoadingDocs(true);
    try {
      const res = await documentAPI.getAll();
      if (res.data?.success && res.data.data.length > 0) {
        setDocuments(res.data.data);
        setSelectedDocId(res.data.data[0]._id);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  const loadDocumentData = async (docId) => {
    try {
      // Load history
      const histRes = await qaAPI.getHistory(docId);
      if (histRes.data?.success && histRes.data.data.length > 0) {
        setMessages(histRes.data.data);
      } else {
        // Default welcome prompt
        setMessages([
          {
            role: 'assistant',
            content: `Hello! I am your ClauseGuard AI Legal Assistant. I have indexed your contract and am ready to audit specific clauses, analyze risks, evaluate compliance, and draft counter-proposals. What would you like to know about this agreement?`,
            timestamp: new Date()
          }
        ]);
      }

      // Load risk overview
      const riskRes = await riskAPI.getAnalysis(docId);
      if (riskRes.data?.success) {
        setDocAnalysis(riskRes.data);
      }
    } catch (err) {
      console.error('Error loading doc history:', err);
    }
  };

  const handleSendMessage = async (textToSend) => {
    const q = textToSend || inputQuestion;
    if (!q || !q.trim() || !selectedDocId || loadingChat) return;

    const userMsg = {
      role: 'user',
      content: q.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuestion('');
    setLoadingChat(true);

    try {
      const res = await qaAPI.ask(selectedDocId, q.trim());
      if (res.data?.success) {
        const assistantMsg = {
          role: 'assistant',
          content: res.data.data.answer,
          confidence: res.data.data.confidence,
          sources: res.data.data.sources,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMsg]);
      }
    } catch (err) {
      console.error('Q&A Error:', err);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'I encountered an error analyzing this query. Please ensure the AI service is responsive and try again.',
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoadingChat(false);
    }
  };

  const selectedDoc = documents.find(d => d._id === selectedDocId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-bold border border-brand-400/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              ClauseGuard AI Legal Copilot
            </span>
            <span className="text-xs text-slate-400 font-mono">RAG NLP Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            AI Contract Intelligence & Negotiation Lab
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Interrogate any contract with grounded semantic search, examine clause liabilities, and simulate counter-proposals in real time.
          </p>
        </div>

        {/* Document Selector */}
        <div className="relative z-10 shrink-0">
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Active Agreement Context</label>
          <select
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
            disabled={loadingDocs || documents.length === 0}
            className="w-full sm:w-72 px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-400 backdrop-blur-md transition-all cursor-pointer truncate"
          >
            {documents.length === 0 ? (
              <option value="" className="text-slate-900">No documents found</option>
            ) : (
              documents.map(doc => (
                <option key={doc._id} value={doc._id} className="text-slate-900">
                  {doc.originalName} ({doc.overallRisk})
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Main Grid: Chat Assistant & Power Prompts Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 4 Cols: Document Overview & Power Prompts */}
        <div className="lg:col-span-4 space-y-6">
          {/* Active Document Overview Card */}
          {selectedDoc && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 truncate max-w-[200px]">
                    {selectedDoc.originalName}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    {selectedDoc.totalClauses || 0} Clauses • {selectedDoc.pageCount || 1} Pages
                  </p>
                </div>
                <RiskBadge level={selectedDoc.overallRisk} score={selectedDoc.overallScore} size="sm" />
              </div>

              {docAnalysis?.data?.summary && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 line-clamp-3 leading-relaxed">
                  {docAnalysis.data.summary}
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <Link
                  to={`/analysis/${selectedDoc._id}`}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                >
                  <span>Open Interactive Viewer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to={`/report/${selectedDoc._id}`}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Audit Report
                </Link>
              </div>
            </div>
          )}

          {/* Quick AI Power Prompts */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Instant Audit Power Prompts
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Click any verified legal query to execute instant deep semantic retrieval:
            </p>

            <div className="space-y-2">
              {POWER_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(p.prompt)}
                  disabled={loadingChat || !selectedDocId}
                  className="w-full text-left p-3 rounded-xl border border-slate-200/90 hover:border-brand-300 hover:bg-brand-50/40 transition-all text-xs group cursor-pointer disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 group-hover:text-brand-700">
                      {p.title}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-600 transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                    {p.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right 8 Cols: Interactive Chat Stream */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[750px] overflow-hidden">
          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold shadow-xs">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Contract Q&A & Legal Reasoning</h3>
                <p className="text-[11px] text-slate-500">Answers are strictly grounded in document text with citations</p>
              </div>
            </div>

            <button
              onClick={() => loadDocumentData(selectedDocId)}
              title="Clear / Reload chat"
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-slate-50/30">
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user';

              return (
                <div
                  key={idx}
                  className={`flex gap-3 text-xs leading-relaxed ${
                    isUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 shrink-0 mt-0.5 shadow-2xs">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-2xl p-4 rounded-2xl ${
                      isUser
                        ? 'bg-slate-900 text-white rounded-br-xs shadow-xs'
                        : 'bg-white border border-slate-200/90 text-slate-800 rounded-bl-xs shadow-xs space-y-3'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed font-sans">{msg.content}</p>

                    {/* Grounded Citation Sources */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-brand-600" />
                          Verified Agreement Citations ({msg.sources.length})
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {msg.sources.map((src, sIdx) => (
                            <div
                              key={sIdx}
                              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-1 hover:border-brand-300 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900 truncate max-w-[140px]">
                                  {src.heading}
                                </span>
                                <span className="text-[10px] font-mono font-bold text-slate-500 px-1.5 py-0.2 rounded bg-slate-200">
                                  P.{src.pageNumber || 1}
                                </span>
                              </div>
                              <p className="text-slate-600 line-clamp-2 italic font-legal">
                                "{src.textSnippet || src.text_snippet}"
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {msg.confidence && (
                        <span className="font-mono">Confidence: {Math.round(msg.confidence * 100)}%</span>
                      )}
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs font-bold text-xs">
                      U
                    </div>
                  )}
                </div>
              );
            })}

            {loadingChat && (
              <div className="flex gap-3 text-xs justify-start">
                <div className="w-8 h-8 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 shrink-0">
                  <Bot className="w-4 h-4 animate-bounce" />
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-600 rounded-bl-xs shadow-xs flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-600" />
                  <span>Searching ChromaDB semantic index & synthesizing response...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="p-4 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder={
                  selectedDocId
                    ? "Ask any legal question (e.g. 'What is the liability limit?' or 'Is there an NDA clause?')..."
                    : "Please upload or select a document first..."
                }
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                disabled={loadingChat || !selectedDocId}
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loadingChat || !inputQuestion.trim() || !selectedDocId}
                className="px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <span>Ask AI</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
