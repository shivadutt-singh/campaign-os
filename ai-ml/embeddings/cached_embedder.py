import hashlib
import json
import os
import sqlite3
from typing import List, Optional, Union
import numpy as np
from sentence_transformers import SentenceTransformer

# Cache dir setup
CACHE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "cache"))
os.makedirs(CACHE_DIR, exist_ok=True)
DB_PATH = os.path.join(CACHE_DIR, "embeddings_cache.db")


class CachedEmbedder:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model_name = model_name
        # Lazy load model to speed up initialization
        self._model = None
        self._init_db()

    @property
    def model(self) -> SentenceTransformer:
        if self._model is None:
            self._model = SentenceTransformer(self.model_name)
        return self._model

    def _init_db(self):
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS cache (
                text_hash TEXT PRIMARY KEY,
                model_name TEXT,
                embedding_json TEXT
            )
            """
        )
        conn.commit()
        conn.close()

    def _get_hash(self, text: str) -> str:
        return hashlib.sha256(text.encode("utf-8")).hexdigest()

    def _lookup_cache(self, text: str) -> Optional[np.ndarray]:
        text_hash = self._get_hash(text)
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT embedding_json FROM cache WHERE text_hash = ? AND model_name = ?",
            (text_hash, self.model_name)
        )
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return np.array(json.loads(row[0]), dtype=np.float32)
        return None

    def _write_cache(self, text: str, embedding: np.ndarray):
        text_hash = self._get_hash(text)
        embedding_json = json.dumps(embedding.tolist())
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        try:
            cursor.execute(
                "INSERT OR REPLACE INTO cache (text_hash, model_name, embedding_json) VALUES (?, ?, ?)",
                (text_hash, self.model_name, embedding_json)
            )
            conn.commit()
        except sqlite3.Error:
            pass
        finally:
            conn.close()

    def encode(self, texts: Union[str, List[str]]) -> np.ndarray:
        """
        Encodes texts using SentenceTransformer, querying the SQLite cache first.
        """
        if isinstance(texts, str):
            texts = [texts]

        results = []
        uncached_texts = []
        uncached_indices = []

        for i, text in enumerate(texts):
            cached_val = self._lookup_cache(text)
            if cached_val is not None:
                results.append((i, cached_val))
            else:
                uncached_texts.append(text)
                uncached_indices.append(i)

        if uncached_texts:
            # Generate embeddings for uncached texts
            embeddings = self.model.encode(uncached_texts)
            for text, emb, orig_idx in zip(uncached_texts, embeddings, uncached_indices):
                self._write_cache(text, emb)
                results.append((orig_idx, emb))

        # Re-sort results to keep original sequence order
        results.sort(key=lambda x: x[0])
        return np.array([x[1] for x in results], dtype=np.float32)
