import React from 'react';
import { Logo } from './Logo';
import { ShieldCheck, Cpu } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-burgundy-950 text-cream-200 border-t border-burgundy-900 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <Logo size="md" light={true} />
            <p className="mt-3 text-xs text-cream-300/80 max-w-sm leading-relaxed">
              ClauseGuard AI empowers consumers and legal professionals with deep NLP clause segmentation, risk categorization, and plain-language legal clarity.
            </p>
            <div className="flex items-center gap-4 mt-4 text-xs text-cream-400">
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-cream-300" /> Private & Secure</span>
              <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-cream-300" /> LegalBERT & ChromaDB</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-cream-100 mb-3">Capabilities</h4>
            <ul className="space-y-2 text-xs text-cream-300/70">
              <li>Automatic Renewal Risk Detection</li>
              <li>Arbitration & Waiver Analysis</li>
              <li>Third-Party Data Sharing Audit</li>
              <li>Perpetual IP License Flagging</li>
              <li>Document RAG Q&A Assistant</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-cream-100 mb-3">Legal & Trust</h4>
            <p className="text-[11px] leading-relaxed text-cream-300/70">
              ClauseGuard AI provides informational analysis and is not a law firm or substitute for an attorney. Always consult qualified legal counsel for binding contract decisions.
            </p>
          </div>
        </div>

        <div className="border-t border-burgundy-900 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-cream-400/60">
          <p>© {new Date().getFullYear()} ClauseGuard AI. Built for explainable contract intelligence.</p>
          <div className="flex items-center gap-4 mt-2 sm:mt-0">
            <span>Terms of Service</span>
            <span>Privacy Policy</span>
            <span>Security</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
