# Projects layer (verk) tests
# Enabled by TRY_PROJECTS: projects and clients/ listed next to 💭 tries.
# Spec: spec/projects_spec.md

section "projects-layer"

PL_ROOT=$(mktemp -d)
PL_CLAUDE=$(mktemp -d)
mkdir -p "$PL_ROOT/tries/2025-06-01-spike" "$PL_ROOT/tries/2025-06-02-other"
mkdir -p "$PL_ROOT/website" "$PL_ROOT/acme/landing" "$PL_ROOT/acme/api"
touch "$PL_ROOT/acme/.try-group"

pl_run() {
    NO_COLOR=1 TRY_PROJECTS="$PL_ROOT" CLAUDE_CONFIG_DIR="$PL_CLAUDE" try_run --path="$PL_ROOT/tries" "$@"
}
pl_script() {
    TRY_PROJECTS="$PL_ROOT" CLAUDE_CONFIG_DIR="$PL_CLAUDE" eval $TRY_CMD exec --path="$PL_ROOT/tries" '"$@"' 2>/dev/null
}
pl_eval() {
    local script
    script=$(pl_script "$@")
    ( export CLAUDE_CONFIG_DIR="$PL_CLAUDE"; eval "$(echo "$script" | grep -v '^#')" ) >/dev/null 2>&1
}
pl_key() { echo "$1" | sed 's/[^a-zA-Z0-9]/-/g'; }

# --- Off by default ---
output=$(try_run --path="$PL_ROOT/tries" --and-exit exec 2>&1)
if echo "$output" | grep -q "website"; then
    fail "Without TRY_PROJECTS, projects are not listed" "no website" "$output" "projects_spec.md"
else
    pass
fi

# --- Listing ---
output=$(pl_run --and-exit exec 2>&1)
for want in "💭 2025-06-01-spike" "   website " "   acme/landing " "   acme/ " "verk"; do
    if echo "$output" | grep -q "$want"; then
        pass
    else
        fail "Projects layer lists '$want'" "$want" "$output" "projects_spec.md"
    fi
done
if echo "$output" | grep -qE "   tries( |$)"; then
    fail "Tries directory is not listed as a project" "no tries row" "$output" "projects_spec.md"
else
    pass
fi

# --- Tab filter ---
output=$(pl_run --and-keys='TAB' exec 2>&1 | tail -30)
if echo "$output" | grep -q "💭 tries" && ! echo "$output" | grep -q "   website "; then
    pass
else
    fail "Tab once shows tries only" "tries only" "$output" "projects_spec.md"
fi
output=$(pl_run --and-keys='TAB,TAB' exec 2>&1 | tail -30)
if echo "$output" | grep -qE "verk +projects" && echo "$output" | grep -q "   website " && ! echo "$output" | grep -q "2025-06-01-spike"; then
    pass
else
    fail "Tab twice shows projects only" "projects only" "$output" "projects_spec.md"
fi

# --- Selecting a project cds into it ---
output=$(pl_script --and-type=website --and-keys='ENTER')
if echo "$output" | grep -q "cd '$PL_ROOT/website'"; then
    pass
else
    fail "Enter on a project cds into it" "cd website" "$output" "projects_spec.md"
fi

# --- New tries get slug names ---
output=$(pl_script --and-type='My Big Idea' --and-keys='CTRL-T')
if echo "$output" | grep -qE "mkdir -p '$PL_ROOT/tries/[0-9]{4}-[0-9]{2}-[0-9]{2}-my-big-idea'"; then
    pass
else
    fail "New try names are lowercased and dashed" "my-big-idea" "$output" "projects_spec.md"
fi

# --- Graduate to top level: no symlink, date dropped ---
output=$(pl_script --and-type=spike --and-keys='CTRL-G,ENTER')
if echo "$output" | grep -q "mv '$PL_ROOT/tries/2025-06-01-spike' '$PL_ROOT/spike'"; then
    pass
else
    fail "Graduate with empty client moves to top level" "mv to $PL_ROOT/spike" "$output" "projects_spec.md"
fi
if echo "$output" | grep -q "ln -s"; then
    fail "Graduate leaves no symlink" "no ln -s" "$output" "projects_spec.md"
else
    pass
fi

# --- Graduate into an existing client via Tab completion ---
output=$(pl_script --and-type=spike --and-keys='CTRL-G,TYPE=ac,TAB,ENTER')
if echo "$output" | grep -q "'$PL_ROOT/acme/spike'" && ! echo "$output" | grep -q "touch '$PL_ROOT/acme/.try-group'"; then
    pass
else
    fail "Tab completes an existing client" "acme/spike" "$output" "projects_spec.md"
fi

# --- Graduate into a new client (free text is slugified) ---
output=$(pl_script --and-type=spike --and-keys='CTRL-G,TYPE=Evil Corp,ENTER')
if echo "$output" | grep -q "touch '$PL_ROOT/evil-corp/.try-group'" && echo "$output" | grep -q "'$PL_ROOT/evil-corp/spike'"; then
    pass
else
    fail "New client is created with marker" "evil-corp/.try-group" "$output" "projects_spec.md"
fi

# --- Graduating into a project (not a client) is refused ---
output=$(pl_script --and-type=spike --and-keys='CTRL-G,TYPE=website,ENTER')
if echo "$output" | grep -q "mv "; then
    fail "Can't graduate into a project folder" "no mv" "$output" "projects_spec.md"
else
    pass
fi

# --- E2E graduate moves Claude history ---
SPIKE_KEY=$(pl_key "$PL_ROOT/tries/2025-06-01-spike")
mkdir -p "$PL_CLAUDE/projects/$SPIKE_KEY/memory"
echo "session" > "$PL_CLAUDE/projects/$SPIKE_KEY/abc.jsonl"
pl_eval --and-type=spike --and-keys='CTRL-G,TYPE=acme,ENTER'
if [ -d "$PL_ROOT/acme/spike" ] && [ ! -e "$PL_ROOT/tries/2025-06-01-spike" ]; then
    pass
else
    fail "E2E: try moved into client" "acme/spike" "$(ls -R $PL_ROOT 2>&1)" "projects_spec.md"
fi
if [ -f "$PL_CLAUDE/projects/$(pl_key "$PL_ROOT/acme/spike")/abc.jsonl" ] && [ ! -d "$PL_CLAUDE/projects/$SPIKE_KEY" ]; then
    pass
else
    fail "E2E: Claude history follows graduation" "moved key dir" "$(ls $PL_CLAUDE/projects 2>&1)" "projects_spec.md"
fi

# --- Claude history merges when the destination key exists ---
OTHER_KEY=$(pl_key "$PL_ROOT/tries/2025-06-02-other")
DEST_KEY=$(pl_key "$PL_ROOT/other")
mkdir -p "$PL_CLAUDE/projects/$OTHER_KEY/memory" "$PL_CLAUDE/projects/$DEST_KEY/memory"
echo "- [a](a.md) — old" > "$PL_CLAUDE/projects/$OTHER_KEY/memory/MEMORY.md"
echo "- [b](b.md) — new" > "$PL_CLAUDE/projects/$DEST_KEY/memory/MEMORY.md"
echo "one" > "$PL_CLAUDE/projects/$OTHER_KEY/s1.jsonl"
pl_eval --and-type=other --and-keys='CTRL-G,ENTER'
merged="$PL_CLAUDE/projects/$DEST_KEY"
if [ -f "$merged/s1.jsonl" ] && grep -q "a.md" "$merged/memory/MEMORY.md" && grep -q "b.md" "$merged/memory/MEMORY.md"; then
    pass
else
    fail "Claude history merges into existing destination" "s1.jsonl + both index lines" "$(ls -R $merged 2>&1; cat $merged/memory/MEMORY.md 2>&1)" "projects_spec.md"
fi

# --- ^G on a project moves it between clients ---
output=$(pl_script --and-type=website --and-keys='CTRL-G,TYPE=acme,ENTER')
if echo "$output" | grep -q "mv '$PL_ROOT/website' '$PL_ROOT/acme/website'"; then
    pass
else
    fail "^G on a project moves it into a client" "acme/website" "$output" "projects_spec.md"
fi
output=$(pl_script --and-type=acme/api --and-keys='CTRL-G,CTRL-A,CTRL-K,ENTER')
if echo "$output" | grep -q "mv '$PL_ROOT/acme/api' '$PL_ROOT/api'"; then
    pass
else
    fail "Clearing the client moves a project to top level" "mv to $PL_ROOT/api" "$output" "projects_spec.md"
fi

# --- Rename a client moves Claude history of its projects ---
output=$(pl_script --and-keys='TAB,TAB,TYPE=acme,CTRL-R,CTRL-A,CTRL-K,TYPE=Acme Inc,ENTER')
if echo "$output" | grep -q "mv '$PL_ROOT/acme' '$PL_ROOT/acme-inc'" && echo "$output" | grep -q "_claude-move '$PL_ROOT/acme/landing' '$PL_ROOT/acme-inc/landing'"; then
    pass
else
    fail "Renaming a client renames it and moves project histories" "acme-inc + _claude-move per project" "$output" "projects_spec.md"
fi

# --- ^D on a client with projects is blocked ---
output=$(pl_run --and-keys='TAB,TAB,TYPE=acme,CTRL-D' exec 2>&1)
if echo "$output" | grep -q "still has projects"; then
    pass
else
    fail "^D on non-empty client is blocked" "still has projects" "$output" "projects_spec.md"
fi

# --- ^D on a project archives it, ^G in archive view restores it ---
output=$(pl_script --and-type=website --and-keys='CTRL-D,ENTER,TYPE=YES,ENTER')
if echo "$output" | grep -q "mv '$PL_ROOT/website' '$PL_ROOT/.archive/website'" && ! echo "$output" | grep -q "rm -rf"; then
    pass
else
    fail "^D on a project archives it" "mv to .archive" "$output" "projects_spec.md"
fi
pl_eval --and-type=landing --and-keys='CTRL-D,ENTER,TYPE=YES,ENTER'
if [ -d "$PL_ROOT/.archive/acme/landing" ] && [ -f "$PL_ROOT/.archive/acme/.try-group" ]; then
    pass
else
    fail "E2E: archiving keeps the client path" ".archive/acme/landing" "$(ls -Ra $PL_ROOT/.archive 2>&1)" "projects_spec.md"
fi
output=$(pl_run --and-keys='TAB,TAB,TAB' exec 2>&1 | tail -30)
if echo "$output" | grep -q "📦 acme/landing" && echo "$output" | grep -q "📦 archive"; then
    pass
else
    fail "Archive view lists archived projects" "📦 acme/landing" "$output" "projects_spec.md"
fi
pl_eval --and-keys='TAB,TAB,TAB,TYPE=landing,CTRL-G'
if [ -d "$PL_ROOT/acme/landing" ] && [ ! -e "$PL_ROOT/.archive/acme/landing" ]; then
    pass
else
    fail "E2E: ^G in archive view restores to original place" "acme/landing" "$(ls -R $PL_ROOT 2>&1)" "projects_spec.md"
fi

# --- Empty client can be removed ---
mkdir -p "$PL_ROOT/empty-client"
touch "$PL_ROOT/empty-client/.try-group"
pl_eval --and-keys='TAB,TAB,TYPE=empty-client,CTRL-D,ENTER,TYPE=YES,ENTER'
if [ ! -e "$PL_ROOT/empty-client" ]; then
    pass
else
    fail "E2E: ^D removes an empty client" "gone" "$(ls -a $PL_ROOT/empty-client 2>&1)" "projects_spec.md"
fi

# --- Legacy graduation symlink is hidden when target is a project ---
mkdir -p "$PL_ROOT/legacy"
ln -s "$PL_ROOT/legacy" "$PL_ROOT/tries/2025-01-01-legacy"
output=$(pl_run --and-type=legacy --and-exit exec 2>&1)
if echo "$output" | grep -q "   legacy " && ! echo "$output" | grep -q "2025-01-01-legacy"; then
    pass
else
    fail "Legacy symlink in tries is hidden behind its project" "only legacy project row" "$output" "projects_spec.md"
fi

# --- verk alias ---
output=$(SHELL=/bin/bash try_run init /tmp/tries 2>&1)
if echo "$output" | grep -q 'verk() { try "\$@"; }'; then
    pass
else
    fail "init defines verk alias" "verk() { try \"\$@\"; }" "$output" "projects_spec.md"
fi
output=$(SHELL=/usr/bin/fish try_run init /tmp/tries 2>&1)
if echo "$output" | grep -q 'function verk; try $argv; end'; then
    pass
else
    fail "fish init defines verk alias" "function verk" "$output" "projects_spec.md"
fi

rm -rf "$PL_ROOT" "$PL_CLAUDE"
