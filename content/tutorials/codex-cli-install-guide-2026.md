## What you will learn

How to install and use **OpenAI Codex CLI** (`@openai/codex`) on macOS, Linux, and Windows — via npm, Homebrew, winget, or the official script — then log in, run your first session, and choose the right permissions. This follows the official `openai/codex` repo and npm docs.

**What Codex CLI is:** OpenAI's coding agent that runs locally in your terminal (like `codex "refactor the billing module"`). It has a desktop app (`codex app`), IDE extensions (VS Code, Cursor, Windsurf), and Codex Web (cloud at `chatgpt.com/codex`).

**Prerequisites:** Node.js 18+ for the npm path (16+ minimum per npm, LTS recommended). The script/binary paths need no Node.

## Table of contents

1. Pick an install method
2. Install (npm / Homebrew / winget / script)
3. Log in & verify
4. Run your first session
5. Permissions & sandbox
6. IDE extension & desktop app
7. Update & uninstall
8. Troubleshooting

## 1. Pick an install method

| OS | Recommended | Needs Node? |
|---|---|---|
| macOS / Linux | npm or script | npm yes, script no |
| Windows (PowerShell) | winget or script | winget no, script no |
| Windows (WSL) | npm (inside WSL) | yes (Linux Node) |
| Managed devs | npm (you already manage Node) | yes |
| Air-gapped / CI | Standalone binary from GitHub Releases | no |

If you already live in Node, use **npm**. If you want the fastest clean install with no Node, use the **script**.

## 2. Install

### A. npm (portable, every OS)

```bash
npm install -g @openai/codex
```

> Use the **scoped** package `@openai/codex`, not the unrelated unscoped `codex`. The scoped package is the official one (`openai/codex` repo).

Verify Node first: `node --version` must be 18+ (20 LTS ideal). If you use nvm/fnm, switch before installing.

User-local (no sudo):

```bash
mkdir -p ~/.local/bin
npm install -g @openai/codex --prefix "$HOME/.local"
export PATH="$HOME/.local/bin:$PATH"
```

### B. Homebrew (macOS)

```bash
brew install --cask codex
```

### C. winget (Windows 10+)

```powershell
winget install OpenAI.Codex
```

### D. Official script (macOS / Linux)

```bash
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

### E. PowerShell (Windows)

```powershell
irm https://chatgpt.com/codex/install.ps1 | iex
```

The installer places `codex` for your user. Re-running the command updates it. For unattended installs, docs describe `CODEX_NON_INTERACTIVE=1` — only use after your org reviews the installer defaults.

**Verify:**

```bash
codex --version
which codex   # or: Get-Command codex (PowerShell)
```

## 3. Log in & verify

```bash
codex login
```

This opens a browser → sign in to your ChatGPT/OpenAI account → returns an access token to the terminal. For API-key auth:

```bash
codex login --with-api-key   # then paste your key when prompted
```

Do not put a raw key in a PowerShell profile or a repo. Use the env var the docs describe (`OPENAI_API_KEY`) or the login flow.

**Check health:**

```bash
codex --version
codex models  # if available in your version — otherwise check /status in a session
```

## 4. Run your first session

```bash
cd your-project
codex
```

Or one-shot:

```bash
codex "What does this repo do? Explain in 5 bullets."
codex "Find every place that mutates user state without a lock and propose a fix."
```

Interactive commands (inside the TUI): `/model` (switch model), `/reasoning` (low/high/xhigh), `/permissions` (sandbox level), `/help`. Start at default reasoning; `xhigh` is wonderful in evals and miserable interactively — do not leave it on.

**First-session checklist:**

- [ ] `codex --version` prints a version
- [ ] `codex login` succeeded (browser token returned)
- [ ] One read-only task (explain) works before any edits
- [ ] You know where the git diff will appear

## 5. Permissions & sandbox

Codex runs with a sandbox. Start restrictive, relax per task:

- **Read-only / ask-first:** default for new repos. The agent proposes, you approve edits/commands.
- **Workspace-write:** can edit files in the project, still asks before shell commands outside the sandbox.
- **Full-access:** only for trusted repos and one-off migrations; review every diff.

Use `/permissions` in-session to switch. Never paste the "full-access" incantation into a repo's README or script — that is how secrets get exfiltrated.

**Subagents (2026):** Codex ships a native subagent primitive from inside a session. Use it for parallel exploration ("one agent maps tests, another maps callers"), then merge.

## 6. IDE extension & desktop app

**IDE (VS Code, Cursor, Windsurf):** install the Codex extension from the marketplace (same account as `codex login`). The extension shares your CLI auth and sandbox settings.

**Desktop app:**

```bash
codex app
```

Or visit the Codex App page from the npm README. Use the desktop app for visual diffs; use the CLI for scripts/evals.

**Codex Web:** `chatgpt.com/codex` — cloud agent for async tasks. Not the same as the local CLI.

## 7. Update & uninstall

**Update:**

```bash
npm update -g @openai/codex     # npm
brew upgrade --cask codex       # Homebrew
winget upgrade OpenAI.Codex     # winget
# script: re-run the curl/irm command above
```

**Uninstall:** `npm uninstall -g @openai/codex` (or `brew uninstall --cask codex` / `winget uninstall OpenAI.Codex`), then remove the binary dir and `~/.codex/` config if you want a clean slate (back up first).

## 8. Troubleshooting

| Symptom | Fix |
|---|---|
| `codex: command not found` | PATH — restart terminal; for user-local npm, check `~/.local/bin` |
| Wrong package installed | You installed unscoped `codex` — uninstall, reinstall `@openai/codex` |
| `node` too old | Upgrade to Node 18+ (20 LTS) via nvm/volta, then reinstall |
| `login` loops | Clear browser cookies, retry; or use `--with-api-key` |
| Permission denied | Switch sandbox via `/permissions`; run as your user |

**Security:** only install from npm (`@openai/codex`), GitHub Releases (`openai/codex`), or the official script domains above. Review install scripts before piping to shell.

## FAQ

### npm path's Node requirement?

Official: Node 16+ minimum. Operationally: 18+ (20 LTS) for support and stability.

### Codex CLI vs Codex Web?

CLI is local (your machine, your sandbox). Web is cloud (ChatGPT). Same account, different runtimes.

### Can I use Codex with API keys only?

Yes — `codex login --with-api-key` plus `OPENAI_API_KEY` env. Prefer the browser login for ChatGPT plans.

### Windows — npm or winget?

If you manage Node: npm. If you want no Node: winget or the PowerShell script.

## Verdict

Install with `npm install -g @openai/codex` (or Homebrew/winget/script by OS), run `codex login`, start read-only, and relax permissions per task. Docs: `github.com/openai/codex` and the npm README.
