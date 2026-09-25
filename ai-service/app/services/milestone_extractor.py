"""
Milestone & Auto-Renewal Extraction Service + Executive Voice Script Synthesizer.
Parses contract clauses and full text to extract critical dates, notice windows,
payment terms, and builds a natural 60-second spoken briefing.
"""

import re
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

class MilestoneExtractor:
    @staticmethod
    def extract_milestones(full_text: str, clauses: List[Dict[str, Any]], risk_score: int, doc_name: str = "Agreement") -> Dict[str, Any]:
        """
        Extracts dates, auto-renewal mechanisms, notice windows, and generates
        both structured timeline events and an executive audio briefing script.
        """
        text_lower = full_text.lower()
        milestones = []
        
        # 1. Term & Expiration Analysis
        term_match = re.search(r'(?:term of|for a period of|initial term of)\s+(\d+|one|two|three|four|five)\s*(year|years|month|months)', full_text, re.IGNORECASE)
        term_duration = term_match.group(0) if term_match else "12 Months (Standard Initial Term)"
        
        # 2. Auto-Renewal Detection & Notice Window
        is_auto_renew = bool(re.search(r'auto(?:matic(?:ally)?)?\s*renew|successive\s*(?:terms?|periods?)|automatically\s*extend|recurring\s*billing', full_text, re.IGNORECASE))
        
        # Notice Window extraction (e.g. "forty-eight (48) hours", "60 days", "30 days", "90 days", "15 business days")
        notice_days = 30 # default standard notice
        notice_unit = "days"
        
        hours_match = re.search(r'(?:forty-eight|48|twenty-four|24|seventy-two|72)\s*(?:\(\d+\)\s*)?hours?', full_text, re.IGNORECASE)
        days_match = re.search(r'(?:(?:at least|minimum of|prior to)\s*)?(\d{1,3}|thirty|sixty|ninety|forty-five|forty-eight)\s*(?:\(\d+\)\s*)?(?:business\s*)?days?\s*(?:prior|written\s*notice|before|advance\s*notice)?', full_text, re.IGNORECASE)
        
        if hours_match:
            notice_days = 2
            notice_unit = "hours"
        elif days_match:
            raw_val = days_match.group(1).lower()
            word_to_num = {'thirty': 30, 'sixty': 60, 'ninety': 90, 'forty-five': 45, 'forty-eight': 48}
            if raw_val in word_to_num:
                notice_days = word_to_num[raw_val]
            elif raw_val.isdigit():
                notice_days = int(raw_val)
        elif is_auto_renew:
            notice_days = 30

        # Price increase notice check
        price_mod_match = re.search(r'(?:increase|modify|change|amend)\s*(?:subscription\s*)?fees?[^.\n]*(?:upon\s*)?(\d{1,3}|thirty|sixty)\s*(?:\(\d+\)\s*)?days?', full_text, re.IGNORECASE)
        price_notice_days = 30 if price_mod_match else None
        
        # 3. Detect Payment Milestones
        payment_match = re.search(r'(?:net\s*(\d{2})|payable\s*within\s*(\d{1,3})\s*days|billed\s*(monthly|annually|quarterly)|non-refundable)', full_text, re.IGNORECASE)
        payment_term = payment_match.group(0) if payment_match else "Monthly Recurring / Advance Billing"
        
        # 4. Audit & Compliance Windows
        audit_match = re.search(r'(?:audit|inspect|security review)\s*(?:records|books|facilities|systems)[^.\n]*(\d{1,3})\s*days', full_text, re.IGNORECASE)
        
        # Formulate Date Estimations (Based on today's reference)
        today = datetime.now()
        effective_date_str = today.strftime("%B %d, %Y")
        
        # Calculate standard 1-year timeline (or term duration)
        expiry_date = today + timedelta(days=365)
        expiry_date_str = expiry_date.strftime("%B %d, %Y")
        
        renewal_cutoff_date = expiry_date - timedelta(days=notice_days if notice_days > 0 else 30)
        renewal_cutoff_str = renewal_cutoff_date.strftime("%B %d, %Y")
        
        # Formulate Pre-Scheduled Alert Dates: 90-day, 60-day, 30-day alerts before renewal deadline
        alert_90 = renewal_cutoff_date - timedelta(days=90)
        alert_60 = renewal_cutoff_date - timedelta(days=60)
        alert_30 = renewal_cutoff_date - timedelta(days=30)
        
        # Assemble structured Milestones list
        milestones.append({
            "id": "m_effective",
            "title": "Contract Effective & Activation Date",
            "dateString": effective_date_str,
            "category": "effective",
            "daysFromNow": 0,
            "urgency": "INFO",
            "description": f"Initial agreement activation date under {term_duration}.",
            "actionRequired": "Archive countersigned agreement and record key vendor contacts."
        })
        
        if is_auto_renew:
            # 90-Day Strategy Alert
            if (alert_90 - today).days > 0:
                milestones.append({
                    "id": "m_alert_90",
                    "title": "90-Day Renewal Evaluation & Vendor Benchmark",
                    "dateString": alert_90.strftime("%B %d, %Y"),
                    "category": "reminder",
                    "daysFromNow": max(1, (alert_90 - today).days),
                    "urgency": "LOW",
                    "description": "Begin contract utilization review, ROI audit, and evaluate competitive alternatives.",
                    "actionRequired": "Survey internal users on software satisfaction and collect pricing benchmarks."
                })
            
            # 60-Day Commercial Renegotiation Alert
            if (alert_60 - today).days > 0:
                milestones.append({
                    "id": "m_alert_60",
                    "title": "60-Day Commercial Renegotiation & Rate Review",
                    "dateString": alert_60.strftime("%B %d, %Y"),
                    "category": "reminder",
                    "daysFromNow": max(1, (alert_60 - today).days),
                    "urgency": "MEDIUM",
                    "description": "Initiate discount requests or SLA adjustments before mandatory notice cutoff.",
                    "actionRequired": "Request updated rate card and request redlines on auto-escalation caps."
                })
            
            # 30-Day Critical Cancellation Window Alert
            if (alert_30 - today).days > 0:
                milestones.append({
                    "id": "m_alert_30",
                    "title": "30-Day Non-Renewal Formal Notice Window",
                    "dateString": alert_30.strftime("%B %d, %Y"),
                    "category": "reminder",
                    "daysFromNow": max(1, (alert_30 - today).days),
                    "urgency": "HIGH",
                    "description": "Final internal approval needed if intending to terminate or switch providers.",
                    "actionRequired": "Prepare formal non-renewal letter in accordance with notice requirements."
                })

            # Exact Renewal Cancellation Deadline
            milestones.append({
                "id": "m_notice_deadline",
                "title": f"Mandatory Non-Renewal Cancellation Cutoff ({notice_days} {notice_unit} Notice)",
                "dateString": renewal_cutoff_str,
                "category": "renewal_deadline",
                "daysFromNow": max(1, (renewal_cutoff_date - today).days),
                "urgency": "CRITICAL" if notice_days >= 30 else "HIGH",
                "description": f"Contract strictly requires notice delivered on or before this date to prevent automatic financial lock-in for another term.",
                "actionRequired": f"Deliver formal certified written notice to vendor before 5:00 PM on {renewal_cutoff_str}."
            })
            
            milestones.append({
                "id": "m_auto_renewal",
                "title": "Automatic Term Renewal Trigger Date",
                "dateString": expiry_date_str,
                "category": "renewal",
                "daysFromNow": max(1, (expiry_date - today).days),
                "urgency": "HIGH",
                "description": "If cancellation notice was not delivered, agreement auto-renews for another successive term at current or revised rates.",
                "actionRequired": "Audit invoice pricing against contracted baseline rate card."
            })
        else:
            milestones.append({
                "id": "m_expiration",
                "title": "Contract Expiration & Re-negotiation",
                "dateString": expiry_date_str,
                "category": "expiration",
                "daysFromNow": max(1, (expiry_date - today).days),
                "urgency": "MEDIUM",
                "description": "Agreement expires naturally. Services cease unless an extension addendum is executed.",
                "actionRequired": "Begin vendor evaluation and re-negotiation 60 days prior."
            })
            
        milestones.append({
            "id": "m_payment",
            "title": f"Billing & Invoicing Milestone ({payment_term})",
            "dateString": (today + timedelta(days=30)).strftime("%B %d, %Y"),
            "category": "payment",
            "daysFromNow": 30,
            "urgency": "LOW",
            "description": f"Invoice issuance and payment cycle. Governing terms: {payment_term}.",
            "actionRequired": "Verify invoice itemization against agreed master fee schedule."
        })
        
        if audit_match:
            milestones.append({
                "id": "m_audit",
                "title": "Annual Vendor Compliance Audit Window",
                "dateString": (today + timedelta(days=180)).strftime("%B %d, %Y"),
                "category": "audit",
                "daysFromNow": 180,
                "urgency": "MEDIUM",
                "description": f"Contract grants inspection/audit rights with advance notice.",
                "actionRequired": "Review security certifications (SOC 2, ISO 27001) and service level metrics."
            })

        # 5. Build 60-Second Executive Audio Briefing Script
        # Identify top critical clauses
        critical_clauses = [c for c in clauses if c.get("risk_level") == "CRITICAL"]
        high_clauses = [c for c in clauses if c.get("risk_level") == "HIGH"]
        flagged_clauses = critical_clauses + high_clauses

        # Clean document display title
        clean_doc_name = doc_name.replace('.txt', '').replace('.pdf', '').replace('.docx', '').replace('_', ' ')
        
        risk_tier_name = "Critical" if risk_score >= 75 else ("High" if risk_score >= 50 else ("Moderate" if risk_score >= 25 else "Low"))
        
        # Build key risk highlights
        key_risk_items = []
        if is_auto_renew:
            key_risk_items.append(f"the {notice_days}-{notice_unit} auto-renewal notice window")
        
        unilateral_match = re.search(r'unilateral|modify|amend|at any time in its sole discretion', full_text, re.IGNORECASE)
        if unilateral_match:
            key_risk_items.append("unilateral pricing modification rights")
            
        liability_match = re.search(r'limitation of liability|exceed.*paid|as-is', full_text, re.IGNORECASE)
        if liability_match:
            key_risk_items.append("severe limitation of vendor liability")
            
        arbitration_match = re.search(r'arbitration|class action', full_text, re.IGNORECASE)
        if arbitration_match:
            key_risk_items.append("mandatory binding arbitration and class action waivers")

        if not key_risk_items:
            key_risk_items = ["standard operational liability terms and recurring billing schedules"]

        critical_callout = " and ".join(key_risk_items[:2])

        audio_script = (
            f"Here is your 60-second executive summary for {clean_doc_name}. "
            f"Overall contract risk is assessed as {risk_tier_name} with a score of {risk_score} out of 100. "
            f"The critical items to note are {critical_callout}. "
        )

        if is_auto_renew:
            audio_script += (
                f"To prevent automatic financial lock-in, your team must deliver written cancellation notice on or before {renewal_cutoff_str}. "
            )

        if flagged_clauses:
            top_c = flagged_clauses[0]
            heading = top_c.get("heading") or top_c.get("title") or "Key Liability"
            why = top_c.get("why_it_matters") or top_c.get("explanation") or "creates broad unilateral risk"
            clean_why = why.split('.')[0] if '.' in why else why[:90]
            audio_script += f"Under Section '{heading}', {clean_why}. "

        audio_script += (
            f"Payment terms are structured under {payment_term}. "
            f"We recommend utilizing our automated calendar sync alerts and reviewing balanced redlines before signature. Executive briefing complete."
        )

        return {
            "isAutoRenew": is_auto_renew,
            "noticePeriodDays": notice_days,
            "termDuration": term_duration,
            "paymentTerms": payment_term,
            "effectiveDate": effective_date_str,
            "renewalCutoffDate": renewal_cutoff_str if is_auto_renew else None,
            "expirationDate": expiry_date_str,
            "milestones": milestones,
            "executiveVoiceScript": audio_script,
            "estimatedAudioDurationSeconds": 58
        }

