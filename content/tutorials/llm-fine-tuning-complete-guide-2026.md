## What you will learn

How to fine-tune an LLM in 2026 — from collecting data to LoRA training, evaluation, and deployment. This is the complete, runnable guide: dataset format, SFT with Hugging Face + LLaMA-Factory, hyperparameters that matter, and how not to burn $2,000 on a bad run.

**Prerequisites:** Python basics, comfort with the command line, and access to a GPU (cloud A10G/L4/H100 or local 24GB+). CPU-only is possible for tiny adapters but not practical for full training.

**Time & cost:** dataset + eval (1 day), first LoRA run (2–4 hours, $1–$5 on cloud), deployment (1 hour). Voice of experience: spend 80% of the time on data and evals, 20% on training.

## Table of contents

1. When to fine-tune (and when not to)
2. Choose your base model
3. Prepare your dataset (the 80% work)
4. LoRA vs full fine-tuning
5. Set up the training environment
6. Train with LLaMA-Factory (no-code friendly)
7. Train with Hugging Face (full control)
8. Hyperparameters that matter
9. Evaluate like you mean it
10. Deploy, monitor & iterate
11. Pitfalls, costs & checklist

## 1. When to fine-tune (and when not to)

Fine-tuning controls **behaviour** (tone, format, task discipline). RAG controls **knowledge** (facts). If your model knows the facts but answers in the wrong format, fine-tune. If it answers in the right format but with stale facts, RAG first.

**Fine-tune when:**

- Output must follow a strict format (JSON, XML, code style) every time
- Domain language matters (medical, legal, support tone)
- You need consistent behaviour across 10k+ calls
- Prompting has plateaued (you have tried system prompts, few-shot, constrained decoding)

**Do not fine-tune when:**

- The problem is missing facts (use RAG)
- You have <200 quality examples (collect more first)
- You need the model to be better at reasoning generally (fine-tuning does not add IQ)

> **Rule:** Prompt first, RAG second, fine-tune third. Most teams skip to step 3 and regret it.

## 2. Choose your base model

Pick the smallest model that wins your evals. Starting points in 2026:

| Goal | Base model | Why |
|---|---|---|
| General chat / RAG | Llama 4 Maverick, Qwen3 32B | Open, fast, good instruction following |
| Reasoning (math/logic) | DeepSeek R1, Qwen3 235B | Chain-of-thought strength |
| Coding | Qwen2.5-Coder 32B, DeepSeek Coder | Repo-level code |
| Frontier quality (API) | GPT-5 mini, Claude Haiku | If you must stay API, fine-tune via provider |
| Private / offline | Llama 3.1 8B/70B, Phi-4 | Small, self-hostable |

**Licence matters:** check Llama Community License vs Apache 2.0 (Qwen, DeepSeek) for commercial use. For most commercial apps, Qwen/DeepSeek Apache avoids Llama's use restrictions.

**Size tip:** an 8–32B open model fine-tuned well beats a 70B prompted poorly. Start with 8B for your first run — it trains 10× faster.

## 3. Prepare your dataset (the 80% work)

You need **500–2,000** high-quality pairs minimum. Quality beats quantity: 500 perfect examples beat 5,000 noisy ones.

**Format (Alpaca-style, works with SFT):**

```json
{"instruction": "Summarize this ticket in one line.", "input": "Ticket #4821: refund failed...", "output": "Refund failed for order 4821."}
```

**Collection rules:**

1. **Real prompts**, not synthetic. Scrub PII.
2. **Ideal outputs** — write them yourself or best-model + human review. Never train on raw model output without review.
3. **Diverse**: cover edge cases, refusals, long/short. If everything looks the same, the model will overfit to that.
4. **Split**: 90% train / 10% held-out eval. Never train on eval.

**Cleaning checklist:**

- Dedupe near-identical pairs.
- Remove contradictory outputs for the same input.
- Cap length: truncate at your model's context (e.g. 2,048 tokens).
- Balance: no single template should exceed 20% of data.

```python
import json
rows = [json.loads(l) for l in open("train.jsonl")]
print(f"{len(rows)} pairs")
assert all(set(r) == {"instruction", "input", "output"} for r in rows)
```

## 4. LoRA vs full fine-tuning

**LoRA (recommended first):** freeze the base model, train small adapter matrices (rank r=16–64). 100× fewer trainable params, 10× faster, easy to swap adapters.

**Full fine-tuning:** update every parameter. Slightly higher ceiling, 10× cost, needs more GPUs. Use only when LoRA plateaus and you have the budget.

In 2026, **LoRA wins for 95% of teams**. Full fine-tuning is for frontier labs and large catalogs.

## 5. Set up the training environment

Cloud is easiest. Any of these work:

```bash
# Cloud (Modal, RunPod, Lambda, Colab Pro): 1×A10G/H100, 24GB+
pip install torch bitsandbytes transformers peft trl datasets accelerate
```

**Local (24GB VRAM, e.g. RTX 4090):** same stack, add `--quantization 4bit` and train 8B LoRA. 70B needs 2× GPUs or provider cloud.

**LLaMA-Factory (easiest path):**

```bash
pip install -e ".[torch,metrics]"
# Configure dataset_info.json pointing at train.jsonl
```

Check versions: `torch>=2.4`, `transformers>=4.45`, `peft>=0.12`. Pin them — breaking changes are common.

## 6. Train with LLaMA-Factory (no-code friendly)

LLaMA-Factory wraps HF trainers behind YAML. Minimum viable config:

```yaml
# train.yaml
model_name_or_path: meta-llama/Llama-3.1-8B
stage: sft
do_train: true
finetuning_type: lora
lora_rank: 16
lora_alpha: 32
lora_dropout: 0.05
dataset: train_data
template: llama3
cutoff_len: 2048
per_device_train_batch_size: 2
gradient_accumulation_steps: 8
learning_rate: 2.0e-4
num_train_epochs: 3.0
lr_scheduler_type: cosine
warmup_ratio: 0.1
bf16: true
output_dir: outputs/llama-lora
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

When you need custom masking or data pipelines, use TRL directly:

```python
from peft import LoraConfig, get_peft_model
from trl import SFTTrainer, SFTConfig
from transformers import AutoModelForCausalLM, AutoTokenizer

model_id = "meta-llama/Llama-3.1-8B"
tok = AutoTokenizer.from_pretrained(model_id)
model = AutoModelForCausalLM.from_pretrained(model_id, load_in_4bit=True, device_map="auto")

lora = LoraConfig(r=16, lora_alpha=32, lora_dropout=0.05, target_modules=["q_proj", "k_proj", "v_proj", "o_proj"])
model = get_peft_model(model, lora)
model.print_trainable_parameters()  # ~0.5% of params

trainer = SFTTrainer(
    model=model,
    train_dataset=dataset,          # your HF Dataset
    args=SFTConfig(max_length=2048, per_device_train_batch_size=2,
                   gradient_accumulation_steps=8, learning_rate=2e-4,
                   num_train_epochs=3, bf16=True, logging_steps=10),
)
trainer.train()
trainer.save_model("outputs/lora-run1")
```

**Completion-only loss** (mask the prompt, train on the response) is what TRL does by default with chat templates — critical for instruction tuning.

## 8. Hyperparameters that matter

| Param | Good start | Notes |
|---|---|---|
| Rank (r) | 16 | 32–64 for complex styles |
| Alpha | 32 (2× r) | Scales the update |
| LR | 2e-4 | 1e-4 if unstable, 3e-4 if slow |
| Epochs | 3 | 2–5; more overfits |
| Batch (effective) | 16 | 2× grad accum 8 |
| Cutoff len | 2048 | Match your longest example |
| Dropout | 0.05 | Regularizes |

**The only two knobs to tune first:** learning rate and epochs. Everything else is secondary. Log every run (wandb or loss plots) — you will not remember what worked.

## 9. Evaluate like you mean it

Hold out 100+ eval prompts never seen in training.

1. **Automated:** exact-match / keyword / JSON schema pass rate.
2. **Human:** 1–5 ratings on 50 samples (tone, correctness, format).
3. **A/B:** side-by-side vs base prompt model. Win rate >70% to ship.

```python
def eval_model(model, eval_set):
    wins = sum(1 for ex in eval_set if judge(model(ex.prompt), ex.expected) > judge(base(ex.prompt), ex.expected))
    print(f"win rate: {wins}/{len(eval_set)}")
```

If win rate <70%, you have a data problem, not a hyperparameter problem. Go back to section 3.

## 10. Deploy, monitor & iterate

**Merge or serve adapter?** For one model, merge LoRA into the base (`merge_and_unload`) and serve the merged model with vLLM/Ollama. For many variants, serve the base + swap adapters.

```bash
# Merge
python -c "from peft import PeftModel; from transformers import AutoModelForCausalLM; m = PeftModel.from_pretrained(base, 'outputs/lora-run1'); m = m.merge_and_unload(); m.save_pretrained('merged')"
# Serve (OpenAI-compatible)
vllm serve merged --port 8000
```

**Monitor:** log every output, sample 10% for human review weekly, track format-failure rate. Re-train monthly or on distribution shift (new ticket types, new tone).

## 11. Pitfalls, costs & checklist

**Common pitfalls:**

- Training on model-generated output without review (compounds errors).
- No held-out eval (you are flying blind).
- Learning rate too high (diverging loss) or too low (no learning).
- Overfitting a tiny dataset (memorizes, generalizes worse than base).
- Ignoring context truncation (cut examples silently lose the answer).

**Cost reality:**

| Setup | Cost |
|---|---|
| 8B LoRA on A10G (3 epochs, 1k samples) | ~$1–$3 |
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

### LoRA or full fine-tune?

LoRA first. Full only when LoRA plateaus and you have GPUs to burn.

### Best base model in 2026?

Maverick/Qwen3 for open general; R1 for reasoning; Qwen-Coder for code. Test on your eval — size is secondary.

### How long does training take?

8B LoRA on 1k samples: 1–3 hours on A10G. 70B: 6–12 hours on H100.

### Do I need RAG too?

Almost always yes. Fine-tuning fixes behaviour, RAG fixes knowledge. Most production stacks run both.

## Verdict

Fine-tuning is a data and eval problem with a training step in the middle. Collect 500 great pairs, train LoRA for 3 epochs, win 70% on held-out evals, merge and serve. Skip any of those and the model will disappoint in production. Start with our Python tutorial if you need the language basics, then pair this with [RAG from scratch](/blog/rag-from-scratch-2026-tutorial) for the full stack.
