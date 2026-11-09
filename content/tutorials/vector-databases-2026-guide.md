## What you will learn

Vector databases in 2026: when you need one, how embeddings + indexes work, and how to pick between Chroma, pgvector, Pinecone, Weaviate, and Qdrant. Includes a runnable comparison and a production checklist.

**Prerequisites:** basic SQL. Python helps for the demos.

## Table of contents

1. Why vector search exists
2. How embeddings + indexes work
3. The contenders (2026)
4. Runnable: Chroma vs pgvector
5. Index tuning (HNSW, IVF)
6. Hybrid search
7. Production checklist

## 1. Why vector search exists

SQL finds exact matches. Vector search finds *similar* meaning. `"refund window"` finds `"30-day return policy"` with no shared words. That is semantic search — the engine of RAG, recommendations, and dedupe.

## 2. How it works

1. **Embed** every chunk to a vector (512–1536 dims).
2. **Index** vectors for nearest-neighbors (HNSW is the default — fast, graph-based).
3. **Query** embeds the question, then k-nearest-neighbors by cosine similarity.

```python
# cosine(a, b) = 1 → identical, 0 → unrelated
```

Chunk quality decides retrieval quality. No index fixes bad chunks.

## 3. The contenders

| Store | Best for | Ops | Cost |
|---|---|---|---|
| **Chroma** | Local dev, prototypes | Zero | Free |
| **pgvector** | Postgres teams, prod start | Low (existing DB) | Free |
| **Qdrant** | Self-host prod, filtering | Medium | Free / cloud |
| **Weaviate** | Hybrid + modules | Medium | Free / cloud |
| **Pinecone** | Zero-ops managed | Zero | $ / sec |

**2026 advice:** prototype on Chroma, graduate to pgvector or Qdrant, go managed only when ops hurts.

## 4. Runnable: Chroma vs pgvector

**Chroma (30 seconds):**

```python
import chromadb
db = chromadb.Client()
col = db.create_collection("docs")
col.add(ids=["1", "2"], documents=["Refund window is 30 days.", "Office location?"], embeddings=[[0.1, 0.2], [0.3, 0.4]])
print(col.query(query_embeddings=[[0.11, 0.19]], n_results=1)["documents"])
```

**pgvector (Postgres):**

```sql
CREATE EXTENSION vector;
CREATE TABLE docs (id SERIAL PRIMARY KEY, body TEXT, embedding vector(1536));
CREATE INDEX ON docs USING hnsw (embedding vector_cosine_ops);
SELECT body FROM docs ORDER BY embedding <=> $1 LIMIT 5;
```

## 5. Index tuning (HNSW, IVF)

- **HNSW** (default): graph, high recall, fast queries. Tune `m` (16) and `ef_construction` (200).
- **IVF**: clusters + centroids, great at billion scale, slightly lower recall.
- Measure **recall@10** on your eval; HNSW usually wins under 10M vectors.

## 6. Hybrid search

Vector + BM25 keyword, merged with Reciprocal Rank Fusion (RRF). Beats pure vector on IDs, codes, and rare terms.

```python
# pseudocode: rrf = 1/(60+rank_vec) + 1/(60+rank_bm25)
```

Most RAG failures are fixed by hybrid + rerank, not a bigger index.

## 7. Production checklist

- [ ] Sentence-aware chunks (500/50)
- [ ] 1536-dim embeddings, cosine
- [ ] HNSW index, recall@10 ≥85% on eval
- [ ] Hybrid + rerank 10→3
- [ ] Metadata filters (date, source) for scoping
- [ ] Backup index (re-embed is expensive)

## FAQ

### Need a vector DB or just Postgres?

Start with pgvector if you have Postgres. Pure vector stores shine at scale or with heavy filtering.

### Embedding model?

text-embedding-3-small for API; BGE/Qwen for self-host. Dim 512 for speed, 1536 for recall.

## Verdict

Vector DBs are RAG's memory. Start Chroma, scale pgvector/Qdrant, hybrid always. Pair with [RAG from scratch](/blog/rag-from-scratch-2026-tutorial).
