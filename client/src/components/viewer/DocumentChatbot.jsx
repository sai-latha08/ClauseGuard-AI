import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, Loader2, BookOpen, AlertCircle, FileSearch } from 'lucide-react';
import { qaAPI } from '../../services/api';

export const DocumentChatbot = ({ documentId, onSelectClause }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const sampleQuestions = [
    "Can this company automatically renew my subscription?",
    "Can they share or sell my personal data with third parties?",
    "What are the refund terms if I cancel?",
    "Do I waive my right to a jury trial or class action?"
  ];

  useEffect(() => {
    // Load chat history for this document
    const fetchHistory = async () => {
      try {
        const res = await qaAPI.getHistory(documentId);
        if (res.data?.success && res.data.data.length > 0) {
          setMessages(res.data.data);
        } else {
          setMessages([
            {
              role: 'assistant',
              content: 'Hello! I am your ClauseGuard Document Assistant. Ask me any question regarding this agreement, and I will find the exact clauses and cite page references.',
              sources: []
            }
          ]);
        }
      } catch (e) {
        console.warn('Could not load chat history:', e.message);
      }
    };

    fetchHistory();
  }, [documentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (questionText = input) => {
    const q = (questionText || '').trim();
    if (!q || loading) return;

    setInput('');
    // Optimistically add user message
    const userMsg = { role: 'user', content: q, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await qaAPI.ask(documentId, q);
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
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an issue retrieving information from the document. Please try again.',
          sources: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-sm">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Contract RAG Assistant</h3>
            <p className="text-[11px] text-slate-500">Grounded strictly in the uploaded document</p>
          </div>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-brand-100 text-brand-700">
          ChromaDB Semantic
        </span>
      </div>

      {/* Quick Prompts */}
      {messages.length <= 1 && (
        <div className="p-4 bg-brand-50/40 border-b border-brand-100/60">
          <p className="text-xs font-semibold text-brand-900 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            Suggested Questions:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {sampleQuestions.map((sq, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(sq)}
                className="text-[11px] text-slate-700 bg-white hover:bg-brand-50 hover:text-brand-700 border border-slate-200 rounded-lg px-2.5 py-1 text-left transition-colors"
              >
                {sq}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-navy-900 text-white rounded-tr-none'
                  : 'bg-slate-100/90 text-slate-800 rounded-tl-none border border-slate-200'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>

              {/* Source Citations */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1 mb-1.5">
                    <BookOpen className="w-3 h-3 text-brand-600" />
                    Cited Sources ({msg.sources.length}):
                  </span>
                  <div className="space-y-1.5">
                    {msg.sources.map((src, sIdx) => (
                      <div
                        key={sIdx}
                        onClick={() => onSelectClause && onSelectClause(src.clauseId)}
                        className="p-2 rounded-lg bg-white border border-slate-200 hover:border-brand-400 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between text-[10px] font-semibold text-brand-700 mb-0.5">
                          <span>{src.heading || `Clause ${src.clauseNumber}`}</span>
                          <span className="text-slate-400">Page {src.pageNumber}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-2 italic font-legal">
                          "{src.textSnippet}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl rounded-tl-none bg-slate-100 border border-slate-200 flex items-center gap-2 text-xs text-slate-600">
              <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
              <span>Retrieving clause evidence & synthesizing answer...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about this agreement..."
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2.5 rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
