## What you will learn

Build Retrieval-Augmented Generation (RAG) from scratch in Python — chunking, embeddings, vector search, reranking, and evals. By the end you will have a working Q&A system over your own PDFs that answers with citations. This is the stack behind 90% of enterprise AI in 2026.

**Prerequisites:** Python basics (see our Python tutorial), an LLM API key, ~$1 for embeddings.

## Table of contents

1. What RAG is (and is not)
2. Architecture in one diagram
3. Chunking strategies
4. Embeddings & vector stores
5. Retrieval + reranking
6. Generation with citations
7. End-to-end code (Runnable)
8. Evaluation
9. Production checklist

## 1. What RAG is (and is not)

RAG = retrieve relevant chunks → stuff them into the prompt → generate. It solves **knowledge** (stale/wrong facts), not **behaviour** (tone/format — that is fine-tuning).

Without RAG, the model guesses. With RAG, it grounds every claim in your documents. The price: chunking and retrieval quality decide everything.

## 2. Architecture

```text
PDFs → Chunk → Embed → Vector DB
                           ↓ query → Retrieve top-k → Rerank → Prompt → LLM → Answer + citations
```

Five moving parts. Each can break. This tutorial makes each explicit so you can debug it.

## 3. Chunking strategies

Chunk size is the #1 RAG decision. Too big: embeddings blur topics. Too small: answers lose context.

| Strategy | Size | Best for |
|---|---|---|
| Fixed | 500 tokens, 50 overlap | General docs, fastest start |
| Sentence-aware | 300–800 tokens, split on paragraphs | Articles, policies |
| Recursive semantic | Varies, merges small chunks | Code, manuals |
| By section | Per heading | Specs, runbooks |

**Starting point:** 500 tokens, 50 overlap, sentence-aware. Tune on your eval (section 8), not by gut.

```python
def chunk_text(text: str, size: int = 500, overlap: int = 50):
    words = text.split()
    out, start = [], 0
    while start < len(words):
        end = min(start + size, len(words))
        out.append(" ".join(words[start:end]))
        start = max(end - overlap, start + 1)
    return out
```

## 4. Embeddings & vector stores

Embeddings map text to vectors; similar text → similar vectors. OpenAI `text-embedding-3-small`, Cohere, or open models (BGE, Qwen) all work. Dim 512–1536, cosine similarity.

```python
from openai import OpenAI
client = OpenAI()

def embed(texts: list[str]) -> list[list[float]]:
    r = client.embeddings.create(model="text-embedding-3-small", input=texts)
    return [d.embedding for d in r.data]
```

Vector store options: **Chroma** (local, easiest), **pgvector** (Postgres, production), **Pinecone/Weaviate** (managed). Start with Chroma:

```python
import chromadb
db = chromadb.Client()
col = db.create_collection("docs")
col.add(ids=[str(i) for i in range(len(chunks))], embeddings=embs, documents=chunks)
```

## 5. Retrieval + reranking

Retrieve top-10 by cosine, then rerank with a cross-encoder (e.g. `rerank` models) to top-3. Reranking is the cheapest accuracy win.

```python
hits = col.query(query_embeddings=emb, n_results=10)["documents"][0]
# rerank with a small model or LLM call → keep best 3
```

**Hybrid search** (vector + BM25 keyword) beats pure vector on exact IDs, codes, and names. Use both and merge.

## 6. Generation with citations

```python
context = "\n\n---\n\n".join(f"[{i}] {c}" for i, c in enumerate(top3))
prompt = f"""Answer using ONLY the sources below. Cite as [0], [1], [2].
If unsure, say "Not in sources".
Sources:
{context}
Question: {q}
Answer:"""
```

Citations make answers verifiable and eval measurable. Without them, you cannot tell hallucination from grounding.

## 7. End-to-end code

```python
from pathlib import Path
from openai import OpenAI
import chromadb

llm = OpenAI()
db = chromadb.Client()
col = db.get_or_create_collection("docs")

# Index
for i, f in enumerate(Path("docs").glob("*.txt")):
    chunks = chunk_text(f.read_text())
    embs = embed(chunks)
    col.add(ids=[f"{i}-{j}" for j in range(len(chunks))], embeddings=embs, documents=chunks)

# Query
q = "What is the refund window?"
qe = embed([q])
hits = col.query(query_embeddings=qe, n_results=3)["documents"][0]
ctx = "\n\n".join(hits)
ans = llm.chat.completions.create(
    model="gpt-5-mini",
    messages=[{"role": "user", "content": f"Sources:\n{ctx}\n\nQ: {q}\nA:"}],
).choices[0].message.content
print(ans)
```

That is a working RAG system in ~40 lines. The rest of production is evals and tuning.

## 8. Evaluation

Build 50 Q&A pairs with gold spans. Measure:

- **Recall@k:** is the gold chunk in top-k?
- **Answer faithfulness:** is every claim in the answer in the sources?
- **Citation precision:** do [0],[1] point to the right chunks?

If recall@10 <80%, fix chunking/indexing before touching prompts. If recall is high but answers still wrong, fix generation (citations, instructions).

## 9. Production checklist

- [ ] Sentence-aware chunking, 500/50
- [ ] Hybrid search (vector + BM25)
- [ ] Rerank 10→3
- [ ] Citations enforced
- [ ] 50-pair eval, recall@10 ≥85%
- [ ] Cost tracked per query (embeddings + LLM)

## FAQ

### Chunk size?

Start 500/50 sentence-aware. Tune on eval.

### Best vector DB?

Chroma to start, pgvector to scale, managed for zero-ops.

### RAG vs fine-tuning?

RAG for knowledge, fine-tuning for behaviour. Production uses both.

## Verdict

RAG is chunk → embed → retrieve → rerank → generate with citations. Get recall high first, then tune generation. Pair with [fine-tuning](/blog/llm-fine-tuning-complete-guide-2026) for tone and [prompt engineering](/blog/prompt-engineering-complete-guide-2026) for shape.
