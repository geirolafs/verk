# TODO

## Bugs

- [x] `useMemo` used as `useEffect` for archive data loading — fixed, now uses `useEffect`
- [x] `maxVisible` used before defined — moved `useTerminalSize` + calculations before `useInput`
- [x] `next.sh` redundant `git init` — made idempotent with `2>/dev/null || true`
- [x] `templateCommands` chaining — fixed, template cmds run in subshell gated by `cd` success
- [x] Preview.tsx dependency array — fixed, added `treeLines` to deps
- [x] `Preview.tsx:62` hardcodes tree to 12 lines — fixed, dynamic via `maxLines` prop

## Error handling

- [x] `restoreProject` errors in TUI — errors bubble to Ink error boundary via async
- [x] `sendToClient` errors — same pattern, handled by Ink
- [x] `restoreProject` errors in CLI — added try/catch with user-friendly message
- [x] `useProjects` readdir failure — added error state, shown in UI instead of "Empty"
- [x] `ClientPicker` loading state — shows "Loading..." until clients are fetched

## UX

- [x] CLI scaffolding feedback — added stderr message before emitting template commands
- [x] TUI name input silently ignores invalid names — added validation hint
- [x] TOCTOU in multi-select restore — added try/catch per project, collects and reports failures
- [x] Fuzzy match highlight indices on truncated names — clamped to exclude `…` char

## Testing

Unit tests: `bun test` — covers shellQuote, SAFE_NAME, fuzzyMatch, datePrefix, templateCommands.

### Manual (TUI — can't automate Ink)
- [x] Launches without error
- [x] `j/k` navigation, `Enter` cd, `v` nvim
- [x] `/` filter narrows list, `Esc` clears
- [x] `N` new project, `A` archive, `Space` multi-select
- [x] Archive view (`a`), restore (`Enter`)
- [x] Tries (`t`), clients (`c`), send (`S`), promote (`P`)
- [x] `ctrl+d`/`ctrl+u` half-page, `gg` top, `G` bottom

### Manual (templates e2e — actually run scaffolded commands)
- [x] `empty`, `node`, `next`, `rust`, `python`, `go`
- [x] Custom template (.sh in templates/) shows in picker and runs

### notes

- no way to delete/archive client?
