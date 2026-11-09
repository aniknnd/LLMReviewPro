## What you will learn

Python for AI in 2026: NumPy, pandas, scikit-learn, and the patterns behind every LLM data pipeline. If you can run this tutorial's 5 projects, you can build RAG, fine-tune, and ship agents.

**Prerequisites:** our [Python complete tutorial](/blog/python-complete-tutorial-2026) (variables, functions, classes, venvs).

## Table of contents

1. NumPy: the array engine
2. pandas: the table engine
3. Data cleaning patterns
4. scikit-learn in 20 lines
5. Project: RAG preprocessing
6. Project: fine-tune prep
7. Checklist

## 1. NumPy: the array engine

```python
import numpy as np
a = np.array([1, 2, 3, 4])
print(a * 2)        # [2 4 6 8] — vectorized, no loop
print(a.mean(), a.std())
m = np.array([[1, 2], [3, 4]])
print(m.T)          # transpose
# Broadcasting: (3,1) + (3,) works without copying
```

**Rule:** if you write a `for` over numbers, NumPy does it faster. Lists for logic, arrays for math.

## 2. pandas: the table engine

```python
import pandas as pd
df = pd.read_csv("data.csv")
print(df.shape)                         # (rows, cols)
print(df.head(5))                       # first rows
print(df.describe())                    # stats
print(df.groupby("category")["value"].mean())  # groupby = SQL in Python
df.to_json("out.json", orient="records")
```

**Groupby is the superpower:** 80% of data work is filter → group → aggregate.

## 3. Data cleaning patterns

```python
df = pd.read_csv("raw.csv")
df = df.dropna(subset=["email"])        # drop missing keys
df["email"] = df["email"].str.strip().str.lower()
df = df.drop_duplicates()
df.to_csv("clean.csv", index=False)
```

Clean once, in a notebook/script with checks (`assert df["email"].notna().all()`), then downstream is easy.

## 4. scikit-learn in 20 lines

```python
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
clf = LogisticRegression(max_iter=1000).fit(X_train, y_train)
print(accuracy_score(y_test, clf.predict(X_test)))
```

That pattern (split → fit → score) is the same for every sklearn model. Start linear; reach for trees/deep only when linear plateaus.

## 5. Project: RAG preprocessing

```python
# Read docs, chunk, embed, index (see RAG tutorial for full pipeline)
from pathlib import Path
chunks = []
for f in Path("docs").glob("*.txt"):
    text = f.read_text()
    # sentence-aware chunking (500 tokens, 50 overlap)
    words = text.split()
    for i in range(0, len(words), 450):
        chunks.append(" ".join(words[i:i+500]))
print(f"{len(chunks)} chunks ready for embeddings")
```

## 6. Project: fine-tune prep

```python
import json
rows = [{"instruction": "Summarize", "input": t, "output": s} for t, s in pairs]
with open("train.jsonl", "w") as f:
    for r in rows:
        f.write(json.dumps(r) + "\n")
print(f"Wrote {len(rows)} pairs — validate before training")
```

## 7. Checklist

- [ ] NumPy vectorize (no number loops)
- [ ] pandas groupby for every table
- [ ] Clean + assert before modeling
- [ ] sklearn split→fit→score as default
- [ ] RAG preprocessing + fine-tune prep runnable

## FAQ

### NumPy vs pandas?

NumPy for arrays/math, pandas for tables. AI uses both.

### Do I need PyTorch for this?

No — sklearn + APIs carry you far. PyTorch is for custom training.

## Verdict

NumPy for numbers, pandas for tables, sklearn for models. Master those three and every LLM tutorial after this is readable. Next: [RAG from scratch](/blog/rag-from-scratch-2026-tutorial) and [fine-tuning](/blog/llm-fine-tuning-complete-guide-2026).
