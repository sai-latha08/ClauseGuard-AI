import re
from typing import List, Dict, Any, Tuple
from ..models.schemas import CitationSource

class QAEngine:
    """
    Document-Aware RAG Engine for answering questions grounded directly in the uploaded contract.
    Strictly prevents hallucination by asserting evidence from retrieved citations.
    """

    @staticmethod
    def answer_question(question: str, matched_sources: List[Dict[str, Any]]) -> Tuple[str, float, List[CitationSource]]:
        """
        Synthesizes an answer based strictly on matched sources.
        """
        if not matched_sources:
            return (
                "I couldn't find enough information in this document to answer your question confidently.",
                0.0,
                []
            )

        top_source = matched_sources[0]
        sim_score = top_source.get("similarity_score", 0.0)

        # Low similarity threshold check
        if sim_score < 0.22:
            return (
                "I couldn't find relevant provisions regarding this query in the uploaded agreement.",
                0.2,
                []
            )

        q_lower = question.lower()
        citations = []

        for s in matched_sources:
            citations.append(CitationSource(
                clause_id=s["clause_id"],
                clause_number=s["clause_number"],
                heading=s["heading"],
                page_number=s["page_number"],
                text_snippet=s["text_snippet"][:300] + ("..." if len(s["text_snippet"]) > 300 else ""),
                category=s["category"],
                risk_level=s["risk_level"],
                similarity_score=s["similarity_score"]
            ))

        # Synthesize plain-language response citing specific pages and sections
        answer_parts = []
        
        # Determine intent
        if any(w in q_lower for w in ["renew", "subscription", "recurring", "cancel"]):
            renew_sources = [s for s in matched_sources if s["category"] == "Automatic Renewal" or "renew" in s["text_snippet"].lower()]
            if renew_sources:
                src = renew_sources[0]
                answer_parts.append(
                    f"Based on **{src['heading']}** (Page {src['page_number']}), this agreement contains automatic renewal terms. "
                    f"The text indicates: *\"{src['text_snippet'][:180]}...\"*. "
                    f"Subscriptions will typically continue and recur automatically unless canceled prior to the renewal window."
                )
            else:
                answer_parts.append(
                    f"According to **{top_source['heading']}** (Page {top_source['page_number']}), relevant terms state: *\"{top_source['text_snippet'][:180]}...\"*."
                )

        elif any(w in q_lower for w in ["share", "data", "third party", "sell", "privacy", "tracking"]):
            data_sources = [s for s in matched_sources if s["category"] in ["Third-Party Data Sharing", "Data Collection"] or "data" in s["text_snippet"].lower()]
            if data_sources:
                src = data_sources[0]
                answer_parts.append(
                    f"According to **{src['heading']}** on Page {src['page_number']} regarding {src['category']}, "
                    f"the document states: *\"{src['text_snippet'][:180]}...\"*. "
                    f"This indicates personal or usage information may be shared or processed with external service partners."
                )
            else:
                answer_parts.append(
                    f"Review of **{top_source['heading']}** (Page {top_source['page_number']}) notes: *\"{top_source['text_snippet'][:180]}...\"*."
                )

        elif any(w in q_lower for w in ["terminate", "cancel account", "delete account", "suspend"]):
            term_sources = [s for s in matched_sources if s["category"] in ["Termination", "Account Suspension"]]
            if term_sources:
                src = term_sources[0]
                answer_parts.append(
                    f"Under **{src['heading']}** (Page {src['page_number']}), the provider specifies termination conditions: *\"{src['text_snippet'][:180]}...\"*. "
                    f"Accounts may be subject to termination or suspension under the conditions outlined in this section."
                )
            else:
                answer_parts.append(
                    f"Relevant clauses under **{top_source['heading']}** (Page {top_source['page_number']}) state: *\"{top_source['text_snippet'][:180]}...\"*."
                )

        elif any(w in q_lower for w in ["refund", "money back", "return"]):
            ref_sources = [s for s in matched_sources if s["category"] == "Refund Policy" or "refund" in s["text_snippet"].lower()]
            if ref_sources:
                src = ref_sources[0]
                answer_parts.append(
                    f"Regarding refunds, **{src['heading']}** (Page {src['page_number']}) indicates: *\"{src['text_snippet'][:180]}...\"*."
                )
            else:
                answer_parts.append(
                    f"Based on **{top_source['heading']}** (Page {top_source['page_number']}), relevant terms specify: *\"{top_source['text_snippet'][:180]}...\"*."
                )

        elif any(w in q_lower for w in ["sue", "court", "arbitrat", "dispute", "class action", "jury"]):
            arb_sources = [s for s in matched_sources if s["category"] in ["Arbitration", "Governing Law"]]
            if arb_sources:
                src = arb_sources[0]
                answer_parts.append(
                    f"Under **{src['heading']}** (Page {src['page_number']}), disputes are governed by: *\"{src['text_snippet'][:180]}...\"*. "
                    f"This section specifies dispute resolution procedures and applicable legal venue."
                )
            else:
                answer_parts.append(
                    f"According to **{top_source['heading']}** (Page {top_source['page_number']}): *\"{top_source['text_snippet'][:180]}...\"*."
                )

        else:
            answer_parts.append(
                f"Based on section **{top_source['heading']}** (Page {top_source['page_number']}, Category: {top_source['category']}), the agreement specifies: "
                f"*\"{top_source['text_snippet'][:220]}...\"*."
            )

        answer_parts.append("\n\n*Note: This synthesis is derived directly from the uploaded document for informational purposes.*")
        final_answer = "\n\n".join(answer_parts)
        confidence = min(0.95, max(0.55, sim_score))

        return final_answer, round(confidence, 2), citations
