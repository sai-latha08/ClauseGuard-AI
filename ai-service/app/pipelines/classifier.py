import re
from typing import Tuple, Dict, List

CATEGORIES = [
    "Termination",
    "Liability",
    "Indemnification",
    "Hidden Charges",
    "Automatic Renewal",
    "Refund Policy",
    "Data Collection",
    "Third-Party Data Sharing",
    "Arbitration",
    "Governing Law",
    "Intellectual Property",
    "User Responsibilities",
    "Payment",
    "Account Suspension",
    "Content Ownership",
    "Warranty Disclaimer"
]

# Domain-specific legal keywords and contextual triggers for each category
CATEGORY_TAXONOMY: Dict[str, Dict[str, Any]] = {
    "Automatic Renewal": {
        "patterns": [
            r"automatic(?:ally)?\s+renew(?:al|s|ed)?",
            r"recurring\s+subscription",
            r"auto-renew(?:al)?",
            r"renews\s+automatically",
            r"unless\s+(?:you\s+)?cancel\s+(?:prior|before)",
            r"continuous\s+subscription",
            r"billed\s+on\s+a\s+recurring\s+basis"
        ],
        "weight": 2.5
    },
    "Indemnification": {
        "patterns": [
            r"indemnif(?:y|ication|ied|ying)",
            r"hold\s+harmless",
            r"defend\s+and\s+hold",
            r"defend,\s+indemnify",
            r"against\s+any\s+claims,\s+liabilities,\s+damages"
        ],
        "weight": 2.4
    },
    "Arbitration": {
        "patterns": [
            r"binding\s+arbitration",
            r"class\s+action\s+waiver",
            r"waive\s+(?:any\s+right\s+to\s+)?(?:a\s+)?jury\s+trial",
            r"dispute\s+resolution\s+by\s+binding",
            r"american\s+arbitration\s+association",
            r"arbitrator",
            r"opt-out\s+of\s+arbitration"
        ],
        "weight": 2.5
    },
    "Liability": {
        "patterns": [
            r"limitation\s+of\s+liability",
            r"in\s+no\s+event\s+shall\s+(?:we|the\s+company|licensor|provider)\s+be\s+liable",
            r"aggregate\s+liability\s+(?:shall\s+not\s+exceed|capped\s+at)",
            r"consequential,\s+indirect,\s+special,\s+punitive\s+damages",
            r"total\s+liability",
            r"disclaims\s+all\s+liability"
        ],
        "weight": 2.2
    },
    "Third-Party Data Sharing": {
        "patterns": [
            r"share\s+(?:your\s+)?(?:personal\s+)?(?:data|information)\s+with\s+third\s+parties",
            r"third-party\s+(?:partners|service\s+providers|vendors|affiliates|advertisers)",
            r"sell\s+(?:or\s+rent\s+)?(?:your\s+)?personal\s+information",
            r"disclose\s+your\s+information\s+to\s+third\s+parties",
            r"targeted\s+advertising",
            r"monetiz(?:e|ation)\s+of\s+data"
        ],
        "weight": 2.3
    },
    "Data Collection": {
        "patterns": [
            r"collect(?:ion|s|ed)?\s+(?:of\s+)?(?:personal\s+)?information",
            r"cookies,\s+beacons,\s+tracking",
            r"device\s+information,\s+ip\s+address,\s+location",
            r"biometric\s+data",
            r"usage\s+data\s+and\s+analytics",
            r"privacy\s+policy"
        ],
        "weight": 1.8
    },
    "Termination": {
        "patterns": [
            r"terminate\s+(?:your\s+)?(?:account|access|service|agreement)",
            r"termination\s+at\s+(?:our\s+)?sole\s+discretion",
            r"terminate\s+(?:at\s+any\s+time\s+)?without\s+notice",
            r"effect\s+of\s+termination",
            r"right\s+to\s+terminate"
        ],
        "weight": 2.0
    },
    "Account Suspension": {
        "patterns": [
            r"suspend\s+(?:or\s+terminate\s+)?(?:your\s+)?(?:access|account)",
            r"immediate\s+suspension",
            r"without\s+prior\s+notice\s+or\s+liability",
            r"freeze\s+or\s+disable\s+your\s+account",
            r"deactivate\s+your\s+account"
        ],
        "weight": 1.9
    },
    "Hidden Charges": {
        "patterns": [
            r"additional\s+(?:fees|charges|taxes)",
            r"non-refundable\s+(?:fee|deposit|charge)",
            r"price\s+changes\s+without\s+notice",
            r"penalty\s+fees?",
            r"inactivity\s+fee",
            r"administrative\s+fee",
            r"maintenance\s+charge"
        ],
        "weight": 2.2
    },
    "Refund Policy": {
        "patterns": [
            r"no\s+refunds\s+(?:or\s+credits)?",
            r"all\s+fees\s+are\s+non-refundable",
            r"refund\s+(?:policy|eligibility|request)",
            r"money-back\s+guarantee",
            r"within\s+\d+\s+days\s+of\s+purchase"
        ],
        "weight": 2.1
    },
    "Content Ownership": {
        "patterns": [
            r"grant\s+(?:us\s+)?(?:a\s+)?(?:worldwide,\s+)?(?:perpetual,\s+)?(?:irrevocable,\s+)?(?:royalty-free\s+)?license",
            r"user-generated\s+content",
            r"you\s+retain\s+ownership\s+of",
            r"moral\s+rights\s+waiver",
            r"license\s+to\s+use,\s+modify,\s+distribute\s+your\s+content"
        ],
        "weight": 2.3
    },
    "Intellectual Property": {
        "patterns": [
            r"intellectual\s+property\s+rights",
            r"trademarks?,\s+copyrights?,\s+patents?",
            r"proprietary\s+rights",
            r"all\s+rights\s+reserved",
            r"infringement\s+of\s+intellectual\s+property"
        ],
        "weight": 1.7
    },
    "Warranty Disclaimer": {
        "patterns": [
            r"as\s+is\s+and\s+as\s+available",
            r"without\s+warranties?\s+of\s+any\s+kind",
            r"disclaims\s+all\s+warranties",
            r"merchantability\s+or\s+fitness\s+for\s+a\s+particular\s+purpose",
            r"express\s+or\s+implied\s+warranties"
        ],
        "weight": 2.0
    },
    "Governing Law": {
        "patterns": [
            r"governed\s+by\s+(?:and\s+construed\s+in\s+accordance\s+with\s+)?the\s+laws\s+of",
            r"exclusive\s+jurisdiction\s+of\s+the\s+courts",
            r"venue\s+in\s+[A-Z][a-z]+",
            r"conflict\s+of\s+law\s+principles"
        ],
        "weight": 1.9
    },
    "Payment": {
        "patterns": [
            r"payment\s+(?:terms|method|processing|schedule)",
            r"billing\s+cycle",
            r"credit\s+card\s+authorization",
            r"taxes\s+and\s+duties",
            r"chargeback\s+policy"
        ],
        "weight": 1.6
    },
    "User Responsibilities": {
        "patterns": [
            r"prohibited\s+(?:activities|conduct|uses?)",
            r"you\s+agree\s+(?:not\s+to|that\s+you\s+will)",
            r"acceptable\s+use\s+policy",
            r"compliance\s+with\s+laws",
            r"account\s+security\s+and\s+credentials"
        ],
        "weight": 1.5
    }
}

class ClauseClassifier:
    """
    Classifies a clause into one of the 16 legal categories using taxonomy weighting,
    regex matching, and context analysis.
    """

    @staticmethod
    def classify(heading: str, text: str) -> Tuple[str, float]:
        """
        Returns (category_name, confidence_score: 0.0 - 1.0)
        """
        combined = f"{heading} {text}".lower()
        heading_lower = heading.lower()

        scores: Dict[str, float] = {}

        for category, config in CATEGORY_TAXONOMY.items():
            cat_score = 0.0
            weight = config["weight"]
            patterns = config["patterns"]

            # Direct heading match gets high boost
            cat_words = category.lower().split()
            if any(word in heading_lower for word in cat_words if len(word) > 3):
                cat_score += 3.0 * weight

            for pattern in patterns:
                matches = re.findall(pattern, combined, re.IGNORECASE)
                if matches:
                    cat_score += len(matches) * 1.5 * weight

            scores[category] = cat_score

        # Find category with max score
        best_category = max(scores, key=scores.get)
        max_score = scores[best_category]

        if max_score > 0:
            # Calibrate confidence score between 0.65 and 0.98
            confidence = min(0.98, max(0.65, 0.65 + (max_score / 20.0) * 0.33))
            return best_category, round(confidence, 2)
        else:
            # Fallback based on heading or general legal category
            if "user" in combined or "responsib" in combined or "conduct" in combined:
                return "User Responsibilities", 0.60
            elif "law" in combined or "court" in combined or "jurisdiction" in combined:
                return "Governing Law", 0.60
            elif "pay" in combined or "price" in combined or "bill" in combined:
                return "Payment", 0.60
            elif "privacy" in combined or "data" in combined:
                return "Data Collection", 0.60
            else:
                return "User Responsibilities", 0.50
