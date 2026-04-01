# dev

Terminal TUI for managing `~/Developer` projects. Built with Ink + React.

## Install

Requires [Bun](https://bun.sh) and git. Optional: [eza](https://github.com/eza-community/eza) for tree previews.

```bash
git clone <repo-url> ~/Developer/TheDev
cd ~/Developer/TheDev && bun install
```

Add the shell wrapper to your `.zshrc` or `.bashrc`:

```zsh
dev() {
    local tmpfile=$(mktemp)
    trap "rm -f '$tmpfile'" EXIT
    if [[ $# -eq 0 ]]; then
        command bun run "$HOME/Developer/TheDev/bin/dev.ts" --output "$tmpfile"
    else
        command bun run "$HOME/Developer/TheDev/bin/dev.ts" --output "$tmpfile" "$@"
    fi
    local exit_code=$?
    if [[ $exit_code -eq 0 && -s "$tmpfile" ]]; then
        eval "$(cat "$tmpfile")"
    fi
    rm -f "$tmpfile"
}
```

Then `source ~/.zshrc` and run `dev`.

## Usage

```bash
dev                          # Interactive TUI
dev new <name> [template]    # Create project (YYYY-MM-DD- prefixed)
dev archive <name>           # Archive project
dev unarchive <name> [year]  # Restore from archive
```

## Folder structure

Only `~/Developer/` is required. Optional folders unlock additional features when present.

```
~/Developer/
  YYYY-MM-DD-project/    # Projects (date-prefixed)
  TheDev/                # This tool
```

**Optional folders:**

| Folder | Feature | How to enable |
|--------|---------|---------------|
| `Clients/` | `c` clients view, `s` send to client | `mkdir ~/Developer/Clients` |
| `tries/` | `t` tries view, `p` promote to project | `mkdir ~/Developer/tries` (or install [try](https://github.com/tobi/try)) |
| `Archive/` | `a` archive view | Created automatically on first archive |

## Views

| Key | View | Description |
|-----|------|-------------|
| default | `~/Developer` | Your projects |
| `t` | `~/Developer/tries` | Experiments (if folder exists) |
| `c` | `~/Developer/Clients` | Client list (if folder exists) |
| enter (on client) | `~/Developer/Clients/<name>` | Single client's contents |
| `a` | `~/Developer/Archive` | Archived projects (year-grouped) |
| `esc` | — | Back to parent view |

## Keybindings

### Navigation

| Key | Action |
|-----|--------|
| `j`/`k` or `↑`/`↓` | Move cursor |
| `gg` | Jump to top |
| `G` | Jump to bottom |
| `ctrl+d` | Half page down |
| `ctrl+u` | Half page up |
| `enter` | cd into project (or open client / restore archive) |
| `v` | Open in nvim |
| `/` | Fuzzy filter (highlighted matches) |
| `esc` | Clear filter → clear selection → back to parent → quit |
| `q` | Quit |

### Selection & actions

| Key | Action |
|-----|--------|
| `space` | Toggle select, advance cursor |
| `A` | Archive selection (or cursor if none selected) |
| `s` | Send to client (opens client picker) |
| `n` | New project / new client folder (context-dependent) |

### View switching

| Key | Where | Action |
|-----|-------|--------|
| `t` | projects | Enter tries |
| `c` | projects | Enter clients |
| `a` | projects | Enter archive |
| `p` | tries | Promote try to ~/Developer |

## Templates

Available via `n` in the TUI or `dev new <name> [template]`:

| Template | What it sets up |
|----------|----------------|
| `empty` | git init + .gitignore |
| `node` | npm init + .gitignore |
| `next` | Next.js + TypeScript + Tailwind + App Router |
| `rust` | cargo init |
| `python` | venv + .gitignore |

## Git status

| Indicator | Meaning |
|-----------|---------|
| `○` (green) | Clean — nothing to commit |
| `~3` | 3 modified files |
| `+5` | 5 untracked files |
| `-1` | 1 deleted file |
| `↑2` | 2 commits ahead of remote |

## Display

- Date prefix dimmed, project name bright
- Progressive truncation: `YYYY-MM-DD` → `YY-MM-DD` → name truncated with `…`
- Side preview panel (commits, branches, file tree) on wide terminals (≥100 cols)
- Scroll indicator `[1-20/55]` when list exceeds screen height
- Responsive layout on terminal resize
- Time column: `0d` `2w` `1m` `1y` (right-aligned, 3 chars)

## Stack

Bun, Ink 6, React 19, TypeScript.
