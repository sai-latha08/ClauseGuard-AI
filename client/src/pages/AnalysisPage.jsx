import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documentAPI, riskAPI } from '../services/api';
import { SplitDocumentViewer } from '../components/viewer/SplitDocumentViewer';
import { ProcessingPipelineStepper } from '../components/upload/ProcessingPipelineStepper';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

export const AnalysisPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [document, setDocument] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [clauses, setClauses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDocumentData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch Document Info
      const docRes = await documentAPI.getById(id);
      if (!docRes.data?.success) {
        throw new Error('Document not found');
      }
      const docData = docRes.data.data;
      setDocument(docData);

      // If document is not completed yet, keep polling
      if (docData.status !== 'COMPLETED') {
        setLoading(false);
        return;
      }

      // Fetch Analysis & Clauses
      const [riskRes, clausesRes] = await Promise.all([
        riskAPI.getAnalysis(id),
        riskAPI.getClauses(id)
      ]);

      if (riskRes.data?.success) {
        setAnalysis(riskRes.data.data);
      }
      if (clausesRes.data?.success) {
        setClauses(clausesRes.data.data);
      }
    } catch (err) {
      console.error('Error loading analysis data:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load document analysis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocumentData();
  }, [id]);

  // Polling for documents in progress
  useEffect(() => {
    if (document && document.status !== 'COMPLETED' && document.status !== 'FAILED') {
      const interval = setInterval(async () => {
        try {
          const checkRes = await documentAPI.getById(id);
          if (checkRes.data?.success) {
            const updated = checkRes.data.data;
            setDocument(updated);
            if (updated.status === 'COMPLETED') {
              clearInterval(interval);
              fetchDocumentData();
            }
          }
        } catch (e) {
          console.warn('Polling check error:', e);
        }
      }, 2500);

      return () => clearInterval(interval);
    }
  }, [document?.status, id]);

  const handleReanalyze = async () => {
    try {
      await riskAPI.reAnalyze(id);
      setDocument(prev => ({ ...prev, status: 'PROCESSING' }));
    } catch (e) {
      alert('Failed to trigger re-analysis');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          <span className="text-xs font-semibold text-slate-700">Loading document intelligence...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-2xl border border-red-200 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Analysis Unavailable</h3>
        <p className="text-xs text-slate-500">{error}</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
      </div>
    );
  }

  if (document && document.status !== 'COMPLETED') {
    return (
      <div className="max-w-2xl mx-auto my-12 px-4">
        <ProcessingPipelineStepper
          status={document.status}
          onComplete={fetchDocumentData}
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      <SplitDocumentViewer
        document={document}
        analysis={analysis}
        clauses={clauses}
        onReanalyze={handleReanalyze}
      />
    </div>
  );
};
