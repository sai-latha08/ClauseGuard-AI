import re
from typing import Dict, Any, List, Tuple

# Comprehensive risk rules with robust semantic regex patterns and structured explanations
RISK_RULES = [
    # CRITICAL RISKS (76 - 100)
    {
        "id": "UNILATERAL_TERMINATION_NO_NOTICE",
        "category": "Termination",
        "pattern": r"(?:terminate|cancel|suspend)[\s\S]{0,80}(?:account|access|service)[\s\S]{0,80}(?:without\s+(?:prior\s+)?notice|sole\s+discretion|immediately\s+without)",
        "base_score": 85.0,
        "level": "CRITICAL",
        "factor": "Unilateral account termination without prior notice or cause",
        "why_it_matters": "The service provider may terminate your access or delete your account immediately without warning, potentially causing sudden loss of data or access to paid features.",
        "recommendation": "Consider reviewing backup policies and checking if data export is guaranteed upon sudden termination.",
        "compliance": ["GDPR Art. 20 (Data Portability)", "Fair Trade Standards"]
    },
    {
        "id": "CLASS_ACTION_JURY_WAIVER",
        "category": "Arbitration",
        "pattern": r"(?:waive|waiver)[\s\S]{0,60}(?:class\s+action|jury\s+trial)|binding\s+(?:individual\s+)?arbitration|american\s+arbitration\s+association",
        "base_score": 82.0,
        "level": "CRITICAL",
        "factor": "Mandatory binding arbitration and class action waiver",
        "why_it_matters": "You surrender your right to bring claims in a public court of law or participate in collective legal class actions against the provider.",
        "recommendation": "Check if an opt-out window (e.g., within 30 days of registration) is available.",
        "compliance": ["Consumer Due Process", "US Federal Arbitration Act"]
    },
    {
        "id": "SELL_OR_SHARE_PERSONAL_DATA",
        "category": "Third-Party Data Sharing",
        "pattern": r"(?:share|sell|disclose|transfer)[\s\S]{0,60}(?:personal\s+(?:data|information)|user\s+data)[\s\S]{0,60}(?:third-party|third\s+parties|partners|affiliates|commercial|profiling|advertising)",
        "base_score": 80.0,
        "level": "CRITICAL",
        "factor": "Broad commercial sharing or monetization of personal data with third parties",
        "why_it_matters": "The company may transfer or share your private information with external partners or ad networks for marketing and commercial profiling.",
        "recommendation": "Review privacy settings and consider submitting a formal Do Not Sell / Opt-Out request if applicable.",
        "compliance": ["GDPR Art. 6/28", "CCPA § 1798.120 (Do Not Sell)"]
    },
    {
        "id": "PERPETUAL_IRREVOCABLE_CONTENT_LICENSE",
        "category": "Content Ownership",
        "pattern": r"(?:perpetual,\s+irrevocable|worldwide,\s+royalty-free|unlimited,\s+irrevocable)[\s\S]{0,60}license[\s\S]{0,80}(?:use|reproduce|modify|distribute|exploit)",
        "base_score": 78.0,
        "level": "CRITICAL",
        "factor": "Perpetual, irrevocable license granted over user-generated content",
        "why_it_matters": "The company retains sweeping, indefinite rights to use, monetize, or alter content you create even after you close your account.",
        "recommendation": "Verify whether content rights can be retracted upon account deletion or if commercial sublicensing is intended.",
        "compliance": ["Copyright Act", "GDPR Art. 17 (Right to Erasure)"]
    },

    # HIGH RISKS (51 - 75)
    {
        "id": "AUTO_RENEWAL_RECURRING_BILLING",
        "category": "Automatic Renewal",
        "pattern": r"(?:automatic(?:ally)?\s+renew|renews\s+automatically|auto-renew|recurring\s+(?:monthly|annual|subscription))",
        "base_score": 72.0,
        "level": "HIGH",
        "factor": "Automatic subscription renewal without explicit renewal confirmation",
        "why_it_matters": "Your payment method will be charged automatically at recurring intervals unless you proactively cancel before a specific cut-off date.",
        "recommendation": "Check the exact cancellation deadline (e.g., 24-48 hours before renewal) and set a calendar reminder.",
        "compliance": ["FTC Negative Option Rule", "California Automatic Renewal Law"]
    },
    {
        "id": "UNILATERAL_AGREEMENT_CHANGES",
        "category": "User Responsibilities",
        "pattern": r"(?:modify|amend|update|change)[\s\S]{0,50}(?:terms|agreement)[\s\S]{0,80}(?:at\s+any\s+time|sole\s+discretion|without\s+(?:direct\s+|prior\s+)?notice|effective\s+immediately)",
        "base_score": 70.0,
        "level": "HIGH",
        "factor": "Unilateral modification of contract terms without direct notice",
        "why_it_matters": "The agreement terms may be altered at the provider's discretion without notifying you directly, binding you to new policies upon continued use.",
        "recommendation": "Periodically check the 'Last Updated' date or monitor service update notifications.",
        "compliance": ["EU Unfair Terms Directive 93/13/EEC"]
    },
    {
        "id": "BROAD_INDEMNIFICATION",
        "category": "Indemnification",
        "pattern": r"(?:indemnif[\w]*|hold\s+harmless)[\s\S]{0,80}(?:hold\s+harmless|defend|claims|liabilities|losses|damages)",
        "base_score": 68.0,
        "level": "HIGH",
        "factor": "Broad user indemnification and legal defense obligations",
        "why_it_matters": "You may be required to pay legal defense costs and damages incurred by the company resulting from your use or alleged violations.",
        "recommendation": "Ensure your intended use stays strictly within acceptable boundaries to avoid triggering indemnification clauses.",
        "compliance": ["Contractual Risk Allocation"]
    },
    {
        "id": "STRICT_NO_REFUNDS",
        "category": "Refund Policy",
        "pattern": r"(?:strictly\s+)?non-refundable|no\s+refunds\s+(?:or\s+credits)?|do\s+not\s+provide\s+refunds",
        "base_score": 65.0,
        "level": "HIGH",
        "factor": "Strict no-refund policy for subscription or transaction fees",
        "why_it_matters": "Payments may be forfeited even if the service encounters downtime, malfunctions, or if you cancel mid-billing cycle.",
        "recommendation": "Consider testing with a short trial or month-to-month subscription before committing to annual plans.",
        "compliance": ["EU Consumer Rights Directive (14-day Cooling Off)"]
    },
    {
        "id": "DISCLAIMER_OF_ALL_LIABILITY",
        "category": "Liability",
        "pattern": r"(?:total|aggregate)\s+liability[\s\S]{0,60}(?:shall\s+not\s+exceed|capped\s+at|limited\s+to)|in\s+no\s+event\s+shall[\s\S]{0,50}(?:liable\s+for\s+(?:any\s+)?(?:indirect|consequential|punitive))",
        "base_score": 64.0,
        "level": "HIGH",
        "factor": "Extensive limitation of company liability / minimal damage caps",
        "why_it_matters": "The company's financial responsibility is capped at a minimal sum even if their platform or security failure causes significant harm.",
        "recommendation": "Assess whether the capped liability limit matches the business criticality of the data you place on the platform.",
        "compliance": ["UCC Article 2 Standard"]
    },

    # MEDIUM RISKS (26 - 50)
    {
        "id": "THIRD_PARTY_DATA_TRACKING",
        "category": "Data Collection",
        "pattern": r"(?:analytics|telemetry|cookies|location\s+metrics|device\s+telemetry|tracking)",
        "base_score": 42.0,
        "level": "MEDIUM",
        "factor": "Telemetry, tracking technologies, and device metrics collection",
        "why_it_matters": "Your behavioral usage patterns and location metrics may be gathered for analytics.",
        "recommendation": "Check cookie consent settings and use browser privacy controls to restrict cross-site tracking.",
        "compliance": ["ePrivacy Directive", "GDPR Cookie Regulations"]
    },
    {
        "id": "AI_DATA_SCRAPING_TRAINING",
        "category": "AI & Data Usage",
        "pattern": r"(?:train|fine-tune|machine\s+learning|artificial\s+intelligence|model|algorithm)[\s\S]{0,60}(?:user\s+content|customer\s+data|inputs|prompts)",
        "base_score": 48.0,
        "level": "MEDIUM",
        "factor": "User content and inputs utilized for AI model training",
        "why_it_matters": "Your prompts, proprietary documents, or inputs may be fed into public or internal machine learning models.",
        "recommendation": "Review AI opt-out policies or utilize zero-data retention enterprise tiers.",
        "compliance": ["EU AI Act Art. 50/53", "Copyright Transparency"]
    },
    {
        "id": "EXCLUSIVE_FOREIGN_VENUE",
        "category": "Governing Law",
        "pattern": r"(?:exclusive\s+jurisdiction|governed\s+by\s+(?:and\s+construed\s+in\s+accordance\s+with\s+)?the\s+laws\s+of|venue\s+in|courts\s+located\s+in)",
        "base_score": 40.0,
        "level": "MEDIUM",
        "factor": "Exclusive governing jurisdiction and designated legal venue",
        "why_it_matters": "Any formal legal claim must be filed in the company's designated jurisdiction, which may be costly and geographically distant.",
        "recommendation": "Review the specified court location to understand where potential disputes must be handled.",
        "compliance": ["Forum Selection Enforceability"]
    },
    {
        "id": "AS_IS_WARRANTY_DISCLAIMER",
        "category": "Warranty Disclaimer",
        "pattern": r"[\"']?as\s+is[\"']?\s+and\s+[\"']?as\s+available[\"']?|without\s+warranties?\s+of\s+any\s+kind|disclaims?\s+(?:all\s+)?warranties",
        "base_score": 38.0,
        "level": "MEDIUM",
        "factor": "'As-is' warranty disclaimer with no guarantee of uninterrupted uptime or error-free operation",
        "why_it_matters": "The provider does not guarantee continuous service availability, security, or error-free functionality.",
        "recommendation": "Maintain local offline backups of any critical files or outputs generated by the service.",
        "compliance": ["UCC Implied Warranty Disclaimer"]
    }
]

class RiskAnalyzer:
    """
    Analyzes clauses for risk levels, scoring, factors, compliance impact, and plain-language explanations.
    """

    @staticmethod
    def analyze_clause(heading: str, text: str, category: str) -> Dict[str, Any]:
        combined = f"{heading} {text}"
        detected_factors = []
        matched_rules = []
        highest_score = 10.0
        snippet = None
        why_it_matters = None
        recommendation = None
        compliance_tags = []

        for rule in RISK_RULES:
            match = re.search(rule["pattern"], combined, re.IGNORECASE)
            if match:
                matched_rules.append(rule)
                detected_factors.append(rule["factor"])
                if "compliance" in rule:
                    for tag in rule["compliance"]:
                        if tag not in compliance_tags:
                            compliance_tags.append(tag)

                if rule["base_score"] > highest_score:
                    highest_score = rule["base_score"]
                    start = max(0, match.start() - 20)
                    end = min(len(combined), match.end() + 40)
                    snippet = combined[start:end].strip()
                    if start > 0:
                        snippet = "..." + snippet
                    if end < len(combined):
                        snippet = snippet + "..."
                    why_it_matters = rule["why_it_matters"]
                    recommendation = rule["recommendation"]

        if len(matched_rules) > 1:
            highest_score = min(98.0, highest_score + (len(matched_rules) - 1) * 4.0)

        if highest_score >= 76.0:
            level = "CRITICAL"
        elif highest_score >= 51.0:
            level = "HIGH"
        elif highest_score >= 26.0:
            level = "MEDIUM"
        else:
            level = "LOW"
            if not why_it_matters:
                why_it_matters = f"This clause defines standard operational guidelines regarding {category.lower()}."
                recommendation = "Review standard responsibilities to maintain compliance with service guidelines."

        return {
            "risk_score": round(highest_score, 1),
            "risk_level": level,
            "risk_factors": detected_factors if detected_factors else [f"Standard {category} clause"],
            "detected_snippet": snippet if snippet else (text[:160] + "..." if len(text) > 160 else text),
            "why_it_matters": why_it_matters,
            "recommendation": recommendation,
            "compliance_tags": compliance_tags
        }

    @staticmethod
    def compute_compliance_matrix(clauses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Evaluates document against GDPR, CCPA, EU AI Act, and SOC 2 frameworks.
        """
        gdpr_violations = 0
        ccpa_violations = 0
        ai_act_flags = 0
        flagged_count = 0

        for c in clauses:
            tags = c.get("compliance_tags", [])
            lvl = c.get("risk_level", "LOW")
            if lvl in ["CRITICAL", "HIGH"]:
                flagged_count += 1
            for tag in tags:
                if "GDPR" in tag:
                    gdpr_violations += 1
                if "CCPA" in tag:
                    ccpa_violations += 1
                if "AI Act" in tag or "AI" in tag:
                    ai_act_flags += 1

        gdpr_score = max(10.0, 100.0 - (gdpr_violations * 25.0))
        ccpa_score = max(10.0, 100.0 - (ccpa_violations * 25.0))

        return {
            "gdpr_status": "COMPLIANT" if gdpr_violations == 0 else ("REVIEW_NEEDED" if gdpr_violations == 1 else "NON-COMPLIANT"),
            "gdpr_score": round(gdpr_score, 1),
            "ccpa_status": "COMPLIANT" if ccpa_violations == 0 else ("REVIEW_NEEDED" if ccpa_violations == 1 else "NON-COMPLIANT"),
            "ccpa_score": round(ccpa_score, 1),
            "eu_ai_act_status": "COMPLIANT" if ai_act_flags == 0 else "REVIEW_NEEDED",
            "soc2_status": "COMPLIANT" if flagged_count <= 2 else "REVIEW_NEEDED",
            "flagged_clauses_count": flagged_count
        }

    @staticmethod
    def compute_overall_document_risk(clauses: List[Dict[str, Any]]) -> Tuple[float, str, Dict[str, int]]:
        if not clauses:
            return 0.0, "LOW", {"critical": 0, "high": 0, "medium": 0, "low": 0}

        counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        scores = []

        for c in clauses:
            lvl = c["risk_level"].lower()
            counts[lvl] = counts.get(lvl, 0) + 1
            scores.append(c["risk_score"])

        max_score = max(scores) if scores else 0.0
        avg_score = sum(scores) / len(scores) if scores else 0.0
        weighted_score = (max_score * 0.60) + (avg_score * 0.40)
        penalty = min(15.0, counts["critical"] * 4.0 + counts["high"] * 2.0)
        overall_score = min(99.0, max(0.0, weighted_score + penalty))

        if overall_score >= 76.0:
            overall_level = "CRITICAL"
        elif overall_score >= 51.0:
            overall_level = "HIGH"
        elif overall_score >= 26.0:
            overall_level = "MEDIUM"
        else:
            overall_level = "LOW"

        return round(overall_score, 1), overall_level, counts
