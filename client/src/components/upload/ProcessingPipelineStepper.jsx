import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, FileSearch, ShieldAlert, Cpu, Sparkles } from 'lucide-react';

export const ProcessingPipelineStepper = ({ status = 'PROCESSING', onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { title: 'Uploading Document', desc: 'Validating payload and securing file storage', icon: FileSearch },
    { title: 'Extracting Text & Coordinates', desc: 'PyMuPDF text extraction with OCR fallback', icon: Cpu },
    { title: 'Segmenting Legal Clauses', desc: 'Parsing numbered sections and headings', icon: Cpu },
    { title: 'Taxonomy Classification & Risk Scoring', desc: '16-Category legal classification & explainability', icon: ShieldAlert },
    { title: 'Vector Indexing & Summary Synthesis', desc: 'ChromaDB embeddings & executive summary', icon: Sparkles },
  ];

  useEffect(() => {
    if (status === 'COMPLETED') {
      setCurrentStep(steps.length);
      if (onComplete) onComplete();
      return;
    }

    if (status === 'UPLOADING') {
      setCurrentStep(0);
    } else if (status === 'PROCESSING') {
      setCurrentStep(1);
      const timer1 = setTimeout(() => setCurrentStep(2), 1200);
      const timer2 = setTimeout(() => setCurrentStep(3), 2600);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    } else if (status === 'ANALYZING') {
      setCurrentStep(3);
      const timer = setTimeout(() => setCurrentStep(4), 1500);
      return () => clearTimeout(timer);
    }
  }, [status]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm max-w-xl mx-auto">
      <div className="flex items-center justify-between pb-5 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-900 text-lg">AI Analysis Pipeline</h3>
          <p className="text-xs text-slate-500 mt-0.5">Real-time legal document NLP execution</p>
        </div>
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-brand-50 text-brand-700 border border-brand-200 animate-pulse">
          Active Pipeline
        </span>
      </div>

      <div className="mt-6 space-y-4">
        {steps.map((step, idx) => {
          const isDone = currentStep > idx || status === 'COMPLETED';
          const isCurrent = currentStep === idx && status !== 'COMPLETED';
          const Icon = step.icon;

          return (
            <div
              key={idx}
              className={`flex items-start gap-3.5 p-3 rounded-xl transition-colors ${
                isCurrent ? 'bg-brand-50/60 border border-brand-200' : isDone ? 'bg-slate-50/70' : 'opacity-40'
              }`}
            >
              <div className="mt-0.5">
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : isCurrent ? (
                  <Loader2 className="w-5 h-5 text-brand-600 animate-spin" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-400">
                    {idx + 1}
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className={`text-sm font-semibold ${isCurrent ? 'text-brand-900' : isDone ? 'text-slate-800' : 'text-slate-500'}`}>
                    {step.title}
                  </h4>
                  {isDone && <span className="text-[11px] font-medium text-emerald-600">Complete</span>}
                  {isCurrent && <span className="text-[11px] font-medium text-brand-600">Processing...</span>}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
