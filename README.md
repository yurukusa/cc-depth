# cc-depth

How many turns per Claude Code session?

Shows the distribution of conversation depth — how many back-and-forth exchanges happen in each session.

## Usage

```bash
npx cc-depth
```

```
cc-depth — Turns per session

  1        ███░░░░░░░░░░░░░░░░░░░░░░░░░░░    18  (  3%)
  2–5      ██████████████████░░░░░░░░░░░░   104  ( 20%)
  6–15     █████████████░░░░░░░░░░░░░░░░░    75  ( 14%)
  16–30    ████████░░░░░░░░░░░░░░░░░░░░░░    48  (  9%)
  31–60    █████████░░░░░░░░░░░░░░░░░░░░░    54  ( 10%)
  61–100   █████████░░░░░░░░░░░░░░░░░░░░░    53  ( 10%)
  101+     ██████████████████████████████   174  ( 33%)

─────────────────────────────────────────────────────────
  Median:  38 turns/session
  Mean:    263 turns/session
  Peak:    14,169 turns
  Style:   🔄 Loop Runner  (extended sessions or autonomous loop)

  Analyzed 526 sessions
```

## Style Classifications

| Style | Median | What it means |
|-------|--------|---------------|
| 💬 Quick Prompter | ≤ 3 turns | One-shot queries, fast iterations |
| ✅ Task Completer | 4–10 turns | Focused task sessions |
| 🤝 Collaborative Coder | 11–30 turns | Back-and-forth workflow |
| 🔄 Loop Runner | > 30 turns | Extended sessions or autonomous loop |

## Options

```bash
npx cc-depth                        # All sessions
npx cc-depth --json                 # JSON output
npx cc-depth --projects=cc-loop     # Filter by project name
npx cc-depth --help                 # Show help
```

## Browser Version

→ **[yurukusa.github.io/cc-depth](https://yurukusa.github.io/cc-depth/)**

Drag in your `~/.claude` folder. Runs entirely locally.

## What counts as a "turn"?

Each user message in a session counts as one turn. This includes:
- Your direct prompts and questions
- Continuation messages (in autonomous setups like cc-loop)
- System-level messages

For interactive users, a typical session is 2–30 turns. Autonomous loop setups show much higher counts.

## Part of cc-toolkit

cc-depth is tool #49 in [cc-toolkit](https://yurukusa.github.io/cc-toolkit/) — 49 free tools for Claude Code users.

Related:
- [cc-session-length](https://github.com/yurukusa/cc-session-length) — Duration distribution
- [cc-momentum](https://github.com/yurukusa/cc-momentum) — Week-by-week session trend
- [cc-gap](https://github.com/yurukusa/cc-gap) — Time between sessions

---

**GitHub**: [yurukusa/cc-depth](https://github.com/yurukusa/cc-depth)
**Try it**: `npx cc-depth`
