import os
import re
from typing import List, Dict, Any

class DocumentExtractor:
    """
    Extracts text from PDF, DOCX, and TXT files while preserving page numbers,
    cleaning up redundant whitespace, headers/footers, and encoding issues.
    """
    
    @staticmethod
    def extract(file_path: str) -> List[Dict[str, Any]]:
        """
        Extracts content as a list of page objects:
        [{"page_number": 1, "text": "...", "char_count": 1234}]
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
            
        ext = os.path.splitext(file_path)[1].lower()
        
        if ext == ".pdf":
            return DocumentExtractor._extract_pdf(file_path)
        elif ext in [".docx", ".doc"]:
            return DocumentExtractor._extract_docx(file_path)
        elif ext in [".txt", ".md"]:
            return DocumentExtractor._extract_txt(file_path)
        else:
            raise ValueError(f"Unsupported file format: {ext}")

    @staticmethod
    def _extract_pdf(file_path: str) -> List[Dict[str, Any]]:
        pages_data = []
        try:
            import fitz  # PyMuPDF
            doc = fitz.open(file_path)
            
            for page_idx in range(len(doc)):
                page = doc[page_idx]
                text = page.get_text("text")
                cleaned_text = DocumentExtractor._clean_text(text)
                
                # Check extraction quality (if empty, we still preserve page structure)
                pages_data.append({
                    "page_number": page_idx + 1,
                    "text": cleaned_text,
                    "char_count": len(cleaned_text),
                    "is_scanned": len(cleaned_text.strip()) < 30
                })
            doc.close()
        except ImportError:
            # Fallback if PyMuPDF not available
            import pypdf
            reader = pypdf.PdfReader(file_path)
            for page_idx, page in enumerate(reader.pages):
                text = page.extract_text() or ""
                cleaned_text = DocumentExtractor._clean_text(text)
                pages_data.append({
                    "page_number": page_idx + 1,
                    "text": cleaned_text,
                    "char_count": len(cleaned_text),
                    "is_scanned": len(cleaned_text.strip()) < 30
                })
                
        return pages_data

    @staticmethod
    def _extract_docx(file_path: str) -> List[Dict[str, Any]]:
        import docx
        doc = docx.Document(file_path)
        full_text = []
        for para in doc.paragraphs:
            if para.text.strip():
                full_text.append(para.text.strip())
                
        combined_text = "\n\n".join(full_text)
        cleaned_text = DocumentExtractor._clean_text(combined_text)
        
        # Paginate roughly by ~3000 chars per page if single docx stream
        return [{
            "page_number": 1,
            "text": cleaned_text,
            "char_count": len(cleaned_text),
            "is_scanned": False
        }]

    @staticmethod
    def _extract_txt(file_path: str) -> List[Dict[str, Any]]:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            raw_text = f.read()
            
        cleaned_text = DocumentExtractor._clean_text(raw_text)
        return [{
            "page_number": 1,
            "text": cleaned_text,
            "char_count": len(cleaned_text),
            "is_scanned": False
        }]

    @staticmethod
    def _clean_text(text: str) -> str:
        if not text:
            return ""
            
        # Replace non-breaking spaces and irregular unicode whitespaces
        text = text.replace("\u00a0", " ").replace("\u200b", "")
        # Remove repetitive header/footer page markers like "Page 1 of 12"
        text = re.sub(r'(?i)\bpage\s+\d+\s+(?:of\s+\d+)?\b', '', text)
        # Normalize double/multiple line breaks and multiple spaces
        text = re.sub(r'[ \t]+', ' ', text)
        text = re.sub(r'\n{3,}', '\n\n', text)
        # Strip trailing & leading spaces from each line
        lines = [line.strip() for line in text.split('\n')]
        return '\n'.join(lines).strip()
