from typing import List, Dict, Any, Tuple

class DocumentSummarizer:
    """
    Generates plain-language executive summaries, critical findings,
    and action checklists based on parsed legal clauses and risk distributions.
    """

    @staticmethod
    def generate_summary(filename: str, overall_risk: str, overall_score: float, clauses: List[Dict[str, Any]]) -> Tuple[str, List[str], List[str]]:
        critical_clauses = [c for c in clauses if c["risk_level"] == "CRITICAL"]
        high_clauses = [c for c in clauses if c["risk_level"] == "HIGH"]
        medium_clauses = [c for c in clauses if c["risk_level"] == "MEDIUM"]
        
        categories_present = list(set(c["category"] for c in clauses))
        
        # Build plain language narrative
        summary_paragraphs = []
        
        summary_paragraphs.append(
            f"This agreement ({filename}) outlines legal terms governing user accounts, services, and responsibilities. "
            f"The automated assessment calculated an overall risk rating of {overall_risk} ({overall_score}/100) across {len(clauses)} identified sections. "
            f"The document covers key areas including {', '.join(categories_present[:5])}."
        )

        if critical_clauses or high_clauses:
            concerning_areas = list(set([c["category"] for c in critical_clauses + high_clauses]))
            summary_paragraphs.append(
                f"The analysis identified several noteworthy provisions requiring close attention, particularly in "
                f"{', '.join(concerning_areas[:4])}. Notable terms include "
                f"{'; '.join([c['risk_factors'][0] for c in (critical_clauses + high_clauses)[:3] if c.get('risk_factors')])}."
            )
        else:
            summary_paragraphs.append(
                "The analyzed clauses predominantly adhere to standard service terms with limited atypical liability or unilateral restrictions."
            )

        summary_paragraphs.append(
            "Note: This analysis is informational only and does not constitute formal legal counsel."
        )

        full_summary = "\n\n".join(summary_paragraphs)

        # Generate Key Findings
        findings = []
        for c in (critical_clauses + high_clauses):
            cat = c["category"]
            page = c["page_number"]
            for factor in c.get("risk_factors", []):
                findings.append(f"[{c['risk_level']}] {factor} (Section: '{c['heading']}', Page {page})")

        if not findings:
            for c in medium_clauses[:4]:
                findings.append(f"[{c['risk_level']}] {c['heading']} on Page {c['page_number']} involves standard {c['category']} terms.")

        # Generate Action Checklist
        checklist = []
        if any(c["category"] == "Automatic Renewal" for c in clauses):
            checklist.append("Record the subscription renewal cycle and cancellation cutoff window in your calendar.")
        if any(c["category"] == "Arbitration" for c in clauses):
            checklist.append("Determine if an opt-out mechanism for mandatory arbitration is offered within the first 30 days.")
        if any(c["category"] == "Third-Party Data Sharing" or c["category"] == "Data Collection" for c in clauses):
            checklist.append("Inspect privacy settings upon account creation to opt out of third-party advertising or telemetry.")
        if any(c["category"] == "Refund Policy" for c in clauses):
            checklist.append("Verify refund conditions before initiating transactions or annual commitments.")
        if any(c["category"] == "Termination" for c in clauses):
            checklist.append("Ensure you maintain regular external backups of your data in case of sudden account suspension.")

        if not checklist:
            checklist.append("Review terms and conditions periodically for any vendor policy amendments.")

        return full_summary, findings[:8], checklist
