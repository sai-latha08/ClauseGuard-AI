import re
from typing import Dict, Any, List

class ClauseRedraftEngine:
    """
    Intelligent Legal Redrafting Engine.
    Generates balanced, bilateral counter-proposals and redlines
    for high-risk or one-sided contract clauses.
    """

    @staticmethod
    def redraft_clause(heading: str, original_text: str, category: str, risk_level: str, risk_factors: List[str]) -> Dict[str, Any]:
        cat_lower = category.lower()
        combined = f"{heading} {original_text}".lower()

        # 1. Termination / Unilateral cancellation
        if "termination" in cat_lower or "cancel" in cat_lower or "unilateral" in combined:
            proposed = (
                f"{heading}: Either party may terminate this Agreement upon thirty (30) days' prior written notice "
                "to the other party. In the event of termination, the Service Provider shall provide the Customer "
                "with a reasonable transition period of no less than sixty (60) days and complete export capabilities "
                "for all Customer Data in a standard, machine-readable format at no additional charge. "
                "Immediate termination shall strictly apply only in the event of a material, uncured breach following "
                "a fifteen (15) day written cure period."
            )
            rationale = "Replaces unilateral, instant termination with a mutual 30-day notice period, mandatory cure period for breaches, and guaranteed data transition & export rights."
            key_changes = [
                "Established mutual 30-day prior written notice requirement",
                "Added 15-day cure period before immediate breach termination",
                "Guaranteed 60-day transition window and zero-cost data export"
            ]
            negotiation_tip = "Emphasize operational business continuity and data protection compliance (e.g., GDPR Art. 20 data portability)."
            compliance_tags = ["GDPR Art. 20", "Data Portability", "Fair Contract Terms"]

        # 2. Arbitration / Class Action Waiver
        elif "arbitration" in cat_lower or "dispute" in cat_lower or "class action" in combined:
            proposed = (
                f"{heading}: In the event of any controversy or claim arising out of or relating to this Agreement, "
                "the parties agree first to attempt in good faith to resolve the dispute through informal executive negotiation. "
                "If unresolved within thirty (30) days, the dispute may be submitted to non-exclusive mediation or arbitration "
                "under the rules of the American Arbitration Association (AAA) in a mutually agreed venue, or brought before a court "
                "of competent jurisdiction. Nothing herein shall waive any party's statutory rights to injunctive relief or statutory claims."
            )
            rationale = "Preserves access to judicial remedies, removes coercive mandatory class action surrender, and requires mutual good-faith informal negotiation before proceedings."
            key_changes = [
                "Replaced mandatory binding arbitration with optional / mutually agreed mediation",
                "Removed absolute class action / jury trial waiver",
                "Preserved statutory injunctive relief rights"
            ]
            negotiation_tip = "Propose informal executive escalation first, which saves both parties legal fees before formal arbitration."
            compliance_tags = ["Constitutional Due Process", "Consumer Rights Directive"]

        # 3. Third-Party Data Sharing / Privacy / Monetization
        elif "third-party" in cat_lower or "data sharing" in cat_lower or "privacy" in cat_lower or "sell" in combined:
            proposed = (
                f"{heading}: The Provider shall process Customer Personal Data solely to the extent necessary to deliver the Services "
                "and in strict accordance with Customer's documented instructions. Provider shall not sell, rent, monetize, or disclose "
                "Personal Data to third-party advertisers or commercial partners without express, opt-in consent. All approved sub-processors "
                "must be bound by data protection obligations no less stringent than those set forth herein, and Customer shall be provided "
                "with thirty (30) days' notice prior to any sub-processor changes."
            )
            rationale = "Aligns data handling with GDPR Article 28 and CCPA/CPRA standards by prohibiting unauthorized data monetization and mandating sub-processor oversight."
            key_changes = [
                "Banned commercial sale, rental, and monetization of customer data",
                "Restricted processing strictly to service delivery under documented instructions",
                "Mandated 30-day prior notice for any new sub-processors"
            ]
            negotiation_tip = "Frame this as a mandatory corporate privacy and GDPR/CCPA data processing agreement (DPA) requirement."
            compliance_tags = ["GDPR Art. 28", "CCPA § 1798.140", "SOC 2 Type II"]

        # 4. Content Ownership / Intellectual Property
        elif "content" in cat_lower or "intellectual" in cat_lower or "license" in combined:
            proposed = (
                f"{heading}: Customer retains full and exclusive ownership of all right, title, and interest in and to Customer Content. "
                "Customer grants Provider a non-exclusive, worldwide, royalty-free, limited license to host, copy, and display Customer Content "
                "solely for the purpose of operating and providing the Services to Customer. This license terminates automatically and immediately "
                "upon the deletion of the content or termination of Customer's account."
            )
            rationale = "Protects intellectual property by replacing perpetual, irrevocable exploitation rights with a limited, service-only license that terminates on account closure."
            key_changes = [
                "Affirmed full customer ownership of all intellectual property and data",
                "Removed 'perpetual and irrevocable' broad commercial license",
                "License now terminates automatically upon content deletion or account closure"
            ]
            negotiation_tip = "State that internal IP policies and customer confidentiality prohibit granting irrevocable licenses to third parties."
            compliance_tags = ["IP Protection", "Confidentiality Standards"]

        # 5. Liability & Damage Caps
        elif "liability" in cat_lower or "damage" in cat_lower or "disclaimer" in cat_lower:
            proposed = (
                f"{heading}: Except with respect to indemnification obligations, gross negligence, willful misconduct, or breach of confidentiality/data security, "
                "each party's aggregate liability under this Agreement shall be capped at the total amount paid or payable by Customer in the twelve (12) "
                "months preceding the incident, or $50,000, whichever is greater. Neither party shall be liable for indirect, punitive, or consequential damages."
            )
            rationale = "Makes liability caps bilateral and creates standard enterprise carve-outs for data security breaches, confidentiality violations, and willful misconduct."
            key_changes = [
                "Replaced nominal liability cap with standard 12-month trailing fees baseline",
                "Added critical carve-outs for data breach, confidentiality, and gross negligence",
                "Made limitation mutual rather than unilateral"
            ]
            negotiation_tip = "Mutual 12-month trailing fee liability caps are standard market practice across enterprise SaaS agreements."
            compliance_tags = ["Enterprise Standard SaaS", "Fair Risk Allocation"]

        # 6. Indemnification
        elif "indemnif" in cat_lower or "hold harmless" in combined:
            proposed = (
                f"{heading}: (a) Customer shall indemnify and defend Provider against third-party claims arising from Customer's gross violation of law. "
                "(b) Provider shall indemnify, defend, and hold harmless Customer against any third-party claims, liabilities, damages, or costs "
                "alleging that the Services infringe any intellectual property right, or resulting from Provider's material breach of confidentiality or security."
            )
            rationale = "Converts one-sided user indemnity into a balanced mutual indemnity protecting the customer against vendor IP infringement and security breaches."
            key_changes = [
                "Made indemnification obligations mutual",
                "Added vendor IP infringement and security breach indemnity for customer protection",
                "Conditioned indemnity on prompt notice and right to control defense"
            ]
            negotiation_tip = "Vendor IP indemnity is a non-negotiable procurement standard to prevent customer exposure to third-party patent or copyright claims."
            compliance_tags = ["Mutual Indemnification", "IP Warranty"]

        # 7. Automatic Renewal & Price Changes
        elif "renewal" in cat_lower or "billing" in cat_lower or "refund" in cat_lower or "fee" in combined:
            proposed = (
                f"{heading}: Subscriptions will renew for successive terms of equal length unless either party gives written notice of non-renewal "
                "at least thirty (30) days prior to the end of the current term. Provider shall give Customer at least sixty (60) days' advance notice "
                "of any price increases. In the event of a material service disruption or early cancellation for cause, Customer shall be entitled "
                "to a pro-rata refund of any unearned, prepaid fees."
            )
            rationale = "Eliminates surprise price hikes and auto-renewals with mandatory advance notice and entitles customer to pro-rata refunds on service disruption."
            key_changes = [
                "Required 60 days advance written notice for any pricing updates",
                "Set clear 30-day non-renewal notification window",
                "Provided pro-rata refund rights for downtime or termination for cause"
            ]
            negotiation_tip = "Budget predictability requires 60-day price change notification and prorated refund guarantees."
            compliance_tags = ["FTC Auto-Renewal Rules", "Consumer Transparency"]

        # General Fallback
        else:
            proposed = (
                f"{heading}: The parties agree that all rights, obligations, and standards under this section shall be executed in good faith, "
                "with reasonable commercial efforts, and in compliance with all applicable local, state, and international laws. "
                "Any modifications to these obligations require mutual written agreement by authorized representatives."
            )
            rationale = "Provides mutual good-faith performance obligations and removes unilateral amendment powers."
            key_changes = [
                "Mandated mutual written agreement for changes",
                "Added good faith performance standard"
            ]
            negotiation_tip = "Ensure all terms operate bilaterally with mutual consent."
            compliance_tags = ["Good Faith Doctrine", "Fair Contract Principles"]

        return {
            "heading": heading,
            "original_text": original_text,
            "category": category,
            "risk_level": risk_level,
            "proposed_text": proposed,
            "rationale": rationale,
            "key_changes": key_changes,
            "negotiation_tip": negotiation_tip,
            "compliance_tags": compliance_tags
        }
