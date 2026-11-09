## What you will learn

How to download, install, and set up **Claude Desktop** on macOS, Windows, and Linux (beta) — from the official `claude.com/download` page — plus how to sign in, what the free plan includes, and how it differs from Claude Code (the CLI) and claude.ai (the web app).

**What Claude Desktop is:** Anthropic's native desktop app for the Claude assistant. It brings chat, file access, and local integrations to your desktop. The web app is `claude.ai`; the terminal agent is **Claude Code** (separate install — see our Claude Code guide).

**Official source only:** `claude.com/download` (the old `claude.ai/download` redirects here). Never install Claude from third-party APK/dmg sites — they bundle malware and outdated builds.

## Table of contents

1. System requirements
2. Download (official)
3. Install: macOS
4. Install: Windows
5. Install: Linux (beta)
6. Sign in & free plan
7. Set up local integrations safely
8. Claude Desktop vs Code vs Web
9. Update / uninstall
10. Troubleshooting

## 1. System requirements

| Platform | Minimum (per Anthropic Help Center, 2026) |
|---|---|
| macOS | 13 Ventura or later (Apple Silicon + Intel, universal app) |
| Windows | 10 or later (x64 and ARM64) |
| Linux (beta) | Ubuntu 22.04 or Debian 12 |

You do **not** need a paid plan to download or use the app. Chat works on the Free plan; Claude Code and Cowork need a paid plan, and computer use is a beta for Pro/Max on Mac and Windows.

## 2. Download (official)

1. Open **claude.com/download** in your browser.
2. Pick your platform: macOS, Windows, Windows (arm64), or Linux (.deb/.rpm/AppImage where listed).
3. Save the file. Ignore any "Download Claude Desktop" ad or third-party mirror — go straight to Anthropic's page.

> If `claude.ai/download` opens, it redirects to `claude.com/download`. That is expected.

## 3. Install: macOS

1. Open the downloaded `.dmg`.
2. Drag **Claude** into **Applications**.
3. Eject the disk image.
4. Open Claude from Applications. If macOS shows a security warning ("cannot be opened"), right-click → Open (first launch only — the universal build is signed by Anthropic).

## 4. Install: Windows

1. Run the downloaded installer (`.exe` / `.msi` per your build).
2. Follow the wizard (per-user install, no admin needed).
3. Launch Claude from Start menu.

For Windows ARM64 machines, download the ARM64 build — the x64 build will not perform correctly.

## 5. Install: Linux (beta)

Linux is in beta (Ubuntu 22.04 / Debian 12 baseline). Download the `.deb` (or `.rpm`/AppImage) from `claude.com/download`, then:

```bash
sudo dpkg -i claude*.deb   # .deb path
sudo apt -f install        # fix any missing deps
```

Expect rough edges — Linux lags Mac/Windows. For agents on Linux, prefer Claude Code (CLI) until the desktop beta matures.

## 6. Sign in & free plan

1. Open Claude Desktop → **Sign in** with Google or email (same account as `claude.ai`).
2. Free plan: chat works, context/memory limits apply. No credit card needed.
3. To upgrade: in-app purchase or `claude.ai` settings (Pro/Max/Team/Enterprise).

**Check your plan:** Settings → Account shows Free/Pro/Max. Computer use (beta) needs Pro/Max on Mac/Windows — enabling it is opt-in.

## 7. Set up local integrations safely

Claude Desktop shines with local files and connectors — but grant the minimum:

1. **Settings → Connectors / Integrations:** enable one at a time (e.g. filesystem for a single project folder, not your whole home).
2. **MCP servers:** add via Settings (advanced). Start with read-only servers.
3. **Permissions:** review what each connector can read/write before you enable it. You can revoke per-connector in Settings.

Rule: one project folder, read-only first, then write. Never connect your password store, SSH keys, or `~/.env` files.

## 8. Claude Desktop vs Code vs Web

|  | Claude Desktop | Claude Code (CLI) | claude.ai (Web) |
|---|---|---|---|
| Form | Native app | Terminal agent | Browser |
| Best for | Chat + local files | Coding agents in repos | Quick chat, sharing |
| Install | `claude.com/download` | `curl … \| bash` / npm (separate guide) | Nothing |
| Plan | Free (chat) | Paid | Free (chat) |
| Computer use | Beta (Pro/Max, Mac/Windows) | Via CLI permissions | No |

If you code in a repo all day, install **Claude Code** too — Desktop is not a replacement for it.

## 9. Update / uninstall

**Update:** the app auto-updates in the background. To force: Settings → About → Check for updates (or re-download from `claude.com/download`).

**Uninstall:**
- macOS: drag from Applications to Trash, then remove `~/Library/Application Support/Claude` if you want a clean slate.
- Windows: Settings → Apps → Claude → Uninstall.
- Linux: `sudo dpkg -r claude` (or your package manager).

## 10. Troubleshooting

| Symptom | Fix |
|---|---|
| "Cannot be opened" (Mac) | Right-click → Open (first launch); verify you downloaded from `claude.com/download` |
| Sign-in loops | Clear browser cookies, retry; check ad-blocker reachability to `claude.ai` |
| Connectors missing | Settings → Connectors (enable one at a time); restart the app |
| Slow Linux | Beta — use Claude Code (CLI) for agents on Linux |
| Wrong build (ARM vs x64) | Re-download the ARM64 build on Apple Silicon / Windows ARM |

**Security:** only `claude.com/download`. Verify the installer is signed (macOS Gatekeeper, Windows SmartScreen). Never enter your password on a third-party "Claude installer" site.

## FAQ

### Is Claude Desktop free?

Download and chat are free on every plan. Advanced features (Code, Cowork, computer use) need paid plans.

### Mac vs Windows — same app?

Universal app on Mac (Silicon + Intel). Windows ships x64 and ARM64 — pick your architecture.

### Desktop vs website — which is better?

Same model, different home. Desktop wins for files/connectors; web wins for sharing and simplicity.

### Can I use Desktop on Linux?

Beta (Ubuntu 22.04/Debian 12). For agents, prefer Claude Code CLI on Linux.

## Verdict

Download from **claude.com/download**, install the build for your OS, sign in, enable one connector, and chat. For coding agents, add Claude Code. Docs: `claude.com/download` and Anthropic Help Center.
