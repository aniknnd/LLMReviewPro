## What you will learn

Prompt engineering is the highest-leverage skill in AI 2026 — it turns a $0.10 model into a $10 model. This complete guide covers the patterns that actually work: system prompts, few-shot, chain-of-thought, structured outputs, and debugging. Every technique has a copy-paste template.

**Prerequisites:** comfort with any LLM chat/API. No coding required until section 7 (structured outputs).

## Table of contents

1. The anatomy of a good prompt
2. System prompts (the 80% win)
3. Few-shot examples
4. Chain-of-thought & reasoning
5. Structured outputs (JSON mode)
6. Controls: temp, top-p, length
7. Production patterns (Python)
8. Debugging prompts
9. Anti-patterns
10. Cheat sheet

## 1. The anatomy of a good prompt

A good prompt has four parts:

```text
Role: who the model is
Task: what to do (one verb)
Context: facts it needs
Format: how to answer (shape, length, tone)
```

Weak: `Write about dogs.` → Strong:

```text
Role: You are a vet writing for busy owners.
Task: Explain why dogs pant in one short paragraph.
Context: Audience is new owners, warm tone, no jargon.
Format: 3 sentences max, plain English.
```

## 2. System prompts (the 80% win)

System prompts set defaults for the whole session. Put behaviour there, not in every user turn.

```text
You are a support agent for a SaaS product.
Rules:
- Be concise (max 3 short paragraphs).
- Never promise refunds beyond 30 days.
- If unsure, offer a human handoff.
- Use markdown lists for steps.
```

**Why it works:** one place to change tone/policy for every call. Keep it under 300 words — longer dilutes attention.

## 3. Few-shot examples

Show, do not tell. 2–5 examples beat 500 words of description.

```text
Classify sentiment. Reply with exactly one word: positive, negative, or neutral.

Review: "Love it, fast shipping!" → positive
Review: "Broke in a day." → negative
Review: "It arrived on Tuesday." → neutral
Review: "Great support but pricey."
```

**Rules:** 2–5 examples, cover edge cases, keep the format identical. For classification, few-shot is 10–20 points more accurate than zero-shot.

## 4. Chain-of-thought & reasoning

For math, logic, and multi-step tasks, ask the model to reason before answering. Two techniques:

**Zero-shot CoT:** append `Think step by step, then give the final answer.` Works on GPT/Claude/Gemini without examples.

**Few-shot CoT:** show 2 worked traces, then the test problem. More reliable for coding and evals.

**Modern note:** reasoning models (R1, o-series) think internally — do not add CoT text for them; just ask the question and inspect the trace.

## 5. Structured outputs (JSON mode)

Never parse free text for production. Force JSON:

```python
import openai
client = openai.OpenAI()
resp = client.chat.completions.create(
    model="gpt-5-mini",
    messages=[{"role": "user", "content": "Extract name and email. Text: ..."}],
    response_format={"type": "json_object"},
)
import json
print(json.loads(resp.choices[0].message.content))
```

Better: use provider structured outputs / Pydantic schemas so the model *cannot* return invalid JSON:

```python
from pydantic import BaseModel
class Ticket(BaseModel):
    summary: str
    priority: int
# Pass Ticket as the schema; validation is guaranteed.
```

**Rule:** if you parse it, structure it. Regex is not a schema.

## 6. Controls: temp, top-p, length

| Control | Use | Avoid |
|---|---|---|
| Temperature 0.0–0.3 | Facts, code, JSON, evals | Creative writing |
| Temperature 0.7–1.0 | Brainstorm, marketing, variation | Precision tasks |
| Top-p 0.9 | Default; rarely tune both temp+top-p | — |
| Max tokens | Hard cap; set it (cost control) | Relying on model to stop |

Low temp + short max tokens is the cheapest production configuration. High temp is for divergent work only.

## 7. Production patterns (Python)

```python
import openai, json
client = openai.OpenAI()

SYSTEM = """You are a support triage bot.
Output JSON only: {"priority": "low|high", "reason": "short"}."""

def triage(text: str) -> dict:
    r = client.chat.completions.create(
        model="gpt-5-mini",
        messages=[{"role": "system", "content": SYSTEM},
                  {"role": "user", "content": text}],
        temperature=0.0, max_tokens=200,
        response_format={"type": "json_object"},
    )
    return json.loads(r.choices[0].message.content)

# Retry with fallback model on failure
try:
    print(triage("Refund for order 4821 failed twice"))
except Exception:
    print(triage("Fallback path..."))
```

Log every prompt version. Prompt changes are code changes — version them in git.

## 8. Debugging prompts

1. **Isolate:** one variable at a time (change temp OR examples, not both).
2. **Trace:** dump the full prompt + completion. The bug is usually in your context, not the model.
3. **Eval:** 20 fixed prompts, score pass/fail. If it is not measured, it is vibes.
4. **Bisect:** does removing examples help? Does the system prompt dominate?

## 9. Anti-patterns

- **Shouting** (`IMPORTANT!!!`) — models ignore emphasis.
- **Pleas/no-thanks** — politeness does not change accuracy.
- **Mega-prompts** (2,000 words) — attention dilutes; split into system + context + task.
- **No evals** — you will regress silently on every model bump.
- **Free-text parsing** — always JSON/schema for pipelines.

## 10. Cheat sheet

| Goal | Pattern |
|---|---|
| Classification | Few-shot (3 examples) |
| Reasoning | `Think step by step` + few-shot |
| JSON extraction | JSON mode + schema |
| Tone | System prompt rules |
| Cost | Low temp, short max, small model |
| Agents | Tool schemas + fallback |

## FAQ

### Best prompt technique in 2026?

Few-shot + structured outputs. System prompts for behaviour, examples for format.

### Do reasoning models need CoT prompts?

No. They reason internally. Just ask the question.

### JSON mode vs plain text?

JSON mode for any parsed output. Cost is identical, reliability is not comparable.

## Verdict

Role + task + context + format, few-shot for shape, JSON for pipelines, evals for truth. That is prompt engineering in 2026 — the rest is decoration.
