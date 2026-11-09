## What you will learn

Build AI agents in 2026 — the perceive → plan → act → observe loop — with LangGraph (graphs, not chains), tools with validation, memory, and human-in-the-loop. Includes a runnable agent that browses, reasons, and acts safely.

**Prerequisites:** Python, LLM API, comfort with async. No LangChain background needed (we build the loop explicitly).

## Table of contents

1. What an agent is (and is not)
2. The minimal loop
3. Graphs > chains (LangGraph)
4. Tools with Zod validation
5. Memory (short, long, episodic)
6. Human-in-the-loop
7. Runnable agent
8. Failure modes & evals

## 1. What an agent is (and is not)

An agent is a loop where the model chooses the next action, a tool executes it, and the result feeds back:

```text
perceive → plan → act → observe → (repeat until done)
```

It is not a longer prompt. Agents need tools, state, and stopping rules. If your task is one step, skip agents — a single LLM call is cheaper.

## 2. The minimal loop

```python
async def run_agent(goal: str, max_steps: int = 10):
    obs = ""
    for step in range(max_steps):
        action = await llm.plan(goal, obs)   # model picks tool + args
        obs = await tools.execute(action)    # validated execution
        if action.done:
            break
    return obs
```

Three rules: cap steps, validate every tool argument, log every step. Without them, agents loop, hallucinate tools, and burn budget.

## 3. Graphs > chains (LangGraph)

Chains are linear (A→B→C). Agents branch, loop, and resume. LangGraph models state as a graph:

```python
from langgraph.graph import StateGraph, END

class State:
    goal: str
    obs: str
    steps: int

graph = StateGraph(State)
graph.add_node("plan", plan_node)
graph.add_node("act", act_node)
graph.add_conditional_edges("plan", should_continue, {"act": "act", END: END})
```

**Why graphs:** you can add human gates, retries, and parallel branches without rewriting. Chains cannot.

## 4. Tools with validation

Every tool needs a schema. Use Zod/Pydantic so bad args fail fast:

```python
from pydantic import BaseModel

class SearchArgs(BaseModel):
    query: str
    max_results: int = 5

async def search(args: SearchArgs) -> str:
    return f"Results for: {args.query}"
```

Never trust model output. Validate, then execute. Log the call.

## 5. Memory

| Type | What | When |
|---|---|---|
| Short (context) | Current window | Always |
| Long (vector) | Past episodes | Personalization |
| Episodic (DB) | Run history | Debugging, learning |

Start with context only. Add vector memory when the agent repeats itself. Persist run traces in Postgres for evals.

## 6. Human-in-the-loop

For irreversible actions (email, charge, delete), gate them:

```python
if action.tool in ("send_email", "charge_card"):
    approved = await ask_human(action)  # UI/CLI prompt
    if not approved:
        obs = "Rejected by human. Try a safer action."
        continue
```

No exceptions in production. The gate is the product.

## 7. Runnable agent (Python)

```python
import asyncio
from pydantic import BaseModel
from openai import OpenAI

client = OpenAI()

class Final(BaseModel):
    answer: str

async def plan(goal: str, obs: str):
    r = client.chat.completions.create(
        model="gpt-5-mini",
        messages=[{"role": "user", "content": f"Goal: {goal}\nObs: {obs}\nReply with tool JSON or done."}],
        response_format={"type": "json_object"},
    )
    return r.choices[0].message.content

async def main():
    obs = ""
    for _ in range(5):
        raw = await plan("Find GPT-5 price", obs)
        print(raw)
        obs = f"Observed: {raw}"
        if "done" in raw.lower():
            break

asyncio.run(main())
```

Extend with real tools (search, code exec, file read) behind validated schemas.

## 8. Failure modes & evals

- **Runaway loops:** cap steps + $ budget per run.
- **Tool hallucination:** validate args, allowlist tools.
- **No traces:** log every step; you cannot debug what you cannot see.
- **Eval:** 30 episodes, success = task done + steps < cap. Gate deploys on pass rate.

## FAQ

### LangGraph vs plain loop?

Under 10 steps, plain async/await. For branches, resume, and gates, LangGraph.

### Best first agent?

Research agent (search → summarize → cite). Low risk, high value.

## Verdict

Agents are loops with tools, state, and gates. Build the loop explicitly, validate tools, gate risky actions, and eval episodes. Pair with [RAG](/blog/rag-from-scratch-2026-tutorial) for knowledge and [evals](/blog/llm-evaluation-harness-2026-build-your-own) for safety.
