# verk

Terminal TUI for managing `~/Developer projects` Vim keys, fuzzy filter, git status, templates, and cd on enter. Built with Ink + React.

## Install

Requires [Bun](https://bun.sh) and git. Optional: [eza](https://github.com/eza-community/eza) for tree previews, [try](https://github.com/tobi/try) for experiments in `~/Developer/tries`.

```bash
git clone <repo-url> ~/Developer/verk
cd ~/Developer/verk && bun install
```

Add the shell wrapper to your `.zshrc` or `.bashrc`:

```zsh
verk() {
    local tmpfile=$(mktemp)
    trap "rm -f '$tmpfile'" EXIT
    if [[ $# -eq 0 ]]; then
        command bun run "$HOME/Developer/verk/bin/verk.ts" --output "$tmpfile"
    else
        command bun run "$HOME/Developer/verk/bin/verk.ts" --output "$tmpfile" "$@"
    fi
    local exit_code=$?
    if [[ $exit_code -eq 0 && -s "$tmpfile" ]]; then
        eval "$(cat "$tmpfile")"
    fi
    rm -f "$tmpfile"
}
```

Then `source ~/.zshrc` and run `verk`.

## Usage

```bash
verk                          # Interactive TUI
verk new <name> [template]    # Create project (YYYY-MM-DD- prefixed)
verk archive <name>           # Archive project
verk unarchive <name> [year]  # Restore from archive
```

## Folder structure

Only `~/Developer/` is required. Optional folders unlock additional features when present.

```
~/Developer/
  YYYY-MM-DD-project/    # Projects (date-prefixed)
  verk/                  # This tool
```

**Optional folders:**

| Folder     | Feature                                | How to enable                                                             |
| ---------- | -------------------------------------- | ------------------------------------------------------------------------- |
| `Clients/` | `c` clients view, `s` send to client   | `mkdir ~/Developer/Clients`                                               |
| `tries/`   | `t` tries view, `p` promote to project | `mkdir ~/Developer/tries` (or install [try](https://github.com/tobi/try)) |
| `Archive/` | `a` archive view                       | Created automatically on first archive                                    |

## Keybindings

### Navigation

| Key                | Action                                                 |
| ------------------ | ------------------------------------------------------ |
| `j`/`k` or `↑`/`↓` | Move cursor                                            |
| `gg`               | Jump to top                                            |
| `G`                | Jump to bottom                                         |
| `ctrl+d`           | Half page down                                         |
| `ctrl+u`           | Half page up                                           |
| `enter`            | cd into project (or open client / restore archive)     |
| `v`                | Open in nvim                                           |
| `/`                | Fuzzy filter (highlighted matches)                     |
| `esc`              | Clear filter → clear selection → back to parent → quit |
| `q`                | Quit                                                   |

### Selection & actions

| Key     | Action                                              |
| ------- | --------------------------------------------------- |
| `space` | Toggle select, advance cursor                       |
| `A`     | Archive selection (or cursor if none selected)      |
| `S`     | Send to client (opens client picker)                |
| `N`     | New project / new client folder (context-dependent) |

### View switching

| Key | Where    | Action                     |
| --- | -------- | -------------------------- |
| `t` | projects | Enter tries                |
| `c` | projects | Enter clients              |
| `a` | projects | Enter archive              |
| `P` | tries    | Promote try to ~/Developer |

## Templates

Available via `N` in the TUI or `verk new <name> [template]`:

| Template | What it sets up                              |
| -------- | -------------------------------------------- |
| `empty`  | git init + .gitignore                        |
| `node`   | npm init + .gitignore                        |
| `next`   | Next.js + TypeScript + Tailwind + App Router |
| `rust`   | cargo init                                   |
| `python` | venv + .gitignore                            |

### Custom templates

Drop a `.sh` file in `templates/`:

```sh
# Svelte project with TypeScript
npx sv create . --template minimal --types ts
```

First `#` comment = description in the picker. Remaining lines run as shell commands after `git init`. The filename (minus `.sh`) becomes the template name.

## Git status

| Indicator   | Meaning                   |
| ----------- | ------------------------- |
| `○` (green) | Clean — nothing to commit |
| `~3`        | 3 modified files          |
| `+5`        | 5 untracked files         |
| `-1`        | 1 deleted file            |
| `↑2`        | 2 commits ahead of remote |
