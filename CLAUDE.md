# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

`thedev` — a Bun-powered terminal TUI for managing `~/Developer` projects. Built with React + Ink. Projects are date-prefixed (`YYYY-MM-DD-name`), with archive/unarchive to `~/Developer/Archive/<year>/`.

## Commands

```bash
bun run src/index.tsx        # run TUI directly
bun run bin/dev.ts           # run via CLI entrypoint
bun run bin/dev.ts --help    # CLI usage
```

No tests, no linter, no build step — runs directly via Bun.

## Architecture

Two modes of operation:
- **CLI** (`bin/dev.ts`): handles `new`, `archive`, `unarchive` subcommands. Emits shell commands to stdout (or `--output` file) for the parent shell to eval (e.g., `cd` into new project).
- **TUI** (`src/index.tsx` → `App.tsx`): interactive Ink app with three screens: `ProjectList`, `NewProject`, `ArchiveList`.

Key patterns:
- `writeShellCommand()` (`utils/shellOutput.ts`) writes commands to a temp file (`globalThis.__devOutputFile`) so a shell wrapper can eval them — this is how TUI actions like "open project" result in the parent shell actually `cd`-ing.
- `useProjects` hook scans `~/Developer`, loads git status with bounded concurrency (8), progressively updates state.
- `utils/git.ts` — all git operations via `Bun.spawn`, returns `null` on failure.
- `utils/templates.ts` — project scaffolding returns shell command strings (not executed in-process).
- `utils/archive.ts` — moves dirs between `~/Developer` and `~/Developer/Archive/<year>/`.

## TUI Keybindings

`j/k` navigate, `Enter` cd, `v` open in nvim, `n` new, `a` archive, `u` unarchive, `/` filter, `Space` multi-select, `Esc`/`q` quit.
