import { Box, Text, useInput, useApp } from "ink";
import { useState, useMemo } from "react";
import { join } from "path";
import { existsSync } from "fs";
import { mkdir } from "fs/promises";
import type { Project, View, ListConfig } from "../types.ts";
import { useProjects } from "../hooks/useProjects.ts";
import { ProjectRow } from "../components/ProjectRow.tsx";
import { StatusBar } from "../components/StatusBar.tsx";
import { Preview } from "../components/Preview.tsx";
import { SearchInput } from "../components/SearchInput.tsx";
import { Confirm } from "../components/Confirm.tsx";
import { ClientPicker } from "../components/ClientPicker.tsx";
import { fuzzyMatch } from "../utils/fuzzy.ts";
import { useTerminalSize } from "../hooks/useTerminalSize.ts";
import {
  archiveProject,
  restoreProject,
  promoteTry,
  sendToClient,
  listArchivedProjects,
  type ArchivedProject,
} from "../utils/archive.ts";
import { writeShellCommand } from "../utils/shellOutput.ts";

const DEV_DIR = join(process.env["HOME"]!, "Developer");

type Props = {
  view: View;
  config: ListConfig;
  onSetView: (view: View) => void;
  refreshKey: number;
  onRefresh: () => void;
};

type Dialog =
  | null
  | { kind: "confirmArchive"; targets: Project[] }
  | { kind: "confirmPromote"; targets: Project[] }
  | { kind: "confirmRestore"; targets: ArchiveEntry[] }
  | { kind: "clientPicker"; targets: Project[] }
  | { kind: "nameInput"; purpose: "client" };

type ArchiveEntry = { name: string; year: string; path: string };

export function ProjectList({
  view,
  config,
  onSetView,
  refreshKey,
  onRefresh,
}: Props) {
  const { exit } = useApp();
  const { projects, loading } = useProjects(
    config.basePath,
    config.excludes,
    refreshKey
  );

  // For archive view, load year-grouped data
  const [archiveData, setArchiveData] = useState<ArchivedProject[]>([]);
  const isArchive = view.kind === "archive";

  // Load archive data on mount for archive view
  useState(() => {
    if (isArchive) {
      listArchivedProjects().then(setArchiveData);
    }
  });

  // Build display list: either projects or archive entries
  const displayProjects: Project[] = isArchive
    ? archiveData.map((a) => ({
        name: a.name,
        path: a.path,
        isGitRepo: false,
        branch: null,
        status: { modified: 0, untracked: 0, deleted: 0 },
        ahead: 0,
        lastCommitMessage: null,
        lastCommitTime: null,
      }))
    : projects;

  // Year headers for archive view
  const archiveYearMap = useMemo(() => {
    if (!isArchive) return new Map<number, string>();
    const map = new Map<number, string>();
    let lastYear = "";
    archiveData.forEach((a, i) => {
      if (a.year !== lastYear) {
        map.set(i, a.year);
        lastYear = a.year;
      }
    });
    return map;
  }, [isArchive, archiveData]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [filterMode, setFilterMode] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [nameInput, setNameInput] = useState("");

  const filtered = useMemo(() => {
    const list = displayProjects;
    if (!filterQuery) return list.map((p) => ({ project: p, matchIndices: null as number[] | null }));
    return list
      .map((p) => ({ project: p, match: fuzzyMatch(filterQuery, p.name) }))
      .filter((r) => r.match !== null)
      .sort((a, b) => b.match!.score - a.match!.score)
      .map((r) => ({ project: r.project, matchIndices: r.match!.indices }));
  }, [displayProjects, filterQuery]);

  const cursor = filtered[selectedIndex]?.project;
  const maxNameWidth = Math.max(...filtered.map((r) => r.project.name.length), 10);

  function getTargets(): Project[] {
    if (marked.size > 0) return filtered.map((r) => r.project).filter((p) => marked.has(p.name));
    return cursor ? [cursor] : [];
  }

  function getArchiveTargets(): ArchiveEntry[] {
    const targets = getTargets();
    return targets.map((t) => {
      const a = archiveData.find((ad) => ad.name === t.name);
      return a ?? { name: t.name, year: "", path: t.path };
    });
  }

  function popView() {
    switch (view.kind) {
      case "client":
        onSetView({ kind: "clients" });
        break;
      case "clients":
      case "tries":
      case "archive":
        onSetView({ kind: "projects" });
        break;
      default:
        exit();
    }
  }

  useInput((input, key) => {
    // Dialogs handle their own input
    if (dialog && dialog.kind !== "nameInput") return;

    // Name input mode (new client)
    if (dialog?.kind === "nameInput") {
      if (key.escape) {
        setDialog(null);
        setNameInput("");
      } else if (key.backspace || key.delete) {
        setNameInput((n) => n.slice(0, -1));
      } else if (key.return && nameInput.trim()) {
        const name = nameInput.trim();
        setDialog(null);
        setNameInput("");
        mkdir(join(config.basePath, name), { recursive: true }).then(onRefresh);
      } else if (input && !key.ctrl && !key.meta) {
        setNameInput((n) => n + input);
      }
      return;
    }

    // Filter mode
    if (filterMode) {
      if (key.escape) {
        setFilterMode(false);
        setFilterQuery("");
        setSelectedIndex(0);
        setMarked(new Set());
      } else if (key.backspace || key.delete) {
        setFilterQuery((q) => q.slice(0, -1));
        setSelectedIndex(0);
      } else if (key.return) {
        handleEnter();
      } else if (input && !key.ctrl && !key.meta) {
        setFilterQuery((q) => q + input);
        setSelectedIndex(0);
      }
      return;
    }

    // Navigation
    if (key.upArrow || input === "k") {
      setSelectedIndex((i) => Math.max(0, i - 1));
    } else if (key.downArrow || input === "j") {
      setSelectedIndex((i) => Math.min(filtered.length - 1, i + 1));
    }
    // Toggle select
    else if (input === " ") {
      if (cursor) {
        setMarked((prev) => {
          const next = new Set(prev);
          next.has(cursor.name) ? next.delete(cursor.name) : next.add(cursor.name);
          return next;
        });
        setSelectedIndex((i) => Math.min(filtered.length - 1, i + 1));
      }
    }
    // Enter
    else if (key.return) {
      handleEnter();
    }
    // Vim open
    else if (input === "v" && !isArchive && view.kind !== "clients") {
      if (marked.size === 0 && cursor) {
        writeShellCommand(`cd '${cursor.path}' && nvim .`);
        exit();
      }
    }
    // New
    else if (input === "n") {
      if (view.kind === "clients") {
        setDialog({ kind: "nameInput", purpose: "client" });
      } else if (view.kind !== "archive") {
        onSetView({ kind: "new", basePath: config.basePath });
      }
    }
    // Archive (shift+A)
    else if (input === "A" && view.kind !== "archive" && view.kind !== "clients") {
      const targets = getTargets();
      if (targets.length > 0) {
        setDialog({ kind: "confirmArchive", targets });
      }
    }
    // Enter sub-views
    else if (input === "t" && view.kind === "projects") {
      onSetView({ kind: "tries" });
    } else if (input === "c" && view.kind === "projects") {
      onSetView({ kind: "clients" });
    } else if (input === "a" && view.kind === "projects") {
      onSetView({ kind: "archive" });
    }
    // Send to client
    else if (input === "s" && (view.kind === "projects" || view.kind === "tries")) {
      const targets = getTargets();
      if (targets.length > 0) {
        setDialog({ kind: "clientPicker", targets });
      }
    }
    // Promote try
    else if (input === "p" && view.kind === "tries") {
      const targets = getTargets();
      if (targets.length > 0) {
        setDialog({ kind: "confirmPromote", targets });
      }
    }
    // Filter
    else if (input === "/") {
      setFilterMode(true);
      setFilterQuery("");
      setMarked(new Set());
    }
    // Escape
    else if (key.escape) {
      if (marked.size > 0) {
        setMarked(new Set());
      } else {
        popView();
      }
    }
    // Quit
    else if (input === "q") {
      exit();
    }
  });

  function handleEnter() {
    if (!cursor) return;
    if (view.kind === "clients") {
      onSetView({ kind: "client", name: cursor.name });
    } else if (view.kind === "archive") {
      const targets = getArchiveTargets();
      if (targets.length > 0) {
        setDialog({ kind: "confirmRestore", targets });
      }
    } else if (marked.size === 0) {
      writeShellCommand(`cd '${cursor.path}'`);
      exit();
    }
  }

  // Dialogs
  if (dialog?.kind === "confirmArchive") {
    const warnings: string[] = [];
    for (const p of dialog.targets) {
      const { modified, untracked, deleted } = p.status;
      const dirty = modified + untracked + deleted;
      if (dirty > 0) warnings.push(`${p.name}: ${dirty} uncommitted`);
      if (p.ahead > 0) warnings.push(`${p.name}: ${p.ahead} unpushed`);
    }
    return (
      <Confirm
        message={`Archive ${dialog.targets.length} project${dialog.targets.length > 1 ? "s" : ""}?`}
        items={dialog.targets.map((p) => p.name)}
        warning={warnings.length ? warnings.join(", ") : undefined}
        onConfirm={async () => {
          for (const p of dialog.targets) {
            await archiveProject(p.name, config.basePath);
          }
          setDialog(null);
          setMarked(new Set());
          setSelectedIndex(0);
          onRefresh();
        }}
        onCancel={() => setDialog(null)}
      />
    );
  }

  if (dialog?.kind === "confirmPromote") {
    return (
      <Confirm
        message={`Promote ${dialog.targets.length} to ~/Developer?`}
        items={dialog.targets.map((p) => p.name)}
        onConfirm={async () => {
          for (const p of dialog.targets) {
            await promoteTry(p.name);
          }
          setDialog(null);
          setMarked(new Set());
          setSelectedIndex(0);
          onRefresh();
        }}
        onCancel={() => setDialog(null)}
      />
    );
  }

  if (dialog?.kind === "confirmRestore") {
    const conflicts = dialog.targets.filter((t) =>
      existsSync(join(DEV_DIR, t.name))
    );
    return (
      <Confirm
        message={`Restore ${dialog.targets.length} project${dialog.targets.length > 1 ? "s" : ""}?`}
        items={dialog.targets.map((t) => t.name)}
        warning={
          conflicts.length
            ? `Already exists: ${conflicts.map((c) => c.name).join(", ")}`
            : undefined
        }
        onConfirm={async () => {
          for (const t of dialog.targets) {
            if (!existsSync(join(DEV_DIR, t.name))) {
              await restoreProject(t.name, t.year);
            }
          }
          setDialog(null);
          setMarked(new Set());
          setSelectedIndex(0);
          // Refresh archive data
          listArchivedProjects().then(setArchiveData);
          onRefresh();
        }}
        onCancel={() => setDialog(null)}
      />
    );
  }

  if (dialog?.kind === "clientPicker") {
    return (
      <ClientPicker
        onSelect={async (clientName) => {
          for (const p of dialog.targets) {
            await sendToClient(p.name, clientName, config.basePath);
          }
          setDialog(null);
          setMarked(new Set());
          setSelectedIndex(0);
          onRefresh();
        }}
        onCancel={() => setDialog(null)}
      />
    );
  }

  if (dialog?.kind === "nameInput") {
    return (
      <Box flexDirection="column" paddingLeft={1} paddingTop={1}>
        <Text bold>New client name:</Text>
        <Text> </Text>
        <Box>
          <Text bold color="blue">Name: </Text>
          <Text>{nameInput}</Text>
          <Text dimColor>{"\u2588"}</Text>
        </Box>
        <Text> </Text>
        <Text dimColor>enter create  esc cancel</Text>
      </Box>
    );
  }

  const { columns: termWidth, rows: termRows } = useTerminalSize();
  const showSidePreview = termWidth >= 100 && !isArchive && view.kind !== "clients";
  // Subtract 1 for border char when side preview is shown
  const listWidth = showSidePreview ? Math.floor(termWidth / 2) - 1 : termWidth;

  // Scroll window: reserve 4 rows for header + statusbar + padding
  const maxVisible = Math.max(5, termRows - 5);
  const scrollOffset = useMemo(() => {
    if (filtered.length <= maxVisible) return 0;
    // Keep cursor centered-ish in the visible window
    const half = Math.floor(maxVisible / 2);
    let offset = selectedIndex - half;
    offset = Math.max(0, offset);
    offset = Math.min(filtered.length - maxVisible, offset);
    return offset;
  }, [selectedIndex, filtered.length, maxVisible]);

  const visibleItems = filtered.slice(scrollOffset, scrollOffset + maxVisible);
  const showScrollHint = filtered.length > maxVisible;

  // Compute whether short dates (YY) should be used globally.
  // If nameW is smaller than the full name width, we're truncating — use short dates for all.
  const useShortDate = useMemo(() => {
    if (!listWidth) return false;
    const available = listWidth - 2; // marker
    // Same shrink logic as ProjectRow: branch first, then name
    let branchW = 12;
    const statusW = 16;
    const timeW = 8;
    if (maxNameWidth + 1 + branchW + statusW + timeW > available) {
      branchW = Math.max(0, branchW - (maxNameWidth + 1 + branchW + statusW + timeW - available));
    }
    const nameW = Math.min(maxNameWidth + 1, Math.max(15, available - branchW - statusW - timeW));
    return nameW < maxNameWidth + 1;
  }, [listWidth, maxNameWidth]);

  return (
    <Box flexDirection="column">
      <Box paddingLeft={1} paddingTop={1}>
        <Text bold dimColor>
          {config.title}
        </Text>
        {loading && <Text dimColor> loading...</Text>}
        {showScrollHint && (
          <Text dimColor>
            {" "}
            [{scrollOffset + 1}-{Math.min(scrollOffset + maxVisible, filtered.length)}/{filtered.length}]
          </Text>
        )}
      </Box>

      <Box flexDirection={showSidePreview ? "row" : "column"} flexGrow={1}>
        <Box
          flexDirection="column"
          width={showSidePreview ? "50%" : "100%"}
          paddingTop={1}
        >
          {filtered.length === 0 ? (
            <Box paddingLeft={1}>
              <Text dimColor>
                {filterQuery ? "No matches" : "Empty"}
              </Text>
            </Box>
          ) : (
            visibleItems.map(({ project, matchIndices }, vi) => {
              const i = vi + scrollOffset;
              const yearHeader =
                isArchive && !filterQuery ? archiveYearMap.get(i) : undefined;
              return (
                <Box key={project.name} flexDirection="column">
                  {yearHeader && (
                    <Box paddingLeft={1}>
                      <Text dimColor bold>
                        {"── " + yearHeader + " ──"}
                      </Text>
                    </Box>
                  )}
                  <ProjectRow
                    project={project}
                    isSelected={i === selectedIndex}
                    isMarked={marked.has(project.name)}
                    matchIndices={matchIndices}
                    maxNameWidth={maxNameWidth}
                    termWidth={listWidth}
                    forceShortDate={useShortDate}
                  />
                </Box>
              );
            })
          )}
        </Box>

        {showSidePreview && (
          <Box
            borderStyle="single"
            borderLeft
            borderTop={false}
            borderBottom={false}
            borderRight={false}
            borderDimColor
            flexDirection="column"
            width="50%"
            paddingTop={1}
          >
            <Preview project={cursor} height={maxVisible} />
          </Box>
        )}
      </Box>

      {filterMode && <SearchInput query={filterQuery} />}
      <StatusBar
        view={view}
        filterMode={filterMode}
        selectedCount={marked.size}
        width={termWidth}
      />
    </Box>
  );
}
