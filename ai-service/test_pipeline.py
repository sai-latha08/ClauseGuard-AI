import sys
import os

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(base_dir, 'ai-service'))
from app.utils.extractor import DocumentExtractor
from app.utils.segmenter import ClauseSegmenter
from app.pipelines.classifier import ClauseClassifier
from app.pipelines.risk_analyzer import RiskAnalyzer
from app.services.summarizer import DocumentSummarizer

sample_path = os.path.join(base_dir, 'sample-docs', 'sample_terms_and_conditions.txt')
pages = DocumentExtractor.extract(sample_path)
clauses = ClauseSegmenter.segment_pages(pages)
print(f"Extraction successful: {len(pages)} pages, {len(clauses)} clauses parsed.\n")

processed = []
for c in clauses:
    cat, conf = ClauseClassifier.classify(c['heading'], c['text'])
    risk = RiskAnalyzer.analyze_clause(c['heading'], c['text'], cat)
    c_info = {
        "clause_id": c["clause_id"],
        "clause_number": c["clause_number"],
        "heading": c["heading"],
        "text": c["text"],
        "page_number": c["page_number"],
        "category": cat,
        "risk_level": risk["risk_level"],
        "risk_score": risk["risk_score"],
        "confidence": conf,
        "risk_factors": risk["risk_factors"],
        "detected_snippet": risk["detected_snippet"],
        "why_it_matters": risk["why_it_matters"],
        "recommendation": risk["recommendation"]
    }
    processed.append(c_info)
    print(f"[{risk['risk_level']}] {c['heading']} -> Category: {cat} (Score: {risk['risk_score']})")

overall_score, overall_level, counts = RiskAnalyzer.compute_overall_document_risk(processed)
print(f"\nOverall Document Risk: {overall_level} ({overall_score}/100)")
print(f"Risk Counts: {counts}")

summary, findings, checklist = DocumentSummarizer.generate_summary(
    "CloudSphere_Terms_and_Conditions.txt",
    overall_level,
    overall_score,
    processed
)

print(f"\nExecutive Summary:\n{summary}\n")
print(f"Key Findings ({len(findings)}):")
for f in findings:
    print(f" - {f}")

print(f"\nChecklist ({len(checklist)}):")
for item in checklist:
    print(f" [x] {item}")
