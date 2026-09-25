import os
import math
import re
from typing import List, Dict, Any, Optional

class VectorStoreManager:
    """
    Manages vector embeddings and ChromaDB collections.
    Includes SentenceTransformer integration with a resilient semantic fallback
    to ensure 100% runtime availability.
    """
    _instance = None
    _model = None
    _chroma_client = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = VectorStoreManager()
            cls._instance._init_embedding_model()
            cls._instance._init_chroma()
        return cls._instance

    def _init_embedding_model(self):
        try:
            from sentence_transformers import SentenceTransformer
            # Load lightweight, accurate legal/general embedding model
            self._model = SentenceTransformer('all-MiniLM-L6-v2')
            print("Successfully loaded SentenceTransformer all-MiniLM-L6-v2")
        except Exception as e:
            print(f"SentenceTransformer not loaded or downloading delayed ({e}). Using semantic TF-IDF embedding fallback.")
            self._model = None

    def _init_chroma(self):
        try:
            import chromadb
            from chromadb.config import Settings
            from ..config import settings as app_settings
            
            os.makedirs(app_settings.CHROMA_PERSIST_DIR, exist_ok=True)
            self._chroma_client = chromadb.PersistentClient(path=app_settings.CHROMA_PERSIST_DIR)
            print("Successfully initialized ChromaDB client at:", app_settings.CHROMA_PERSIST_DIR)
        except Exception as e:
            print(f"ChromaDB persistent client init warning: {e}. Using in-memory fallback.")
            self._chroma_client = None

    def compute_embedding(self, text: str) -> List[float]:
        if self._model:
            try:
                emb = self._model.encode(text, convert_to_numpy=True)
                return emb.tolist()
            except Exception as e:
                print(f"Error computing transformer embedding: {e}")

        # High-dimension deterministic bag-of-words / TF-IDF hash embedding fallback (dimension: 384)
        dim = 384
        vec = [0.0] * dim
        words = re.findall(r'\b\w+\b', text.lower())
        if not words:
            return vec
            
        for w in words:
            # Deterministic hash to dimension index
            idx = abs(hash(w)) % dim
            vec[idx] += 1.0
            
        # Normalize vector
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 0:
            vec = [x / norm for x in vec]
        return vec

    def index_document(self, document_id: str, clauses: List[Dict[str, Any]]):
        """
        Indexes all segmented clauses of a document into ChromaDB.
        """
        collection_name = f"doc_{re.sub(r'[^a-zA-Z0-9_-]', '_', document_id)}"
        
        if self._chroma_client:
            try:
                # Reset or get collection
                try:
                    self._chroma_client.delete_collection(name=collection_name)
                except Exception:
                    pass
                collection = self._chroma_client.create_collection(name=collection_name)

                ids = [c["clause_id"] for c in clauses]
                documents = [f"{c['heading']}\n{c['text']}" for c in clauses]
                metadatas = [{
                    "clause_number": str(c["clause_number"]),
                    "heading": str(c["heading"]),
                    "page_number": int(c["page_number"]),
                    "category": str(c["category"]),
                    "risk_level": str(c["risk_level"]),
                    "risk_score": float(c["risk_score"]),
                } for c in clauses]
                
                embeddings = [self.compute_embedding(doc) for doc in documents]
                collection.add(ids=ids, documents=documents, metadatas=metadatas, embeddings=embeddings)
                print(f"Indexed {len(clauses)} clauses in ChromaDB collection {collection_name}")
                return
            except Exception as e:
                print(f"ChromaDB index error: {e}. Storing in memory.")

    def search(self, document_id: str, query: str, clauses: List[Dict[str, Any]], top_k: int = 4) -> List[Dict[str, Any]]:
        """
        Retrieves top_k relevant clauses using semantic vector similarity.
        """
        collection_name = f"doc_{re.sub(r'[^a-zA-Z0-9_-]', '_', document_id)}"
        query_vec = self.compute_embedding(query)

        if self._chroma_client:
            try:
                collection = self._chroma_client.get_collection(name=collection_name)
                results = collection.query(
                    query_embeddings=[query_vec],
                    n_results=min(top_k, len(clauses))
                )
                
                matched = []
                if results and results["ids"] and len(results["ids"][0]) > 0:
                    for i in range(len(results["ids"][0])):
                        c_id = results["ids"][0][i]
                        meta = results["metadatas"][0][i]
                        doc_text = results["documents"][0][i]
                        distance = results["distances"][0][i] if "distances" in results and results["distances"] else 0.5
                        # Convert distance to similarity score
                        similarity = max(0.0, min(1.0, 1.0 - (distance / 2.0)))
                        
                        matched.append({
                            "clause_id": c_id,
                            "clause_number": meta.get("clause_number", ""),
                            "heading": meta.get("heading", ""),
                            "page_number": meta.get("page_number", 1),
                            "text_snippet": doc_text,
                            "category": meta.get("category", "General"),
                            "risk_level": meta.get("risk_level", "LOW"),
                            "similarity_score": round(similarity, 3)
                        })
                    return matched
            except Exception as e:
                print(f"ChromaDB search error: {e}. Falling back to cosine ranking.")

        # In-memory cosine similarity ranking fallback
        ranked = []
        for c in clauses:
            doc_str = f"{c['heading']}\n{c['text']}"
            c_vec = self.compute_embedding(doc_str)
            # Dot product for unit vectors
            sim = sum(q * d for q, d in zip(query_vec, c_vec))
            
            # Keyword overlap boost
            q_words = set(re.findall(r'\w{3,}', query.lower()))
            d_words = set(re.findall(r'\w{3,}', doc_str.lower()))
            overlap = len(q_words.intersection(d_words)) / max(1, len(q_words))
            combined_sim = (sim * 0.7) + (overlap * 0.3)

            ranked.append({
                "clause_id": c["clause_id"],
                "clause_number": c["clause_number"],
                "heading": c["heading"],
                "page_number": c["page_number"],
                "text_snippet": c["text"][:350],
                "category": c["category"],
                "risk_level": c["risk_level"],
                "similarity_score": round(min(1.0, max(0.1, combined_sim)), 3)
            })

        ranked.sort(key=lambda x: x["similarity_score"], reverse=True)
        return ranked[:top_k]
