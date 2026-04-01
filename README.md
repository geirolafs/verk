# dev

Ink-based TUI for managing `~/Developer` projects, clients, tries, and archives.

## Install

Requires [Bun](https://bun.sh), git, and optionally eza (for tree previews).

```bash
cd ~/Developer/TheDev && bun install
```

Add to your shell (already in `~/.config/zsh/functions/dev.zsh`):

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

## Usage

```bash
dev                          # Interactive TUI
dev new <name> [template]    # Create project (YYYY-MM-DD- prefixed)
dev archive <name>           # Archive project
dev unarchive <name> [year]  # Restore from archive
```

## Folder structure

```
~/Developer/
  YYYY-MM-DD-project/    # Projects (date-prefixed)
  Clients/               # Client folders, each with their own contents
  tries/                 # Ephemeral experiments (managed by `try`)
  Archive/               # Archived projects grouped by year
  TheDev/                # This tool
```

## Views

| Key | View | Description |
|-----|------|-------------|
| default | `~/Developer` | Your projects |
| `t` | `~/Developer/tries` | Experiments |
| `c` | `~/Developer/Clients` | Client list |
| enter (on client) | `~/Developer/Clients/<name>` | Single client |
| `a` | `~/Developer/Archive` | Archived projects (year-grouped) |
| `esc` | — | Back to parent view |

## Keybindings

### Navigation

| Key | Action |
|-----|--------|
| `j`/`k` or arrows | Move cursor |
| `enter` | cd into project (or open client / restore archive) |
| `v` | Open in nvim |
| `/` | Fuzzy filter (highlighted matches) |
| `esc` | Clear filter / clear selection / back |
| `q` | Quit |

### Selection

| Key | Action |
|-----|--------|
| `space` | Toggle select, advance cursor |
| `A` | Archive selection |
| `s` | Send to client (picker) |

### View-specific

| Key | Where | Action |
|-----|-------|--------|
| `t` | projects | Enter tries |
| `c` | projects | Enter clients |
| `a` | projects | Enter archive |
| `p` | tries | Promote to ~/Developer |
| `n` | projects/client | New project (template picker) |
| `n` | clients | New client folder |

### Templates (`n` / `dev new`)

| Template | What it sets up |
|----------|----------------|
| `empty` | git init + .gitignore |
| `node` | npm init + .gitignore |
| `next` | Next.js + TypeScript + Tailwind + App Router |
| `rust` | cargo init |
| `python` | venv + .gitignore |

## Git status indicators

```
~3      modified files
+5      untracked files
-1      deleted files
↑2      commits ahead of remote
clean   nothing to commit
```

## Stack

Bun, Ink 6, React 19, TypeScript.
