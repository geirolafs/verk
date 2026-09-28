# Projects Layer Specification ("verk")

Optional layer that lists long-lived projects next to tries. It is **off unless
`TRY_PROJECTS` is set**; with it unset, try behaves exactly as described in the
other specs (including graduation leaving a symlink).

Tests: `spec/tests/test_40_projects_layer.sh`, `test/workspace_test.rb`.

## Layout

```
$TRY_PROJECTS/
  tries/                 💭 tries ($TRY_PATH), YYYY-MM-DD-name
  website/               project
  acme/.try-group        client (marker file), listed as "acme/"
  acme/api/              project filed under a client  (listed as "acme/api")
  .archive/              📦 archived projects, same client/name layout
```

- Every visible directory in `TRY_PROJECTS` is a project, except the tries
  directory itself and hidden entries.
- A directory containing a `.try-group` file is a client. Its visible
  subdirectories are projects. Clients are one level deep.
- Tries are never grouped under clients.

## Naming

Names typed anywhere (new try, graduate, client, rename) are slugified:
lowercase, runs of anything outside `[a-z0-9._]` become `-`, common Latin
accents are transliterated (`Þróun Á Vef` → `throun-a-vef`), leading dots and
trailing dashes are stripped. Try renames keep the `YYYY-MM-DD-` prefix.

## Selector

- One flat fuzzy list. Rows: `💭 2026-09-28-spike`, then projects and clients
  with no icon (blank padding keeps names aligned): `website`, `acme/api`
  (client part dimmed), `acme/` (clients end in `/`). Archived rows show 📦;
  rows marked for removal show 🗑️ (delete) or 📦 (archive).
- Header shows `verk` and the current filter.
- All kinds get the +2.0 base bonus (clients +1.0), so ordering is by recency.
  Selecting any entry `touch`es it, so recency means "last opened".
- Enter on any row `cd`s into its real path.
- Legacy graduation symlinks in the tries directory are hidden when their
  target is listed as a project.

## Keys

| Key | Try | Project | Client | Archived |
|-----|-----|---------|--------|----------|
| Tab | cycle filter: all → tries → projects → archive → all (opens on all) ||||
| Ctrl-G | graduate | move to client | status message | restore |
| Ctrl-R | rename (keeps date) | rename | rename | status message |
| Ctrl-D | mark: delete | mark: archive | mark: remove if empty | status message |

### Graduate / move dialog

Fields: **Name** (graduation: try name without date) and **Client** (starts
active; move: current client).

- Empty client → `$TRY_PROJECTS/<name>`.
- Existing client → `$TRY_PROJECTS/<client>/<name>`.
- Unknown client → created (`mkdir` + `.try-group`) and used.
- A client name that is an existing project is refused.
- Destination that exists is refused.
- Tab in the Client field completes the first suggestion (prefix matches,
  then substring matches); otherwise Tab / ↑ / ↓ switch fields.
- The emitted script moves the directory (`git worktree move` for worktrees),
  leaves **no symlink**, and `cd`s into the destination.

### Delete / archive

After `YES` confirmation:

- tries: `rm -rf` (must be inside `TRY_PATH`)
- projects: moved to `.archive/<rel>` (client marker recreated in the archive;
  `-2`, `-3` suffix when taken)
- clients: only when nothing but `.try-group` (and projects marked in the same
  batch) is inside; marker removed, then `rmdir`

Restore (`Ctrl-G` in archive view) moves the project back to `<rel>`,
recreating its client if needed; refused if the destination exists or the
client name is now a project.

## Claude Code history

Claude Code stores history in `$CLAUDE_CONFIG_DIR/projects/<key>` (default
`~/.claude/projects`), where key is the absolute path with every
non-alphanumeric character replaced by `-`.

Every move above (graduate, move, rename, archive, restore) emits
`try _claude-move <old> <new>` after the move. It renames the key directory;
if the destination key exists it merges: missing files are moved, identical
files dropped, differing files kept as `name-2.ext`, and `MEMORY.md` index
lines are appended when missing. Renaming a client moves the key of each
project inside it. `_claude-move` always exits 0.

## Shell alias

`try init` also defines `verk` as an alias of `try` (bash/zsh, fish, pwsh).
