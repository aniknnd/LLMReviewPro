## What you will learn

How to install **OpenCode** (the open-source terminal coding agent) on macOS, Windows, and Linux — via the official script, Homebrew, npm, or desktop app — then connect a provider, configure `opencode.json`, and run your first session. This guide follows the official docs at `opencode.ai/docs` (V2) so it works today, not last year.

**What OpenCode is:** an open-source agent that helps you write and run code with any AI model. It ships as a terminal interface (`opencode`), a desktop app, and a web app (`opencode pair`). It is free; model costs depend on the provider you connect (or free tiers like Google AI Studio / Ollama).

**Prerequisites:** terminal comfort. For npm path: Node.js 18+ (20 LTS recommended). For script/Homebrew: nothing else.

## Table of contents

1. Choose an install method
2. Install (script / Homebrew / npm / desktop)
3. Connect a provider
4. Configure (`opencode.json`)
5. Run your first session
6. MCP, agents & customization
7. Update & uninstall
8. Troubleshooting

## 1. Choose an install method

| OS | Recommended | Why |
|---|---|---|
| macOS / Linux | Script or Homebrew | No Node needed, auto-updates |
| Windows (non-WSL) | Desktop app or npm | No package-manager script |
| Windows (WSL) | Script (inside WSL) | Same as Linux |
| Air-gapped / CI | Standalone binary / Docker | No network installs |

Pick **script** if you want the latest V2 quickly. Pick **Homebrew** if you live in Homebrew. Pick **npm** if you already manage Node versions.

## 2. Install

### A. Script (macOS / Linux / WSL) — recommended

```bash
curl -fsSL https://opencode.ai/install | bash
```

This installs the native `opencode` binary for your platform (macOS Apple silicon/Intel, Linux glibc/musl ARM64/x64). Re-run the same command to update.

### B. Homebrew (macOS / Linuxbrew)

```bash
brew install anomalyco/tap/opencode-v2
```

> V1 used `anomalyco/tap/opencode`. The V2 docs list `opencode-v2` — use that for the latest channel. If `brew info` shows V1, follow the docs at `opencode.ai/docs` for your channel.

### C. npm / Bun / pnpm / yarn (Node path)

V2 package is `@opencode/cli`:

```bash
npm install -g @opencode/cli@latest
# or
bun install -g --trust @opencode/cli
pnpm add -g --allow-build=@opencode/cli @opencode/cli
yarn global add @opencode/cli
```

The npm package uses a postinstall script to fetch the native binary for your platform. Allow build scripts (Bun `--trust`, pnpm `--allow-build`) — otherwise the binary will not install.

**V1 (legacy, still on npm):** `npm install -g opencode-ai` (needs Node 18+). Prefer V2 (`@opencode/cli`) for new installs.

### D. Desktop app

Download from **opencode.ai/download** (or `opencode.ai/product`):

- macOS: Apple silicon · Intel
- Windows: x64 · ARM64
- Linux: .deb / .rpm / AppImage (x64 · ARM64)

Launch the app, then connect a provider the same way as the CLI (see §3).

### E. Docker (isolated)

```bash
docker run -it --rm ghcr.io/anomalyco/opencode
```

Use this for sandboxed trials or CI. Mount your project and config as needed.

**Verify:**

```bash
opencode --version
which opencode   # should point to the binary you just installed
```

If `command not found`, your PATH is missing the install dir (often `~/.local/bin` or `~/.opencode/bin`). Restart the terminal or export PATH.

## 3. Connect a provider

OpenCode is model-agnostic (75+ providers, plus local via Ollama). You have three options:

1. **Subscription / API key:** `opencode` → it prompts for a provider (OpenAI, Anthropic via API key, Google, etc.), or set env vars like `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`.
2. **Free tiers:** Google AI Studio (free Gemini key), Groq free tier, or Ollama local models — zero API cost. Follow `opencode.ai/docs` → *Providers* for the current list.
3. **Zen:** OpenCode's handpicked, benchmarked model set for coding agents (validated models, less provider variance).

> **Note (2026):** Anthropic blocked OpenCode from using Claude models in Jan 2026 per third-party guides. If your provider blocks OpenCode, use GPT-5.x / Gemini 3.x via API or local Ollama instead. Always check the provider's terms for your use case.

Authenticate, then list models:

```bash
opencode auth login   # or set *_API_KEY env var
opencode models       # lists available models for your providers
```

## 4. Configure (`opencode.json`)

Project config lives at `./opencode.json` (or global `~/.config/opencode/opencode.json`). Minimal example:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "default_model": "openai/gpt-5-mini",
  "theme": "opencode",
  "permissions": {
    "edit": "ask",
    "bash": "ask"
  }
}
```

Key fields (check `opencode.ai/docs` for the full schema — it changes):

- `default_model`: provider/model to use.
- `permissions`: `allow` / `ask` / `deny` for edit/bash/web.
- `mcp` (Model Context Protocol): add MCP servers for tools (filesystem, GitHub, etc.).
- `agents`: custom agents (e.g. `general`, `plan`, `build`).

**Permissions first:** start with `ask` for `edit`/`bash`. Once you trust the workflow, relax to `allow` per directory.

## 5. Run your first session

```bash
cd your-project
opencode
```

You get a terminal UI (TUI) with a prompt. Examples:

```text
> Explain this repo in 5 bullets.
> Add a /health endpoint with tests.
> Run the test suite and fix failures.
```

Useful flags: `opencode --help`, `opencode run "task"` (non-interactive), `opencode pair` (web UI at the printed URL). Exit with Ctrl-C twice or `/exit` (TUI-dependent).

**First-session checklist:**

- [ ] `opencode --version` works
- [ ] Provider authenticated (`opencode models` lists models)
- [ ] `opencode.json` sets a default model + safe permissions
- [ ] Run one small task (explain, not refactor) and review the diff

## 6. MCP, agents & customization

**MCP servers** extend OpenCode with tools. Add via `opencode.json` under `mcp` (see docs for exact syntax — local stdio vs remote HTTP). Restart after editing.

**Custom agents:** define in `opencode.json` `agents` (or `.opencode/agents/`). Each agent has a prompt, tools, and model. Use `plan` for read-only planning, `build` for edits.

**Themes & keybinds:** set `theme` in config; keybinds live in docs → *Customize*. Keep the default until you have muscle memory.

## 7. Update & uninstall

**Update:**

```bash
curl -fsSL https://opencode.ai/install | bash   # script
brew upgrade anomalyco/tap/opencode-v2          # Homebrew
npm update -g @opencode/cli                     # npm (V2)
npm update -g opencode-ai                       # npm (V1)
```

**Uninstall:** remove the binary (`which opencode` → delete), remove config (`~/.config/opencode/` — back up first), and remove the project `opencode.json` if you no longer use it. Desktop app uninstalls like any app.

## 8. Troubleshooting

| Symptom | Fix |
|---|---|
| `command not found` | PATH missing install dir — restart terminal, check `~/.local/bin` / `~/.opencode/bin` |
| `postinstall` fails (npm) | Allow scripts: Bun `--trust`, pnpm `--allow-build` |
| No models listed | Authenticate a provider or set `*_API_KEY`, then `opencode models` |
| Permission denied | Set `permissions` in `opencode.json`; run as your user, not sudo |
| Old version | You are on V1 (`opencode-ai`) — migrate to V2 (`@opencode/cli`) per docs |

**Security note:** only install from `opencode.ai` / GitHub releases / your package manager. Review the install script before piping to bash on a new machine (`curl ... | head` first). Never paste API keys into the terminal history — use env vars or the auth flow.

## FAQ

### Is OpenCode free?

The agent is open source and free. Model costs apply if you use paid APIs; free tiers (Gemini, Groq, Ollama) keep it at $0.

### V1 (`opencode-ai`) vs V2 (`@opencode/cli`)?

V2 is current (`@opencode/cli`, `opencode-v2` Homebrew tap). V1 is legacy. New installs should use V2 per `opencode.ai/docs`.

### Windows without WSL?

Use the desktop app or `npm install -g @opencode/cli` (needs Node 18+). Windows package managers are limited — npm/desktop are the supported paths.

### Can I use it with local models?

Yes — Ollama (or any OpenAI-compatible local server) as the provider. Zero API cost, private by default.

## Verdict

Install via script (or Homebrew/npm for V2), authenticate a provider, set safe permissions in `opencode.json`, and run `opencode` in your project. That is the whole setup — the rest is prompts, MCP, and agents. Docs: `opencode.ai/docs`.
