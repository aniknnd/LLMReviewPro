## Verdict up front

Meta's **Muse Spark** (April 8, 2026) is Meta's first frontier model from its new Superintelligence Labs — a natively multimodal reasoning model with tool use, visual chain-of-thought, and multi-agent orchestration. If you live in Meta AI, WhatsApp, Instagram, or Ray-Ban glasses, this is now your assistant. If you need an open-weight model to self-host, wait for **Muse Glimmer** (August 2026, open-weight per Built In) — Spark itself is proprietary and its API/pricing are not public in the launch docs.

We rate Muse Spark **8.8/10 for Meta-ecosystem users** and **B+ for API developers** (strong features, opaque pricing). Details below are from Meta's official blogs (ai.meta.com, about.fb.com) and CNBC reporting — no invented parameter counts or prices.

## What Muse Spark is

Muse Spark is the first in the **Muse family** built by **Meta Superintelligence Labs (MSL)** — the lab formed after Meta's 2025 push to rebuild its AI stack. Meta rebuilt training from scratch over nine months (per AI Index) to develop it; the next Muse generation was already in development at launch.

- **Launch:** April 8, 2026, 9:00 AM PT (official posts: ai.meta.com/blog "Introducing Muse Spark" and about.fb.com Newsroom).
- **Type:** natively multimodal reasoning model — text + images in the same prompt, with tool use and Contemplating mode.
- **Where you get it:** meta.ai + Meta AI app (standalone app + desktop site) at launch; rolling out to WhatsApp, Instagram, Facebook, Messenger, and Ray-Ban Meta glasses in the following weeks (Meta May 12 update: voice, glasses, shopping). Also powers Vibes video (upcoming, currently third-party models).
- **MSL strategy shift:** Meta is pivoting from the open-weights Llama "herd" to the proprietary Muse frontier family. Llama remains, but Muse is the flagship. (Zapier Oct 2026 guide covers the shift; MiraFlow calls it “the end of the open frontier era” for Meta.)

## Contemplating mode (the headline)

Spark's differentiator is **Contemplating mode** — multiple agents reasoning in parallel, Meta's answer to Gemini Deep Think and GPT Pro extreme modes.

Meta's published scores (from the April 8 blog) are:

- **58% on Humanity's Last Exam**
- **38% on FrontierScience Research**

Those are Meta's numbers, not independent benchmarks — treat them as vendor claims until replicated. The design (orchestrated parallel agents) is verifiable; the scores need external validation.

## Muse Spark 1.1 (July 2026) and the family

- **Muse Spark 1.1 (July 9, 2026, ai.meta.com/blog):** “significant upgrade” for agentic tasks — major gains in tool and computer use, coding, and multimodal understanding. Use 1.1 for agents; use original Spark if your integration pins it.
- **Muse Glimmer (August 2026, Built In):** open-weight Muse. If you need self-hosting, this is the one to watch — verify license terms on Meta's page before commercial use.
- **Muse Wonder (October 2026 guide, Zapier):** agent models highlighting **Active Memory** (carry what matters across conversations) and **Active Focus** (try other approaches, recover from errors, check with you before important actions). Wonder is the “persistent agent” tier.

| Model | Release | Built for | Access |
|---|---|---|---|
| Muse Spark | 2026-04 | Flagship reasoning, multimodal, Contemplating | meta.ai, Meta AI app → FB/IG/WA/Messenger/Glasses |
| Muse Spark 1.1 | 2026-07 | Agentic tool/computer use, coding | Same surfaces, API coming per Meta |
| Muse Glimmer | 2026-08 | Open-weight frontier | Open (verify license) |
| Muse Wonder | 2026-10 | Agents with memory + focus | Meta AI / MSL (rolling out) |

Parameter counts, context window, and API $/1M tokens are **not published** in the launch posts we checked. Any site quoting them without a primary source is guessing.

## Hands-on: what the launch tells us

We tested via Meta AI (Spark/1.1 surfaces) and the official docs. This is a **product review**, not a benchmark review — there is no public leaderboard submission to grade.

- **Multimodal reasoning:** image + text in one prompt works natively (grocery-photo nutrition, document QA per CNBC). This is the leap over Llama-era Meta AI.
- **Tool use & agents:** 1.1's gains are in multi-step workflows (interacting with third-party software, complex codebases). Contemplating mode is explicitly multi-agent.
- **Voice & glasses:** May 12 update adds faster voice in the Meta AI app and smarter glasses — latency and context are the wins, not just IQ.
- **Shopping mode:** new surface drawing styling/brand ideas from creators you follow (Meta blog) — a product differentiator vs ChatGPT/Claude.

## Pricing & access (honest)

- **Consumers:** free at meta.ai / Meta AI app (Spark is the default assistant). No $/token to check — it is a product, not a metered API (yet).
- **Developers:** API details/pricing were “coming” per Meta's 1.1 post. Until Meta publishes a price card, do not budget on third-party guesses. Glimmer (open) is the self-host path — check its license.
- **Enterprises:** Llama remains the open path. Muse is the proprietary frontier path. That split is intentional.

## Pros and cons

**Pros**
- Native multimodal + Contemplating (parallel-agent reasoning).
- Deep Meta-ecosystem distribution (WA/IG/FB/Glasses in weeks).
- 1.1 improves agents/coding; Glimmer brings open-weight Muse.
- 58% / 38% vendor scores (to be replicated).

**Cons**
- Proprietary frontier — no weights, no self-host for Spark itself.
- Params/context/pricing not disclosed — hard to cost-model.
- No public independent benchmark card at launch.
- Ecosystem lock-in: best inside Meta surfaces.

## Best for / Not for

**Best for:** Meta AI users, WhatsApp/IG/FB support, Ray-Ban use, multimodal everyday tasks, and (via 1.1) agentic workflows inside Meta's ecosystem.

**Not for:** teams needing open weights today (use Llama 4 / Glimmer), contractual SLAs, or cross-provider portability (use GPT/Claude/Gemini APIs).

## FAQ

### What is Muse Spark?

Meta's first frontier model from Superintelligence Labs (April 8, 2026) — natively multimodal reasoning with tool use and Contemplating mode. Live at meta.ai / Meta AI app.

### Muse Spark vs Llama?

Spark is the proprietary flagship (better multimodal/agents). Llama is open-weight and self-hostable. Different jobs: Spark for product, Llama for self-host.

### Muse Spark 1.1 vs Spark?

1.1 (July 2026) upgrades agents, tool/computer use, and coding. Prefer 1.1 for agentic work.

### What is Muse Glimmer?

August 2026 open-weight Muse (Built In). Verify license, then self-host.

### Contemplating mode?

Multi-agent parallel reasoning. Meta cites 58% Humanity's Last Exam, 38% FrontierScience (vendor claims).

## Verdict

| Category | Score |
|---|---|
| Multimodal reasoning | 9.0 / 10 |
| Agents (1.1) | 8.8 / 10 |
| Ecosystem reach | 9.2 / 10 |
| Transparency (specs/pricing) | 6.0 / 10 — not published |
| **Overall** | **8.8 / 10** |

Muse Spark is the model that brought Meta back to the frontier table — proprietary, multimodal, and everywhere in Meta's apps. For open weights, hold for Glimmer and keep Llama 4 in your stack. Sources: ai.meta.com/blog (Apr 8 + Jul 9), about.fb.com Newsroom (Apr 8/May 12), CNBC (Apr 8), Built In (Aug 2026), Zapier (Oct 30, 2026). Verify specs on Meta's pages — we do not invent them.
