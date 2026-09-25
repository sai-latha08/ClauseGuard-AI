import os
import uvicorn
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, List

from app.models.schemas import (
    DocumentProcessRequest,
    DocumentProcessResponse,
    QARequest,
    QAResponse,
    SummarizeRequest,
    SummarizeResponse,
    RedraftRequest,
    RedraftResponse,
    ClauseItem,
    RiskDistribution,
    ComplianceMatrix
)
from app.utils.extractor import DocumentExtractor
from app.utils.segmenter import ClauseSegmenter
from app.pipelines.classifier import ClauseClassifier
from app.pipelines.risk_analyzer import RiskAnalyzer
from app.services.vector_store import VectorStoreManager
from app.services.summarizer import DocumentSummarizer
from app.services.qa_engine import QAEngine
from app.services.redraft_engine import ClauseRedraftEngine
from app.services.milestone_extractor import MilestoneExtractor

app = FastAPI(
    title="ClauseGuard AI Engine",
    description="Intelligent Terms and Conditions Risk Analysis NLP Microservice",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory fast cache of processed clauses per document_id
_DOCUMENT_CACHE: Dict[str, List[Dict[str, Any]]] = {}

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "clauseguard-ai-engine",
        "version": "1.0.0"
    }

@app.post("/api/v1/process-document", response_model=DocumentProcessResponse)
def process_document(payload: DocumentProcessRequest):
    """
    Complete analysis pipeline:
    1. Extract text from PDF / DOCX / TXT with page tracking
    2. Segment clauses
    3. Categorize each clause into 16 categories
    4. Compute risk factors, scores, compliance tags, and legal explanations
    5. Compute overall document risk score and compliance matrix
    6. Generate executive summary, findings, and checklist
    7. Extract milestone dates, auto-renewal deadlines, and 60-second executive voice script
    8. Embed and index clauses into ChromaDB
    """
    file_path = payload.file_path
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"File not found on server: {file_path}")

    try:
        pages_data = DocumentExtractor.extract(file_path)
        page_count = len(pages_data)
        
        raw_clauses = ClauseSegmenter.segment_pages(pages_data)
        
        if not raw_clauses:
            raise HTTPException(status_code=422, detail="No readable text or clauses could be extracted from this document.")

        processed_clauses: List[ClauseItem] = []
        category_distribution: Dict[str, int] = {}
        cached_clauses_for_qa = []
        full_text_accumulator = []

        for c in raw_clauses:
            full_text_accumulator.append(c["text"])
            category, cat_confidence = ClauseClassifier.classify(c["heading"], c["text"])
            category_distribution[category] = category_distribution.get(category, 0) + 1

            risk_eval = RiskAnalyzer.analyze_clause(c["heading"], c["text"], category)

            clause_obj = ClauseItem(
                clause_id=c["clause_id"],
                clause_number=c["clause_number"],
                heading=c["heading"],
                text=c["text"],
                page_number=c["page_number"],
                char_start=c["char_start"],
                char_end=c["char_end"],
                category=category,
                risk_level=risk_eval["risk_level"],
                risk_score=risk_eval["risk_score"],
                confidence=cat_confidence,
                risk_factors=risk_eval["risk_factors"],
                detected_snippet=risk_eval["detected_snippet"],
                why_it_matters=risk_eval["why_it_matters"],
                recommendation=risk_eval["recommendation"],
                compliance_tags=risk_eval.get("compliance_tags", [])
            )
            processed_clauses.append(clause_obj)
            cached_clauses_for_qa.append(clause_obj.model_dump())

        full_doc_text = " ".join(full_text_accumulator)

        # Overall risk calculation
        overall_score, overall_level, risk_counts = RiskAnalyzer.compute_overall_document_risk(cached_clauses_for_qa)

        # Compliance Matrix calculation (GDPR, CCPA, EU AI Act, SOC 2)
        compliance_dict = RiskAnalyzer.compute_compliance_matrix(cached_clauses_for_qa)
        compliance_obj = ComplianceMatrix(**compliance_dict)

        # Plain-language summary & findings
        summary_text, findings, checklist = DocumentSummarizer.generate_summary(
            filename=payload.filename,
            overall_risk=overall_level,
            overall_score=overall_score,
            clauses=cached_clauses_for_qa
        )

        # Milestone & Auto-Renewal extraction + Executive Audio Script
        milestone_data = MilestoneExtractor.extract_milestones(
            full_text=full_doc_text,
            clauses=cached_clauses_for_qa,
            risk_score=int(overall_score),
            doc_name=payload.filename
        )

        # ChromaDB Indexing
        vector_mgr = VectorStoreManager.get_instance()
        vector_mgr.index_document(payload.document_id, cached_clauses_for_qa)
        _DOCUMENT_CACHE[payload.document_id] = cached_clauses_for_qa

        return DocumentProcessResponse(
            document_id=payload.document_id,
            filename=payload.filename,
            page_count=page_count,
            total_clauses=len(processed_clauses),
            overall_score=overall_score,
            overall_risk=overall_level,
            risk_distribution=RiskDistribution(**risk_counts),
            category_distribution=category_distribution,
            compliance_matrix=compliance_obj,
            summary=summary_text,
            key_findings=findings,
            action_checklist=checklist,
            clauses=processed_clauses,
            milestones=milestone_data.get("milestones", []),
            renewal_info={
                "isAutoRenew": milestone_data.get("isAutoRenew", False),
                "noticePeriodDays": milestone_data.get("noticePeriodDays", 0),
                "termDuration": milestone_data.get("termDuration", "12 Months"),
                "paymentTerms": milestone_data.get("paymentTerms", "Standard"),
                "effectiveDate": milestone_data.get("effectiveDate", ""),
                "renewalCutoffDate": milestone_data.get("renewalCutoffDate"),
                "expirationDate": milestone_data.get("expirationDate", "")
            },
            executive_voice_script=milestone_data.get("executiveVoiceScript"),
            estimated_audio_duration_seconds=milestone_data.get("estimatedAudioDurationSeconds", 55),
            status="COMPLETED"
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Document processing failed: {str(e)}")

@app.post("/api/v1/query", response_model=QAResponse)
def query_document(payload: QARequest):
    """
    RAG Semantic retrieval + Grounded Q&A response generator.
    """
    doc_id = payload.document_id
    clauses = _DOCUMENT_CACHE.get(doc_id, [])

    vector_mgr = VectorStoreManager.get_instance()
    matched_sources = vector_mgr.search(doc_id, payload.question, clauses, top_k=payload.top_k)

    answer, confidence, citations = QAEngine.answer_question(payload.question, matched_sources)

    return QAResponse(
        document_id=doc_id,
        question=payload.question,
        answer=answer,
        confidence=confidence,
        sources=citations
    )

@app.post("/api/v1/redraft-clause", response_model=RedraftResponse)
def redraft_clause(payload: RedraftRequest):
    """
    Generates balanced, bilateral redline alternative and negotiation counter-proposal.
    """
    result = ClauseRedraftEngine.redraft_clause(
        heading=payload.heading,
        original_text=payload.text,
        category=payload.category,
        risk_level=payload.risk_level,
        risk_factors=payload.risk_factors
    )
    return RedraftResponse(**result)

@app.post("/api/v1/summarize", response_model=SummarizeResponse)
def summarize_clauses(payload: SummarizeRequest):
    clauses_dict = [c.model_dump() for c in payload.clauses]
    overall_score, overall_level, _ = RiskAnalyzer.compute_overall_document_risk(clauses_dict)
    summary_text, findings, checklist = DocumentSummarizer.generate_summary(
        filename="Document",
        overall_risk=overall_level,
        overall_score=overall_score,
        clauses=clauses_dict
    )
    return SummarizeResponse(
        document_id=payload.document_id,
        summary=summary_text,
        key_findings=findings,
        action_checklist=checklist
    )

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
