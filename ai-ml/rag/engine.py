import hashlib
from typing import Any, Dict, List, Optional
from embeddings.cached_embedder import CachedEmbedder
from llm.provider import get_llm_provider
from vector_store.chroma_wrapper import ChromaVectorStore


class RAGEngine:
    def __init__(self, collection_name: str = "campaign_intel"):
        self.embedder = CachedEmbedder()
        self.vector_store = ChromaVectorStore(collection_name)
        self.llm = get_llm_provider()

    def chunk_text(self, text: str, chunk_size: int = 500, chunk_overlap: int = 50) -> List[str]:
        """
        Splits a document text into smaller overlapping chunks.
        """
        words = text.split()
        chunks = []
        
        i = 0
        while i < len(words):
            chunk = " ".join(words[i : i + chunk_size])
            chunks.append(chunk)
            i += chunk_size - chunk_overlap
            
        return chunks

    def index_document(self, doc_id: str, text: str, metadata: Optional[Dict[str, Any]] = None) -> None:
        """
        Chunks the document, generates cached embeddings, and indexes them in ChromaDB.
        """
        chunks = self.chunk_text(text)
        if not chunks:
            return
            
        ids = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]
        embeddings = self.embedder.encode(chunks).tolist()
        
        metadatas = []
        for chunk in chunks:
            meta = (metadata or {}).copy()
            meta["length"] = len(chunk)
            metadatas.append(meta)
            
        self.vector_store.add_documents(ids, chunks, embeddings, metadatas)

    def retrieve_context(self, query: str, k: int = 3) -> List[str]:
        """
        Retrieves the top-k most semantically relevant text chunks.
        """
        # Encode query using cached embedder
        query_emb = self.embedder.encode([query])[0].tolist()
        results = self.vector_store.similarity_search(query_emb, k)
        return [doc for doc, _, _ in results]

    def query(self, user_query: str, system_instruction: Optional[str] = None) -> str:
        """
        Performs retrieval augmented generation: extracts context, constructs prompt, calls LLM.
        """
        contexts = self.retrieve_context(user_query, k=3)
        context_str = "\n---\n".join(contexts)
        
        prompt = f"""
Use the following retrieved context to answer the user's question. If the context is empty or irrelevant, use your general marketing knowledge to provide a thorough, structured, professional answer.

Context:
{context_str}

User Question: {user_query}
Answer:
"""
        return self.llm.generate(prompt, system_instruction)
