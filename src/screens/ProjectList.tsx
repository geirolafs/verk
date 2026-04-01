import { Box, Text, useInput, useApp } from "ink";
import { useState, useMemo } from "react";
import type { Project, Screen } from "../types.ts";
import { ProjectRow } from "../components/ProjectRow.tsx";
import { StatusBar } from "../components/StatusBar.tsx";
import { Preview } from "../components/Preview.tsx";
import { SearchInput } from "../components/SearchInput.tsx";
import { Confirm } from "../components/Confirm.tsx";
import { fuzzyMatch } from "../utils/fuzzy.ts";
import { archiveProject } from "../utils/archive.ts";
import { writeShellCommand } from "../utils/shellOutput.ts";

type Props = {
  projects: Project[];
  loading: boolean;
  onSetScreen: (screen: Screen) => void;
  onRefresh: () => void;
};

export function ProjectList({ projects, loading, onSetScreen, onRefresh }: Props) {
  const { exit } = useApp();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [filterMode, setFilterMode] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  const [confirmArchive, setConfirmArchive] = useState<Project[] | null>(null);

  const filteredWithMatches = useMemo(() => {
    if (!filterQuery)
      return projects.map((p) => ({ project: p, matchIndices: null as number[] | null }));
    return projects
      .map((p) => ({ project: p, match: fuzzyMatch(filterQuery, p.name) }))
      .filter((r) => r.match !== null)
      .sort((a, b) => b.match!.score - a.match!.score)
      .map((r) => ({ project: r.project, matchIndices: r.match!.indices }));
  }, [projects, filterQuery]);

  const filtered = filteredWithMatches.map((r) => r.project);
  const cursor = filtered[selectedIndex];
  const maxNameWidth = Math.max(...filtered.map((p) => p.name.length), 10);

  // Projects to act on: marked set if any, otherwise cursor
  function getTargets(): Project[] {
    if (marked.size > 0) {
      return filtered.filter((p) => marked.has(p.name));
    }
    return cursor ? [cursor] : [];
  }

  useInput((input, key) => {
    if (confirmArchive) return;

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
        if (cursor) {
          writeShellCommand(`cd '${cursor.path}'`);
          exit();
        }
      } else if (input && !key.ctrl && !key.meta) {
        setFilterQuery((q) => q + input);
        setSelectedIndex(0);
      }
      return;
    }

    if (key.upArrow || input === "k") {
      setSelectedIndex((i) => Math.max(0, i - 1));
    } else if (key.downArrow || input === "j") {
      setSelectedIndex((i) => Math.min(filtered.length - 1, i + 1));
    } else if (input === " ") {
      // Toggle mark on cursor project, advance cursor
      if (cursor) {
        setMarked((prev) => {
          const next = new Set(prev);
          if (next.has(cursor.name)) {
            next.delete(cursor.name);
          } else {
            next.add(cursor.name);
          }
          return next;
        });
        setSelectedIndex((i) => Math.min(filtered.length - 1, i + 1));
      }
    } else if (key.return) {
      // Enter only works on single (cursor), not multi-select
      if (marked.size === 0 && cursor) {
        writeShellCommand(`cd '${cursor.path}'`);
        exit();
      }
    } else if (input === "v") {
      if (marked.size === 0 && cursor) {
        writeShellCommand(`cd '${cursor.path}' && nvim .`);
        exit();
      }
    } else if (input === "n") {
      onSetScreen("new");
    } else if (input === "a") {
      const targets = getTargets();
      if (targets.length > 0) {
        setConfirmArchive(targets);
      }
    } else if (input === "u") {
      onSetScreen("archive");
    } else if (input === "/") {
      setFilterMode(true);
      setFilterQuery("");
      setMarked(new Set());
    } else if (key.escape) {
      if (marked.size > 0) {
        setMarked(new Set());
      } else {
        exit();
      }
    } else if (input === "q") {
      exit();
    }
  });

  if (confirmArchive) {
    const warnings: string[] = [];
    for (const p of confirmArchive) {
      const { modified, untracked, deleted } = p.status;
      const dirty = modified + untracked + deleted;
      if (dirty > 0) warnings.push(`${p.name}: ${dirty} uncommitted`);
      if (p.ahead > 0) warnings.push(`${p.name}: ${p.ahead} unpushed`);
    }

    return (
      <Confirm
        message={`Archive ${confirmArchive.length} project${confirmArchive.length > 1 ? "s" : ""}?`}
        items={confirmArchive.map((p) => p.name)}
        warning={warnings.length ? warnings.join(", ") : undefined}
        onConfirm={async () => {
          for (const p of confirmArchive) {
            await archiveProject(p.name);
          }
          setConfirmArchive(null);
          setMarked(new Set());
          setSelectedIndex(0);
          onRefresh();
        }}
        onCancel={() => setConfirmArchive(null)}
      />
    );
  }

  const termWidth = process.stderr.columns ?? 80;
  const showSidePreview = termWidth >= 100;

  return (
    <Box flexDirection="column">
      <Box paddingLeft={1} paddingTop={1}>
        <Text bold dimColor>
          ~/Developer
        </Text>
        {loading && <Text dimColor> loading...</Text>}
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
                {filterQuery ? "No matches" : "No projects"}
              </Text>
            </Box>
          ) : (
            filteredWithMatches.map(({ project, matchIndices }, i) => (
              <ProjectRow
                key={project.name}
                project={project}
                isSelected={i === selectedIndex}
                isMarked={marked.has(project.name)}
                matchIndices={matchIndices}
                maxNameWidth={maxNameWidth}
              />
            ))
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
            <Preview project={cursor} />
          </Box>
        )}
      </Box>

      {filterMode && <SearchInput query={filterQuery} />}
      <StatusBar filterMode={filterMode} selectedCount={marked.size} />
    </Box>
  );
}
