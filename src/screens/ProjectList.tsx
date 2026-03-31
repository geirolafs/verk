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

type Props = {
  projects: Project[];
  loading: boolean;
  onSetScreen: (screen: Screen) => void;
  onRefresh: () => void;
};

export function ProjectList({ projects, loading, onSetScreen, onRefresh }: Props) {
  const { exit } = useApp();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filterMode, setFilterMode] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  const [confirmArchive, setConfirmArchive] = useState<Project | null>(null);

  const filtered = useMemo(() => {
    if (!filterQuery) return projects;
    return projects
      .map((p) => ({ project: p, match: fuzzyMatch(filterQuery, p.name) }))
      .filter((r) => r.match !== null)
      .sort((a, b) => b.match!.score - a.match!.score)
      .map((r) => r.project);
  }, [projects, filterQuery]);

  const selected = filtered[selectedIndex];
  const maxNameWidth = Math.max(...filtered.map((p) => p.name.length), 10);

  useInput((input, key) => {
    if (confirmArchive) return; // Confirm dialog handles its own input

    if (filterMode) {
      if (key.escape) {
        setFilterMode(false);
        setFilterQuery("");
        setSelectedIndex(0);
      } else if (key.backspace || key.delete) {
        setFilterQuery((q) => q.slice(0, -1));
        setSelectedIndex(0);
      } else if (key.return) {
        if (selected) {
          write(`cd '${selected.path}'`);
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
    } else if (key.return) {
      if (selected) {
        write(`cd '${selected.path}'`);
        exit();
      }
    } else if (input === "v") {
      if (selected) {
        write(`cd '${selected.path}' && nvim .`);
        exit();
      }
    } else if (input === "n") {
      onSetScreen("new");
    } else if (input === "a") {
      if (selected) {
        setConfirmArchive(selected);
      }
    } else if (input === "u") {
      onSetScreen("archive");
    } else if (input === "/") {
      setFilterMode(true);
      setFilterQuery("");
    } else if (input === "q" || key.escape) {
      exit();
    }
  });

  if (confirmArchive) {
    const warnings: string[] = [];
    if (confirmArchive.dirtyCount > 0)
      warnings.push(`${confirmArchive.dirtyCount} uncommitted changes`);
    if (confirmArchive.hasUnpushed)
      warnings.push("unpushed commits");

    return (
      <Confirm
        message={`Archive '${confirmArchive.name}'?`}
        warning={warnings.length ? warnings.join(", ") : undefined}
        onConfirm={async () => {
          await archiveProject(confirmArchive.name);
          setConfirmArchive(null);
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
        {/* Project list */}
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
            filtered.map((project, i) => (
              <ProjectRow
                key={project.name}
                project={project}
                isSelected={i === selectedIndex}
                maxNameWidth={maxNameWidth}
              />
            ))
          )}
        </Box>

        {/* Preview */}
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
            <Preview project={selected} />
          </Box>
        )}
      </Box>

      {filterMode && <SearchInput query={filterQuery} />}
      <StatusBar filterMode={filterMode} />
    </Box>
  );
}

import { writeShellCommand } from "../utils/shellOutput.ts";

function write(cmd: string) {
  writeShellCommand(cmd);
}
