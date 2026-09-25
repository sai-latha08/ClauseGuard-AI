from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ClauseItem(BaseModel):
    clause_id: str
    clause_number: str
    heading: str
    text: str
    page_number: int
    char_start: int = 0
    char_end: int = 0
    category: str
    risk_level: str  # LOW, MEDIUM, HIGH, CRITICAL
    risk_score: float  # 0.0 - 100.0
    confidence: float  # 0.0 - 1.0
    risk_factors: List[str] = Field(default_factory=list)
    detected_snippet: Optional[str] = None
    why_it_matters: Optional[str] = None
    recommendation: Optional[str] = None
    compliance_tags: List[str] = Field(default_factory=list)

class RiskDistribution(BaseModel):
    critical: int = 0
    high: int = 0
    medium: int = 0
    low: int = 0

class ComplianceMatrix(BaseModel):
    gdpr_status: str = "NON-COMPLIANT" # COMPLIANT, REVIEW_NEEDED, NON-COMPLIANT
    gdpr_score: float = 0.0
    ccpa_status: str = "NON-COMPLIANT"
    ccpa_score: float = 0.0
    eu_ai_act_status: str = "REVIEW_NEEDED"
    soc2_status: str = "REVIEW_NEEDED"
    flagged_clauses_count: int = 0

class MilestoneItem(BaseModel):
    id: str
    title: str
    dateString: str
    category: str
    daysFromNow: int = 0
    urgency: str = "INFO" # INFO, LOW, MEDIUM, HIGH, CRITICAL
    description: str
    actionRequired: str

class RenewalInfo(BaseModel):
    isAutoRenew: bool = False
    noticePeriodDays: int = 0
    termDuration: str = "12 Months"
    paymentTerms: str = "Standard"
    effectiveDate: str
    renewalCutoffDate: Optional[str] = None
    expirationDate: str

class DocumentProcessRequest(BaseModel):
    document_id: str
    file_path: str
    filename: str

class DocumentProcessResponse(BaseModel):
    document_id: str
    filename: str
    page_count: int
    total_clauses: int
    overall_score: float
    overall_risk: str
    risk_distribution: RiskDistribution
    category_distribution: Dict[str, int]
    compliance_matrix: Optional[ComplianceMatrix] = None
    summary: str
    key_findings: List[str]
    action_checklist: List[str]
    clauses: List[ClauseItem]
    milestones: List[MilestoneItem] = Field(default_factory=list)
    renewal_info: Optional[RenewalInfo] = None
    executive_voice_script: Optional[str] = None
    estimated_audio_duration_seconds: int = 55
    status: str

class QARequest(BaseModel):
    document_id: str
    question: str
    top_k: int = 4

class CitationSource(BaseModel):
    clause_id: str
    clause_number: str
    heading: str
    page_number: int
    text_snippet: str
    category: str
    risk_level: str
    similarity_score: float

class QAResponse(BaseModel):
    document_id: str
    question: str
    answer: str
    confidence: float
    sources: List[CitationSource]

class SummarizeRequest(BaseModel):
    document_id: str
    clauses: List[ClauseItem]

class SummarizeResponse(BaseModel):
    document_id: str
    summary: str
    key_findings: List[str]
    action_checklist: List[str]

class RedraftRequest(BaseModel):
    heading: str
    text: str
    category: str
    risk_level: str = "HIGH"
    risk_factors: List[str] = Field(default_factory=list)

class RedraftResponse(BaseModel):
    heading: str
    original_text: str
    category: str
    risk_level: str
    proposed_text: str
    rationale: str
    key_changes: List[str]
    negotiation_tip: str
    compliance_tags: List[str]
