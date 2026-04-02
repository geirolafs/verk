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

No linter, no build step — runs directly via Bun.

```bash
bun test                     # run unit tests
```

## Architecture

Two modes of operation:
- **CLI** (`bin/dev.ts`): handles `new`, `archive`, `unarchive` subcommands. Emits shell commands to stdout (or `--output` file) for the parent shell to eval (e.g., `cd` into new project).
- **TUI** (`src/index.tsx` → `App.tsx`): interactive Ink app with five views: `projects`, `tries`, `clients`, `client`, `archive` — plus `NewProject` screen. View type defined in `types.ts`, routed via `App.tsx`'s `getConfig()`.

Key patterns:
- **Shell bridge**: user's `.zshrc` defines a `dev()` wrapper that passes `--output <tmpfile>`. Both CLI and TUI write shell commands (like `cd`) to this file via `writeShellCommand()` (`utils/shellOutput.ts`) / `globalThis.__devOutputFile`. The parent shell evals the file after exit. This is the only way the TUI can affect the parent shell.
- `useProjects` hook scans a directory, loads git status with bounded concurrency (8), progressively updates state.
- `utils/git.ts` — all git operations via `Bun.spawn`, returns `null` on failure.
- `utils/templates.ts` — project scaffolding returns shell command strings (not executed in-process). Custom templates are `.sh` files in `templates/` — first `#` comment = description, remaining lines run after `git init`.
- `utils/archive.ts` — moves dirs between `~/Developer` and `~/Developer/Archive/<year>/`.
- Optional folders (`~/Developer/tries`, `~/Developer/Clients`) enable extra views; existence checked at runtime.

## TUI Keybindings

Navigation: `j/k` move, `gg` top, `G` bottom, `ctrl+d/u` half-page, `Enter` cd, `v` nvim, `/` filter, `Esc` back/quit, `q` quit.
Actions: `Space` select, `N` new, `A` archive, `S` send to client.
Views: `t` tries, `c` clients, `a` archive, `P` promote try.
