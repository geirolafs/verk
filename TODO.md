# TODO

## Bugs

- [ ] `useMemo` used as `useEffect` for archive data loading (`ProjectList.tsx:68`) — side effect during render, unreliable
- [ ] `maxVisible` used in `useInput` before it's defined (`ProjectList.tsx:209`) — ctrl+d/u broken on first render
- [ ] `next.sh`: `create-next-app` ignores `--skip-git`, inits git anyway — redundant `git init`
- [ ] `templateCommands` chains `mkdir && cd` but template cmds are newline-separated — if `cd` fails, cmds run in wrong dir
- [ ] Preview.tsx dependency array uses `project?.path` but should track project changes more broadly
- [ ] `Preview.tsx:62` hardcodes tree to 12 lines, ignores `height` prop

## Error handling

- [ ] `restoreProject` errors unhandled in TUI (`ProjectList.tsx:379`) — TUI hangs on failure
- [ ] `sendToClient` errors unhandled (`ProjectList.tsx:399`) — projects vanish with no feedback
- [ ] `restoreProject` errors unhandled in CLI (`bin/dev.ts:112`) — crashes with stack trace
- [ ] `useProjects` silently shows "Empty" on readdir failure (permission denied, missing dir)
- [ ] `ClientPicker` has no loading state — shows "No clients" until async load completes

## UX

- [ ] CLI scaffolding gives no feedback while running — add loader or stream output
- [ ] TUI name input silently ignores invalid names — show hint when name fails validation
- [ ] TOCTOU in multi-select restore — `existsSync` then `restoreProject` is racy, partial failures silent
- [ ] Fuzzy match highlight indices shift wrong when dates truncate to short format (`ProjectRow.tsx:81`)

## Testing

Unit tests: `bun test` — covers shellQuote, SAFE_NAME, fuzzyMatch, datePrefix, templateCommands.

### Manual (TUI — can't automate Ink)
- [ ] Launches without error
- [ ] `j/k` navigation, `Enter` cd, `v` nvim
- [ ] `/` filter narrows list, `Esc` clears
- [ ] `N` new project, `A` archive, `Space` multi-select
- [ ] Archive view (`a`), restore (`Enter`)
- [ ] Tries (`t`), clients (`c`), send (`S`), promote (`P`)
- [ ] `ctrl+d`/`ctrl+u` half-page, `gg` top, `G` bottom

### Manual (templates e2e — actually run scaffolded commands)
- [ ] `empty`, `node`, `next`, `rust`, `python`, `go`
- [ ] Custom template (.sh in templates/) shows in picker and runs
