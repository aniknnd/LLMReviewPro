## What you will learn

How to install and set up the AI IDEs and apps developers actually use in 2026 — **Cursor**, **Windsurf**, **VS Code + Copilot**, and the Claude Code CLI (for Anthropic users) — plus a decision table for which to pick. Official sources only, no fake pricing.

**Prerequisites:** a computer. That is it — each guide below is a 5-minute install.

## Table of contents

1. Which AI IDE should you pick?
2. Cursor (VS Code fork)
3. Windsurf (Cascade agent)
4. VS Code + Copilot (your current editor)
5. Claude Code (CLI agent, brief)
6. Checklists, pricing honesty & FAQ

## 1. Which AI IDE should you pick?

| Pick this if… | IDE |
|---|---|
| You want a full AI-first fork of VS Code | **Cursor** |
| You want an agent that writes multi-file changes | **Windsurf (Cascade)** |
| You already live in VS Code | **VS Code + Copilot** |
| You live in the terminal (agents, scripts) | **Claude Code / Codex / OpenCode** (see their guides) |
| You want max privacy / offline | **VS Code + Ollama** (local models) |

All three GUI IDEs import your VS Code settings/extensions. The difference is the agent UX and model routing, not the editor core.

## 2. Cursor (VS Code fork, AI-first)

**What it is:** a fork of VS Code with Tab autocomplete, inline edit, and codebase-aware chat baked in. Free tier to try; paid tiers for higher limits. Pricing changes — check `cursor.com/pricing` (do not trust blog prices).

**Install:**

1. Go to **cursor.com/download**.
2. Pick macOS (Apple Silicon/Intel), Windows, or Linux.
3. Run the installer, launch Cursor.
4. **Import settings/extensions** from VS Code when prompted (one click — keeps themes, keybinds, extensions).
5. Sign in, pick a model (Cursor routes GPT/Claude/Gemini or your API key), and open a folder.

**First 10 minutes:**

- `Cmd/Ctrl + L`: chat about the codebase ("Where is auth handled?").
- `Cmd/Ctrl + K`: inline edit ("Add input validation here").
- `Tab`: autocomplete on the next edit.

**Tip:** turn on "Use codebase" for repo-aware answers; turn off for quick snippets (cheaper).

## 3. Windsurf (Cascade agent, by Codeium)

**What it is:** a VS Code fork where **Cascade** (the agent) plans multi-file edits and you review the diff. Free tier available; Pro for higher usage. Check `codeium.com/windsurf` for current plans.

**Install:**

1. Go to **codeium.com/windsurf** (official).
2. Download for your OS, run the installer, launch Windsurf.
3. Sign in, import VS Code settings if prompted.
4. Open Cascade (`Cmd/Ctrl + I` or the panel) and ask: "Explain this repo, then add tests for `utils.py`."

**Cascade workflow:** Cascade proposes diffs → you accept/reject per hunk → it runs commands (with your approval). Always review the diff; the agent is fast but not infallible.

**Windsurf vs Cursor:** Cursor wins on autocomplete + chat polish; Windsurf wins on agentic multi-file flows. Many devs install both and use them for different tasks.

## 4. VS Code + Copilot (keep your editor)

**What it is:** the most installed path — Visual Studio Code plus GitHub Copilot (autocomplete) and/or Copilot Chat. No fork, no migration.

**Install:**

1. Download **code.visualstudio.com** → install → launch.
2. Install extensions: **GitHub Copilot** and **GitHub Copilot Chat**.
3. Sign in to GitHub, pick a model (or your API key), enable per-language autocomplete.

**Alternatives inside VS Code:** Continue, Codeium, or Ollama (local) if you want free/offline inference. All are extensions — no fork needed.

**When this wins:** teams standardized on VS Code, strict extension policies, or regulated environments where a fork is blocked.

## 5. Claude Code (CLI agent — brief)

Claude Code is Anthropic's terminal agent (not an IDE). If you use Claude Desktop, add this for repo work:

```bash
# macOS / Linux / WSL
curl -fsSL https://claude.ai/install.sh | bash
# Windows PowerShell
irm https://claude.ai/install.ps1 | iex
claude --version   # verify
claude             # start
```

Or via npm (Node 22+): `npm install -g @anthropic-ai/claude-code`. Always verify the install URL via Anthropic docs (`docs.claude.com` / `docs.anthropic.com`) — install scripts are a common phishing vector. See our Claude Desktop guide for the desktop app; this CLI is the agent that edits repos.

## 6. Checklists, pricing honesty & FAQ

**Install checklist (any IDE):**

- [ ] Downloaded from the official domain above
- [ ] Imported VS Code settings/extensions
- [ ] Signed in + model/API key set
- [ ] Opened a *copy* of a repo first (review diffs)
- [ ] Ran one small task (explain) before a big refactor

**Pricing honesty:** Cursor, Windsurf, Copilot, and Claude all change limits and prices without notice. This guide does not quote dollar figures because they would be stale or false within weeks. Check the official pricing page for your region before subscribing. Free tiers (Cursor/Windsurf/Copilot free, Ollama local) are the safe way to evaluate.

**Security:** only official domains (`cursor.com`, `codeium.com`, `code.visualstudio.com`, `claude.com`). Review installer signatures. Never paste API keys into unsourced scripts.

### FAQ

### Cursor vs Windsurf vs Copilot?

Cursor for autocomplete/polish, Windsurf for agents, Copilot to stay in VS Code. Try free tiers side-by-side on the same repo.

### Can I use local models (Ollama) in these IDEs?

Yes — Cursor/Windsurf/VS Code all support Ollama or OpenAI-compatible local servers. Free, private, slower.

### Do I still need the CLI agents (Codex, OpenCode, Claude Code)?

IDEs are great for interactive edits. CLI agents win for scripts, evals, and unattended runs. Many devs use both.

### Migration pain?

All three import VS Code settings/extensions on first launch. Budget 10 minutes, not a day.

## Verdict

Pick Cursor for polish, Windsurf for agents, VS Code + Copilot to stay put — and keep a CLI agent (OpenCode, Codex, or Claude Code) for terminal workflows. Install only from official domains, evaluate free tiers, and check live pricing before paying.
