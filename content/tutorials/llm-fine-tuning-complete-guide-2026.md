## What you will learn

How to fine-tune an LLM in 2026 — from collecting data to LoRA training to evaluation to deployment — with a **complete, runnable end-to-end example** (invoice JSON extractor). No theory-only tutorials: dataset, training, eval, merge, and serve, all copy-paste.

**Prerequisites:** Python basics, command line, and a GPU (cloud A10G/L4/H100 or local 24GB+). CPU works for tiny adapters but is impractical for full training.

**Time & cost:** dataset + eval (1 day), first LoRA run (1–3 hours, $1–$5 on cloud), deployment (1 hour). Spend 80% of the time on data and evals, 20% on training.

## Table of contents

1. When to fine-tune (and when not to)
2. Choose your base model
3. Prepare your dataset (the 80% work)
4. LoRA vs QLoRA vs full fine-tuning
5. Set up the training environment
6. Train with LLaMA-Factory (no-code friendly)
7. Train with Hugging Face (full control)
8. Complete example: invoice JSON extractor (runnable)
9. Hyperparameters that matter (grid + how to tune)
10. Evaluate like you mean it
11. Deploy, monitor & iterate
12. Pitfalls, costs & checklist

## 1. When to fine-tune (and when not to)

Fine-tuning controls **behaviour** (tone, format, task discipline). RAG controls **knowledge** (facts). If your model knows the facts but answers in the wrong format, fine-tune. If it answers in the right format but with stale facts, RAG first.

**Fine-tune when:**

- Output must follow a strict format (JSON, XML, code style) every call
- Domain language matters (medical, legal, support tone, brand voice)
- You need consistent behaviour across 10k+ calls (prompting drifts)
- Prompting has plateaued (system prompt + few-shot + constrained decoding tried)

**Do not fine-tune when:**

- The problem is missing facts (use RAG — see [RAG from scratch](/blog/rag-from-scratch-2026-tutorial))
- You have <200 quality examples (collect more first)
- You need the model to be smarter at reasoning generally (fine-tuning does not add IQ)
- You need up-to-date knowledge (fine-tuned models memorize stale data)

> **Rule:** Prompt first, RAG second, fine-tune third. Most teams skip to step 3 and regret it. Our [prompt engineering guide](/blog/prompt-engineering-complete-guide-2026) covers GE (generalized expansion) prompting; this tutorial starts where prompting stops.

## 2. Choose your base model

Pick the smallest model that wins your evals. Starting points in 2026:

| Goal | Base model | Why |
|---|---|---|
| General chat / RAG | Llama 4 Maverick, Qwen3 32B | Open, fast, instruction following |
| Reasoning (math/logic) | DeepSeek R1, Qwen3 235B | Chain-of-thought strength |
| Coding | Qwen2.5-Coder 32B, DeepSeek Coder | Repo-level code |
| Frontier quality (API) | GPT-5 mini, Claude Haiku | If you must stay API, fine-tune via provider |
| Private / offline | Llama 3.1 8B/70B, Phi-4 | Small, self-hostable |

**Licence matters:** Llama Community License vs Apache 2.0 (Qwen, DeepSeek, Mistral) for commercial use. For most commercial apps, Qwen/DeepSeek Apache avoids Llama's use restrictions. Read the licence before you train.

**Size tip:** an 8–32B open model fine-tuned well beats a 70B prompted poorly. Start with 8B for your first run — it trains 10× faster and costs <$3 to validate the pipeline.

## 3. Prepare your dataset (the 80% work)

You need **500–2,000** high-quality pairs minimum. Quality beats quantity: 500 perfect examples beat 5,000 noisy ones.

**Format (Alpaca-style, works with SFT):**

```json
{"instruction": "Extract invoice fields as JSON.", "input": "INV-4821, Acme Corp, $1,250.00, due 2026-11-30", "output": "{\"invoice_id\": \"INV-4821\", \"vendor\": \"Acme Corp\", \"amount\": 1250.0, \"due_date\": \"2026-11-30\"}"}
```

**Collection rules:**

1. **Real prompts**, not synthetic. Scrub PII (names, emails) before training.
2. **Ideal outputs** — write them yourself or best-model + human review. Never train on raw model output without review (compounds errors).
3. **Diverse**: cover edge cases (missing fields, typos, refusals, long/short). If everything looks the same, the model overfits to that template.
4. **Split**: 90% train / 10% held-out eval. Never train on eval. Store eval in a separate file.

**Cleaning checklist:**

- Dedupe near-identical pairs (difflib or embedding dedupe).
- Remove contradictory outputs for the same input (pick one style and stick to it).
- Cap length: truncate at your model's context (e.g. 2,048 tokens). Count tokens, do not guess.
- Balance: no single template should exceed 20% of data.

```python
import json
rows = [json.loads(l) for l in open("train.jsonl")]
print(f"{len(rows)} pairs")
assert all(set(r) == {"instruction", "input", "output"} for r in rows)
# Quick dedupe check
from collections import Counter
c = Counter(r["input"][:80] for r in rows)
print(f"dupes: {sum(1 for v in c.values() if v > 1)}")
```

## 4. LoRA vs QLoRA vs full fine-tuning

**LoRA:** freeze the base, train adapter matrices (rank r=16–64). 100× fewer trainable params, 10× faster, easy to swap adapters.

**QLoRA:** LoRA + 4-bit quantization. Trains 70B on a single 24GB GPU. Slight quality cost, massive memory win. Use QLoRA when you cannot afford a 48GB+ GPU.

**Full fine-tuning:** update every parameter. Slightly higher ceiling, 10× cost, needs more GPUs. Use only when LoRA plateaus and you have the budget (frontier labs, large catalogs).

In 2026, **LoRA/QLoRA wins for 95% of teams**. Full fine-tuning is for frontier labs.

|  | LoRA | QLoRA (4-bit) | Full |
|---|---|---|---|
| Trainable | ~0.5% | ~0.5% | 100% |
| VRAM (70B) | ~40GB | ~24GB | 200GB+ |
| Speed | Fast | Fast | Slow |
| Quality | 95% of full | 93% of full | 100% |
| Start here? | Yes | If <24GB | No |

## 5. Set up the training environment

Cloud is easiest. Any of these work:

```bash
pip install torch bitsandbytes transformers peft trl datasets accelerate
```

**Cloud (Modal, RunPod, Lambda, Colab Pro):** 1×A10G/H100, 24GB+. **Local (RTX 4090 24GB):** same stack + 4-bit quantization for 70B.

**LLaMA-Factory (easiest path):**

```bash
pip install -e ".[torch,metrics]"
# Configure dataset_info.json pointing at train.jsonl
```

Pin versions: `torch>=2.4`, `transformers>=4.45`, `peft>=0.12`. Breaking changes are common — pin them.

## 6. Train with LLaMA-Factory (no-code friendly)

LLaMA-Factory wraps HF trainers behind YAML. Minimum viable config for our invoice example:

```yaml
# train.yaml
model_name_or_path: Qwen/Qwen3-8B
stage: sft
do_train: true
finetuning_type: lora
lora_rank: 16
lora_alpha: 32
lora_dropout: 0.05
dataset: invoice_data
template: qwen3
cutoff_len: 1024
per_device_train_batch_size: 2
gradient_accumulation_steps: 8
learning_rate: 2.0e-4
num_train_epochs: 3.0
lr_scheduler_type: cosine
warmup_ratio: 0.1
bf16: true
output_dir: outputs/invoice-lora
eval_strategy: steps
eval_steps: 50
logging_steps: 10
save_steps: 100
plot_loss: true
```

```bash
llamafactory-cli train train.yaml
```

Watch the loss curve: it should drop smoothly for 2–3 epochs, then plateau. If it diverges (NaN), halve the learning rate. If it memorizes (train loss → 0, eval loss ↑), you overfit — fewer epochs, more data.

## 7. Train with Hugging Face (full control)

When you need custom masking or data pipelines, use TRL directly (QLoRA shown):

```python
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from trl import SFTTrainer, SFTConfig
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from datasets import Dataset

model_id = "Qwen/Qwen3-8B"
tok = AutoTokenizer.from_pretrained(model_id)
bnb = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type="nf4", bnb_4bit_compute_dtype="bfloat16")
model = AutoModelForCausalLM.from_pretrained(model_id, quantization_config=bnb, device_map="auto")
model = prepare_model_for_kbit_training(model)

lora = LoraConfig(r=16, lora_alpha=32, lora_dropout=0.05, target_modules=["q_proj", "k_proj", "v_proj", "o_proj"])
model = get_peft_model(model, lora)
model.print_trainable_parameters()  # ~0.5%

dataset = Dataset.from_json("train.jsonl")
trainer = SFTTrainer(
    model=model,
    train_dataset=dataset,
    args=SFTConfig(max_length=1024, per_device_train_batch_size=2,
                   gradient_accumulation_steps=8, learning_rate=2e-4,
                   num_train_epochs=3, bf16=True, logging_steps=10,
                   eval_strategy="steps", eval_steps=50),
)
trainer.train()
trainer.save_model("outputs/invoice-lora")
```

**Completion-only loss** (mask the prompt, train on the response) is what TRL does by default with chat templates — critical for instruction tuning.

## 8. Complete example: invoice JSON extractor (runnable)

This is the full pipeline for one task: extract invoice fields as strict JSON. Copy-paste each step.

### Step A — Create the dataset

```python
import json, random

samples = [
    ("INV-4821, Acme Corp, $1,250.00, due 2026-11-30", {"invoice_id": "INV-4821", "vendor": "Acme Corp", "amount": 1250.0, "due_date": "2026-11-30"}),
    ("Invoice 9910 | Beta LLC | 89.99 USD | 2026-12-01", {"invoice_id": "9910", "vendor": "Beta LLC", "amount": 89.99, "due_date": "2026-12-01"}),
    ("No amount on this receipt, vendor Gamma, date 2026-10-05", {"invoice_id": "", "vendor": "Gamma", "amount": None, "due_date": "2026-10-05"}),
]
# Add 500+ real samples in production (this demo uses 3 for brevity — add your own!)
# For the demo, upsample + perturb:
rows = []
for i in range(200):
    inp, out = random.choice(samples)
    rows.append({"instruction": "Extract invoice fields as JSON with keys invoice_id, vendor, amount (number or null), due_date (YYYY-MM-DD). Output JSON only.",
                "input": inp,
                "output": json.dumps(out)})
random.shuffle(rows)
with open("train.jsonl", "w") as f:
    for r in rows:
        f.write(json.dumps(r) + "\n")
with open("eval.jsonl", "w") as f:
    for r in rows[:20]:
        f.write(json.dumps(r) + "\n")
print(f"wrote {len(rows)} train + 20 eval")
```

### Step B — Train (LLaMA-Factory path)

Put `train.jsonl` in `data/` and add to `dataset_info.json`:

```json
{"invoice_data": {"file_name": "data/train.jsonl", "formatting": "alpaca", "columns": {"prompt": "instruction", "query": "input", "response": "output"}}}
```

Then `llamafactory-cli train train.yaml` (reuse §6 config). Wait for `outputs/invoice-lora/adapter_model.safetensors`.

### Step C — Evaluate

```python
import json
from openai import OpenAI

# Serve merged model first (Step D), then eval:
client = OpenAI(base_url="http://localhost:8000/v1", api_key="local")
def extract(text: str) -> dict:
    r = client.chat.completions.create(
        model="invoice-lora",
        messages=[{"role": "user", "content": f"Extract invoice fields as JSON. Text: {text}"}],
        temperature=0.0,
    )
    return json.loads(r.choices[0].message.content)

rows = [json.loads(l) for l in open("eval.jsonl")]
ok = 0
for r in rows:
    got = extract(r["input"])
    want = json.loads(r["output"])
    if got.get("invoice_id") == want.get("invoice_id") and got.get("amount") == want.get("amount"):
        ok += 1
print(f"field accuracy: {ok}/{len(rows)}")
# Ship only if >85% on extraction + JSON always parses.
```

### Step D — Merge + serve with vLLM

```python
from peft import PeftModel
from transformers import AutoModelForCausalLM
base = AutoModelForCausalLM.from_pretrained("Qwen/Qwen3-8B")
model = PeftModel.from_pretrained(base, "outputs/invoice-lora")
model = model.merge_and_unload()
model.save_pretrained("merged/invoice-8b")
```

```bash
vllm serve merged/invoice-8b --port 8000 --served-model-name invoice-lora
curl http://localhost:8000/v1/chat/completions -X POST -H "Content-Type: application/json" \
  -d '{"model":"invoice-lora","messages":[{"role":"user","content":"Extract: INV-99, TestCo, $42, 2026-12-31"}],"temperature":0}' | head -c 500
```

Expected: `{"invoice_id": "INV-99", "vendor": "TestCo", "amount": 42, "due_date": "2026-12-31"}` — always valid JSON, no prose. That discipline is what fine-tuning buys.

### Step E — Monitor

Log every output, sample 10% for human review weekly, track JSON-parse failure rate. If it climbs, the input distribution shifted — re-collect data and retrain.

## 9. Hyperparameters that matter (grid + how to tune)

| Param | Good start | Notes |
|---|---|---|
| Rank (r) | 16 | 32–64 for complex styles |
| Alpha | 32 (2× r) | Scales the update |
| LR | 2e-4 | 1e-4 if unstable, 3e-4 if slow |
| Epochs | 3 | 2–5; more overfits |
| Batch (effective) | 16 | 2× grad accum 8 |
| Cutoff len | 1024–2048 | Match your longest example |
| Dropout | 0.05 | Regularizes |

**How to tune (in order):** (1) LR — halve on divergence, (2) epochs — stop at eval plateau, (3) rank — raise only if underfitting. Log every run (wandb or loss plots). Change one knob at a time.

## 10. Evaluate like you mean it

Hold out 100+ eval prompts never seen in training.

1. **Automated:** exact-match / keyword / JSON schema pass rate.
2. **Human:** 1–5 ratings on 50 samples (tone, correctness, format).
3. **A/B:** side-by-side vs base prompt model. Win rate >70% to ship.

```python
def eval_model(model, eval_set):
    wins = sum(1 for ex in eval_set if judge(model(ex.prompt), ex.expected) > judge(base(ex.prompt), ex.expected))
    print(f"win rate: {wins}/{len(eval_set)}")
```

If win rate <70%, you have a data problem, not a hyperparameter problem. Go back to §3.

## 11. Deploy, monitor & iterate

**Merge or serve adapter?** For one model, merge LoRA (`merge_and_unload`) and serve with vLLM/Ollama. For many variants, serve the base + swap adapters.

**Monitor:** log every output, sample 10% weekly, track format-failure rate. Re-train monthly or on distribution shift (new invoice layouts, new tone).

**Versioning:** tag every adapter (`invoice-lora-v1`, `v2`). Keep the eval set frozen so versions are comparable.

## 12. Pitfalls, costs & checklist

**Common pitfalls:**

- Training on model-generated output without review (compounds errors).
- No held-out eval (flying blind).
- Learning rate too high (diverging) or too low (no learning).
- Overfitting a tiny dataset (memorizes, generalizes worse than base).
- Ignoring context truncation (cut examples silently lose the answer).
- Forgetting completion-only loss (trains on prompts — wastes capacity).

**Cost reality:**

| Setup | Cost |
|---|---|
| 8B LoRA on A10G (3 epochs, 1k samples) | ~$1–$3 |
| 8B QLoRA on RTX 4090 (local) | $0 + electricity |
| 70B LoRA on H100 (same) | ~$20–$60 |
| Full fine-tune 70B | $500+ (avoid) |

**Pre-flight checklist:**

- [ ] ≥500 quality pairs, deduped, PII scrubbed
- [ ] 90/10 train/eval split, eval never trained on
- [ ] LoRA r=16, LR 2e-4, 3 epochs — logged
- [ ] Win rate >70% on held-out eval before deploy
- [ ] Merged model served via vLLM, fallback to API set

## FAQ

### How many examples do I need?

Start with 500 high-quality pairs. More helps, but only if quality holds.

### LoRA or QLoRA or full?

LoRA first. QLoRA if <24GB VRAM. Full only when LoRA plateaus.

### Best base model in 2026?

Maverick/Qwen3 for open general; R1 for reasoning; Qwen-Coder for code. Test on your eval — size is secondary.

### How long does training take?

8B LoRA on 1k samples: 1–3 hours on A10G. 70B: 6–12 hours on H100.

### Do I need RAG too?

Almost always yes. Fine-tuning fixes behaviour, RAG fixes knowledge. Most production stacks run both — see [RAG from scratch](/blog/rag-from-scratch-2026-tutorial).

## Verdict

Fine-tuning is a data and eval problem with a training step in the middle. Collect 500 great pairs, train LoRA for 3 epochs (or run the complete invoice example above), win 70% on held-out evals, merge and serve. Skip any of those and the model will disappoint in production. Start with our [Python tutorial](/blog/python-complete-tutorial-2026) if you need the language basics, then pair this with [RAG from scratch](/blog/rag-from-scratch-2026-tutorial) and [evals](/blog/llm-evaluation-harness-2026-build-your-own) for the full stack.
