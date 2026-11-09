## What you will learn

Transformers from zero: tokens, attention, encoder vs decoder, pretraining + SFT + RLHF, and how modern LLMs (GPT, Claude, Gemini, Llama) fit the picture. No deep-math prerequisites — intuition first, equations second.

**Prerequisites:** curiosity. Python helps for the demos but is not required to follow the ideas.

## Table of contents

1. Tokens: the model's alphabet
2. Attention: the core idea
3. Encoder, decoder, encoder-decoder
4. Pretraining, SFT, RLHF
5. Modern LLMs in one table
6. Why context windows matter
7. MoE & efficiency tricks
8. Glossary

## 1. Tokens: the model's alphabet

LLMs do not read characters or words — they read **tokens** (chunks of text). `"Hello world"` might be 2 tokens. `"supercalifragilistic"` might be 5.

```python
# Every token is an ID:
"the cat sat"  →  [464, 3797, 3332]
```

**Why it matters:** cost and context are counted in tokens. 1K tokens ≈ 750 words ≈ 0.75 pages. A 128K window ≈ 100K words — a novel. 1M window ≈ 750K words.

## 2. Attention: the core idea

Attention lets every token look at every other token and decide what matters. `"The cat sat on the mat because it was tired"` — *it* attends most to *cat*.

**Analogy:** a cocktail party where each person hears everyone, but tunes into the people relevant to them. Self-attention is that tuning, learned from data.

**Key insight:** attention is parallel (unlike recurrent nets). That is why transformers train fast on GPUs and power the 2026 era.

## 3. Encoder, decoder, encoder-decoder

| Architecture | Sees | Generates | Used for |
|---|---|---|---|
| Encoder-only (BERT) | All tokens | No | Classification, embeddings |
| Decoder-only (GPT/Llama) | Past tokens | Yes | Chat, coding, generation |
| Encoder-decoder (T5) | All input | Yes | Translation, summarization |

**2026 rule:** almost all frontier LLMs (GPT, Claude, Gemini, Llama, Qwen) are **decoder-only**. They predict the next token, one after another.

## 4. Pretraining, SFT, RLHF

Three stages make a base model into ChatGPT:

1. **Pretraining** (web-scale next-token prediction): the model learns language, facts, code. 10s of trillions of tokens.
2. **SFT** (supervised fine-tuning): human-written Q&A teaches it to follow instructions. See our [fine-tuning guide](/blog/llm-fine-tuning-complete-guide-2026).
3. **RLHF** (human feedback): raters rank outputs; the model learns to be helpful, honest, harmless.

ChatGPT, Claude, Gemini are base + SFT + RLHF. The base alone is not chatty — the post-training is the product.

## 5. Modern LLMs in one table

| Model | Family | Context | Type |
|---|---|---|---|
| GPT-6.1 Sol | OpenAI | 400K | Decoder, API |
| Claude Opus 5.5 | Anthropic | 200K | Decoder, API |
| Gemini 3.1 Pro | Google | 1M | Multimodal, API |
| Llama 4 Maverick | Meta | 1M | MoE, open |
| Qwen3 235B | Alibaba | 128K | MoE, open |
| DeepSeek R1 | DeepSeek | 128K | Reasoning, open |

All are decoder transformers. The differences are scale, data, post-training, and context — not magic.

## 6. Why context windows matter

Context is the working memory. 8K fits a paper. 128K fits a repo. 1M fits a library. Larger context replaces RAG for many tasks — but recall at 100% fill is imperfect. Test on your docs.

## 7. MoE & efficiency tricks

**Mixture-of-Experts (MoE):** split the model into experts; each token activates a few. Llama 4, Qwen3, DeepSeek all use MoE — 400B total params, 17B active per token. Fast and huge.

Other tricks: quantization (INT4), distillation (small student learns from big teacher), speculative decoding (draft + verify).

## FAQ

### Why do LLMs hallucinate?

Next-token prediction optimizes for plausible text, not truth. Grounding (RAG) + evals fix it — not bigger prompts.

### What is a parameter?

A learned number in the network. 70B means 70 billion numbers. More params helps, but data and post-training matter more.

## Glossary

- **Token:** text chunk (see §1)
- **Attention:** token-to-token relevance
- **Context window:** max tokens in one call
- **SFT:** instruction tuning on examples
- **RLHF:** learning from human rankings
- **MoE:** mixture-of-experts (sparse large model)

## Verdict

Transformers = tokens + attention + scale + post-training. Everything else is engineering around that core. Read the [Python tutorial](/blog/python-complete-tutorial-2026) to build with them, then [RAG](/blog/rag-from-scratch-2026-tutorial) and [agents](/blog/ai-agents-with-langgraph-2026) to ship with them.
