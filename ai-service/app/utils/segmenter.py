import re
from typing import List, Dict, Any

class ClauseSegmenter:
    """
    Intelligently segments continuous legal text into structured clauses.
    Detects:
      - Numbered clauses (1., 1.1, Section 3, Article IV)
      - ALL CAPS headings (LIMITATION OF LIABILITY, TERMINATION)
      - Title Cased headings
      - Bullet points and paragraphs
    """

    # Heading detection patterns
    HEADING_PATTERNS = [
        # Numbered headings: 1. Introduction, 1.1 Scope, Section 4. Liability, Article 5.
        r'^(?:(?:Section|Article|Clause|Paragraph)\s+)?(?:[0-9]+(?:\.[0-9]+)*|[IVXLCDM]+)[\.\:\)]\s+([A-Z0-9\s\-\,\/]{3,80})',
        # Standalone Capitalized Headings: "12. TERMINATION AND SUSPENSION"
        r'^[0-9]+[\.\)]\s+([A-Z\s\-\&]{4,60})$',
        # ALL CAPS Lines that look like headings
        r'^([A-Z][A-Z0-9\s\-\&\,]{3,60})$',
    ]

    @staticmethod
    def segment_pages(pages_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Segments text across multiple pages, preserving page numbers and sequence.
        """
        clauses = []
        clause_counter = 1

        for page in pages_data:
            page_num = page["page_number"]
            page_text = page["text"]
            
            if not page_text.strip():
                continue

            raw_chunks = ClauseSegmenter._split_into_chunks(page_text)
            
            for chunk in raw_chunks:
                heading = chunk["heading"]
                text = chunk["text"]
                
                # If chunk is too tiny or purely punctuation/page numbers, ignore
                if len(text.strip()) < 25 and not heading:
                    continue

                clause_id = f"cl_{page_num}_{clause_counter}"
                clause_num = str(clause_counter)
                
                # Check if heading has numbering
                num_match = re.match(r'^([0-9]+(?:\.[0-9]+)*|[IVXLCDM]+|\bSection\s+[0-9]+)\b', heading, re.I)
                if num_match:
                    clause_num = num_match.group(1)

                clauses.append({
                    "clause_id": clause_id,
                    "clause_number": clause_num,
                    "heading": heading if heading else f"Section {clause_counter}",
                    "text": text,
                    "page_number": page_num,
                    "char_start": chunk.get("char_start", 0),
                    "char_end": chunk.get("char_end", len(text)),
                })
                clause_counter += 1

        # If no structured headings detected (e.g. dense single block), chunk by paragraphs
        if not clauses:
            for page in pages_data:
                paragraphs = [p.strip() for p in page["text"].split("\n\n") if len(p.strip()) > 30]
                for p_idx, p in enumerate(paragraphs):
                    clauses.append({
                        "clause_id": f"cl_{page['page_number']}_{p_idx+1}",
                        "clause_number": str(p_idx + 1),
                        "heading": f"Clause {p_idx + 1}",
                        "text": p,
                        "page_number": page["page_number"],
                        "char_start": 0,
                        "char_end": len(p),
                    })

        return clauses

    @staticmethod
    def _split_into_chunks(text: str) -> List[Dict[str, Any]]:
        lines = text.split("\n")
        chunks = []
        
        current_heading = ""
        current_body = []
        char_offset = 0
        chunk_start = 0

        for line in lines:
            line_str = line.strip()
            if not line_str:
                char_offset += len(line) + 1
                continue

            # Check if this line is a heading
            is_heading = False
            extracted_heading = ""
            
            for pattern in ClauseSegmenter.HEADING_PATTERNS:
                match = re.match(pattern, line_str)
                if match:
                    is_heading = True
                    extracted_heading = line_str
                    break

            # Also check if short uppercase line without punctuation
            if not is_heading and len(line_str) <= 60 and line_str.isupper() and len(line_str.split()) >= 1:
                is_heading = True
                extracted_heading = line_str

            if is_heading:
                # Save previous chunk
                if current_body or current_heading:
                    body_text = " ".join(current_body).strip()
                    if body_text or current_heading:
                        chunks.append({
                            "heading": current_heading,
                            "text": body_text if body_text else current_heading,
                            "char_start": chunk_start,
                            "char_end": char_offset
                        })
                current_heading = extracted_heading
                current_body = []
                chunk_start = char_offset
            else:
                current_body.append(line_str)

            char_offset += len(line) + 1

        # Append final chunk
        if current_body or current_heading:
            body_text = " ".join(current_body).strip()
            if body_text or current_heading:
                chunks.append({
                    "heading": current_heading,
                    "text": body_text if body_text else current_heading,
                    "char_start": chunk_start,
                    "char_end": char_offset
                })

        return chunks
