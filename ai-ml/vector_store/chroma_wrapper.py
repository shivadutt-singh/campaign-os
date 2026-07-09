import os
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Tuple
import chromadb

# Folder for Chroma persistent index
DB_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "index")
)


class BaseVectorStore(ABC):
    @abstractmethod
    def add_documents(self, ids: List[str], texts: List[str], embeddings: List[List[float]], metadatas: Optional[List[Dict[str, Any]]] = None) -> None:
        """
        Inserts document texts along with their computed embeddings.
        """
        pass

    @abstractmethod
    def similarity_search(self, query_embedding: List[float], k: int = 4) -> List[Tuple[str, float, Dict[str, Any]]]:
        """
        Searches for the top-k most similar documents.
        Returns a list of tuples: (text, distance, metadata)
        """
        pass


class ChromaVectorStore(BaseVectorStore):
    def __init__(self, collection_name: str = "campaign_intel"):
        os.makedirs(DB_DIR, exist_ok=True)
        self.client = chromadb.PersistentClient(path=DB_DIR)
        self.collection = self.client.get_or_create_collection(name=collection_name)

    def add_documents(
        self,
        ids: List[str],
        texts: List[str],
        embeddings: List[List[float]],
        metadatas: Optional[List[Dict[str, Any]]] = None
    ) -> None:
        if metadatas is None:
            metadatas = [{} for _ in range(len(ids))]
            
        self.collection.add(
            ids=ids,
            documents=texts,
            embeddings=embeddings,
            metadatas=metadatas
        )

    def similarity_search(
        self,
        query_embedding: List[float],
        k: int = 4
    ) -> List[Tuple[str, float, Dict[str, Any]]]:
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=k
        )
        
        # Format output: list of (text, distance, metadata)
        output = []
        if not results or "documents" not in results or not results["documents"]:
            return []
            
        docs = results["documents"][0]
        distances = results.get("distances", [[0.0] * len(docs)])[0]
        metadatas = results.get("metadatas", [[{}] * len(docs)])[0]
        
        for doc, dist, meta in zip(docs, distances, metadatas):
            output.append((doc, float(dist), meta))
            
        return output
