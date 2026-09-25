import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UploadCloud, FileText, AlertCircle, Sparkles, CheckCircle2, 
  ArrowRight, Clipboard, ShieldCheck, FileCode, Check, RefreshCw 
} from 'lucide-react';
import { documentAPI } from '../../services/api';
import { ProcessingPipelineStepper } from './ProcessingPipelineStepper';

const SAMPLE_PRESETS = [
  {
    title: 'CloudSphere SaaS Standard Terms',
    text: `CLOUDSPHERE SERVICES - STANDARD TERMS AND CONDITIONS (2026)

1. INTRODUCTION AND ACCEPTANCE
By accessing, registering for, or using the CloudSphere SaaS Platform, you agree to be bound by these Terms and Conditions. If you do not agree, you must immediately cease all access.

2. SUBSCRIPTION BILLING AND AUTO-RENEWAL
All subscriptions automatically renew at the expiration of each billing cycle for consecutive periods equal to the initial term unless cancelled at least forty-eight (48) hours prior to the renewal date. CloudSphere reserves the right to increase subscription fees upon thirty (30) days' notice.

3. STRICT NO-REFUND POLICY
All fees and recurring charges paid hereunder are strictly non-refundable under all circumstances, including partial usage, service downtime, or early account termination.

4. UNILATERAL MODIFICATION OF TERMS
CloudSphere reserves the right to amend, update, or replace these Terms at any time in its sole discretion without prior written notice to you. Continued use of the Services after modifications constitutes full acceptance of the updated Terms.

5. THIRD-PARTY DATA MONETIZATION AND COMMERCIAL SHARING
You hereby grant CloudSphere permission to collect, analyze, and share aggregated telemetry, device identifiers, and user data with third-party commercial partners, marketing affiliates, and advertising networks for targeted profiling and commercial analytics.

6. USER CONTENT LICENSE
You grant CloudSphere a perpetual, irrevocable, worldwide, royalty-free, transferable license to host, copy, modify, distribute, publish, and commercially exploit any data, prompts, or content uploaded or generated through the Services.

7. ACCOUNT TERMINATION AND SUSPENSION
CloudSphere may terminate or suspend your account, delete your stored data, and restrict access to all Services at any time at our sole discretion without prior notice or liability.

8. DISCLAIMER OF WARRANTIES AND LIMITATION OF LIABILITY
THE SERVICES ARE PROVIDED ON AN "AS-IS" AND "AS-AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND. IN NO EVENT SHALL CLOUDSPHERE'S AGGREGATE LIABILITY EXCEED THE TOTAL AMOUNT ACTUALLY PAID BY YOU IN THE PAST THREE (3) MONTHS OR FIFTY DOLLARS ($50.00), WHICHEVER IS LESS.

9. BROAD INDEMNIFICATION
You agree to indemnify, defend, and hold harmless CloudSphere, its directors, employees, and affiliates against any and all claims, damages, liabilities, costs, and legal fees arising from your use of the Services or violation of these Terms.

10. MANDATORY ARBITRATION AND CLASS ACTION WAIVER
ALL DISPUTES ARISING OUT OF THIS AGREEMENT SHALL BE RESOLVED EXCLUSIVELY THROUGH FINAL AND BINDING ARBITRATION ADMINISTERED BY THE AMERICAN ARBITRATION ASSOCIATION. YOU EXPRESSLY WAIVE ANY RIGHT TO PARTICIPATE IN A CLASS ACTION LAWSUIT OR JURY TRIAL.`
  },
  {
    title: 'Privacy Policy & AI Training Addendum',
    text: `DATA PRIVACY AND AI SYSTEM TRAINING AGREEMENT

1. DATA COLLECTION AND TELEMETRY
We gather personal information including full name, email, IP addresses, geolocation data, and browsing behavior across third-party web domains.

2. MACHINE LEARNING & AI MODEL TRAINING
You acknowledge and consent that all customer inputs, prompts, uploaded confidential documents, and feedback may be processed, ingested, and utilized to train, fine-tune, and optimize internal and commercial artificial intelligence algorithms without compensation.

3. OPT-OUT AND DATA DELETION REQUESTS
While users may submit deletion requests, the Company reserves the right to retain anonymized embeddings and derivative model weights derived from user data indefinitely.`
  }
];

export const DocumentUploader = () => {
  const [activeMode, setActiveMode] = useState('upload'); // 'upload' or 'paste'
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [pastedTitle, setPastedTitle] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [isEphemeral, setIsEphemeral] = useState(false);
  
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState('IDLE'); // IDLE, UPLOADING, PROCESSING, COMPLETED, ERROR
  const [errorMsg, setErrorMsg] = useState(null);
  const [createdDocId, setCreatedDocId] = useState(null);
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFile = (selectedFile) => {
    setErrorMsg(null);
    const validExts = ['.pdf', '.docx', '.doc', '.txt', '.md'];
    const ext = '.' + selectedFile.name.split('.').pop().toLowerCase();
    if (!validExts.includes(ext)) {
      setErrorMsg(`Invalid file type "${ext}". Supported formats: PDF, DOCX, TXT.`);
      return false;
    }
    if (selectedFile.size > 15 * 1024 * 1024) {
      setErrorMsg('File size exceeds the 15MB limit.');
      return false;
    }
    return true;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (validateFile(selected)) {
        setFile(selected);
      }
    }
  };

  const handleUploadFile = async () => {
    if (!file) return;

    setStatus('UPLOADING');
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('isEphemeral', isEphemeral);

    try {
      const res = await documentAPI.upload(formData, (percent) => {
        setUploadProgress(percent);
      });

      if (res.data?.success) {
        const docId = res.data.data._id;
        setCreatedDocId(docId);
        setStatus('PROCESSING');
        pollStatus(docId);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setStatus('ERROR');
      setErrorMsg(err.response?.data?.message || err.message || 'Upload failed. Please try again.');
    }
  };

  const handleAnalyzePastedText = async () => {
    if (!pastedText.trim() || pastedText.trim().length < 20) {
      setErrorMsg('Please paste at least 20 characters of Terms and Conditions text.');
      return;
    }

    setStatus('PROCESSING');
    setErrorMsg(null);

    try {
      const res = await documentAPI.paste({
        title: pastedTitle.trim() || 'Pasted_Agreement_' + Date.now(),
        text: pastedText.trim(),
        isEphemeral: isEphemeral
      });

      if (res.data?.success) {
        const docId = res.data.data._id;
        setCreatedDocId(docId);
        pollStatus(docId);
      }
    } catch (err) {
      console.error('Paste analysis failed:', err);
      setStatus('ERROR');
      setErrorMsg(err.response?.data?.message || err.message || 'Analysis initiation failed.');
    }
  };

  const handleLoadDemo = async () => {
    setStatus('PROCESSING');
    setErrorMsg(null);
    try {
      const res = await documentAPI.loadDemo();
      if (res.data?.success) {
        const docId = res.data.data._id;
        setCreatedDocId(docId);
        pollStatus(docId);
      }
    } catch (err) {
      setStatus('ERROR');
      setErrorMsg('Could not load sample document. Please try uploading or pasting manually.');
    }
  };

  const applyPreset = (preset) => {
    setPastedTitle(preset.title);
    setPastedText(preset.text);
    setErrorMsg(null);
  };

  const pollStatus = (docId) => {
    const interval = setInterval(async () => {
      try {
        const res = await documentAPI.getById(docId);
        if (res.data?.success) {
          const doc = res.data.data;
          if (doc.status === 'COMPLETED') {
            setStatus('COMPLETED');
            clearInterval(interval);
            setTimeout(() => {
              navigate(`/analysis/${docId}`);
            }, 1000);
          } else if (doc.status === 'FAILED') {
            setStatus('ERROR');
            setErrorMsg(doc.errorMessage || 'Analysis failed. Please try a different format.');
            clearInterval(interval);
          }
        }
      } catch (e) {
        console.warn('Polling error:', e.message);
      }
    }, 1500);
  };

  if (status === 'PROCESSING' || status === 'UPLOADING' || status === 'COMPLETED') {
    return (
      <div className="py-8">
        <ProcessingPipelineStepper
          status={status}
          onComplete={() => {
            if (createdDocId) {
              setTimeout(() => navigate(`/analysis/${createdDocId}`), 600);
            }
          }}
        />
        {status === 'COMPLETED' && (
          <div className="text-center mt-6">
            <button
              onClick={() => navigate(`/analysis/${createdDocId}`)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 text-white font-semibold text-sm shadow-md hover:bg-brand-700 transition-colors cursor-pointer"
            >
              <span>View Interactive Risk Breakdown</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Mode Switcher Tabs */}
      <div className="flex p-1.5 bg-slate-200/80 rounded-2xl shadow-inner max-w-md mx-auto">
        <button
          onClick={() => { setActiveMode('upload'); setErrorMsg(null); }}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeMode === 'upload'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UploadCloud className="w-4 h-4 text-brand-600" />
          <span>Upload File (PDF/DOCX)</span>
        </button>

        <button
          onClick={() => { setActiveMode('paste'); setErrorMsg(null); }}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeMode === 'paste'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clipboard className="w-4 h-4 text-brand-600" />
          <span>Paste Agreement Text</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-sm">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {activeMode === 'upload' ? 'Upload Legal Agreement' : 'Paste Terms & Conditions Text'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-lg mx-auto">
            {activeMode === 'upload'
              ? 'Upload your PDF, DOCX, or text contract for automated AI clause segmentation and risk scoring.'
              : 'Directly paste any contract, terms of service, or privacy policy for instant NLP risk audit.'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Notice</p>
              <p className="mt-0.5 text-red-600">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* MODE 1: FILE UPLOAD */}
        {activeMode === 'upload' && (
          <div className="space-y-6">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-brand-500 bg-brand-50/60 scale-[1.01]'
                  : file
                  ? 'border-emerald-400 bg-emerald-50/20'
                  : 'border-slate-300 hover:border-brand-400 hover:bg-slate-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt,.md"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex flex-col items-center justify-center">
                {file ? (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-3 shadow-inner">
                      <FileText className="w-8 h-8" />
                    </div>
                    <span className="font-semibold text-slate-900 text-sm">{file.name}</span>
                    <span className="text-xs text-slate-500 mt-0.5">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                    <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full mt-2">
                      Ready to analyze
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 mb-3">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <p className="font-semibold text-slate-800 text-sm">
                      Click to browse or drag and drop your document here
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Supports PDF, DOCX, TXT (up to 15MB)</p>
                  </>
                )}
              </div>
            </div>

            {/* Zero-Data-Retention NDA Mode */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isEphemeral}
                  onChange={(e) => setIsEphemeral(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    Confidential NDA Mode (Zero Data Retention)
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Immediately purges raw document files from server disk upon analysis completion.
                  </p>
                </div>
              </label>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                PRIVACY
              </span>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={handleUploadFile}
                disabled={!file}
                className={`w-full sm:flex-1 py-3 px-5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm ${
                  file
                    ? 'bg-brand-600 text-white hover:bg-brand-700 cursor-pointer'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Start Full Risk Audit</span>
              </button>

              <button
                type="button"
                onClick={handleLoadDemo}
                className="w-full sm:w-auto py-3 px-4 rounded-xl font-semibold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Try Demo Sample Agreement</span>
              </button>
            </div>
          </div>
        )}

        {/* MODE 2: DIRECT PASTE TEXT */}
        {activeMode === 'paste' && (
          <div className="space-y-5">
            {/* Quick Preset Buttons */}
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Quick Sample Presets:
              </span>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-300 border border-slate-200 font-medium text-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileCode className="w-3.5 h-3.5 text-brand-600" />
                    <span>{p.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Agreement Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Agreement / Company Name (Optional)
              </label>
              <input
                type="text"
                value={pastedTitle}
                onChange={(e) => setPastedTitle(e.target.value)}
                placeholder="e.g. Acme SaaS Terms of Service 2026"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
              />
            </div>

            {/* Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Terms & Conditions Text
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {pastedText.length} characters • ~{Math.round(pastedText.split(/\s+/).filter(Boolean).length)} words
                </span>
              </div>
              <textarea
                rows={12}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste the full contract, Terms of Service, or End User License Agreement text here..."
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-legal leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white resize-y"
              />
            </div>

            {/* Zero-Data-Retention NDA Mode */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isEphemeral}
                  onChange={(e) => setIsEphemeral(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    Confidential NDA Mode (Zero Data Retention)
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Purges raw text from disk immediately after AI segmentation and scoring.
                  </p>
                </div>
              </label>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                PRIVACY
              </span>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                onClick={handleAnalyzePastedText}
                disabled={!pastedText.trim()}
                className={`w-full py-3.5 px-5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm ${
                  pastedText.trim()
                    ? 'bg-brand-600 text-white hover:bg-brand-700 cursor-pointer shadow-md'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Audit Pasted Terms & Conditions</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
