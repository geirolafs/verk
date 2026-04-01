import { Box, Text } from "ink";
import type { Project } from "../types.ts";
import { relativeTimeFromPrefix } from "../utils/time.ts";

const BRANCH_WIDTH = 12;
const STATUS_WIDTH = 16;
const TIME_WIDTH = 8;

function fit(str: string, width: number): string {
  if (str.length <= width) return str.padEnd(width);
  return str.slice(0, width - 1) + "\u2026";
}

function formatStatus(project: Project): string {
  if (!project.isGitRepo) return "";
  const { modified, untracked, deleted } = project.status;
  const parts: string[] = [];
  if (modified > 0) parts.push(`~${modified}`);
  if (untracked > 0) parts.push(`+${untracked}`);
  if (deleted > 0) parts.push(`-${deleted}`);
  if (project.ahead > 0) parts.push(`\u2191${project.ahead}`);
  if (parts.length === 0) return "clean";
  return parts.join(" ");
}

function isClean(project: Project): boolean {
  const { modified, untracked, deleted } = project.status;
  return modified === 0 && untracked === 0 && deleted === 0 && project.ahead === 0;
}

/** Render name with highlighted match indices */
function HighlightedName({
  name,
  width,
  indices,
  isBold,
}: {
  name: string;
  width: number;
  indices: number[] | null;
  isBold: boolean;
}) {
  const display = fit(name, width);
  if (!indices || indices.length === 0) {
    return <Text bold={isBold}>{display}</Text>;
  }

  const indexSet = new Set(indices);
  const parts: { text: string; highlight: boolean }[] = [];
  let current = "";
  let currentHighlight = false;

  for (let i = 0; i < display.length; i++) {
    const isMatch = indexSet.has(i);
    if (i === 0) {
      currentHighlight = isMatch;
      current = display[i]!;
    } else if (isMatch === currentHighlight) {
      current += display[i];
    } else {
      parts.push({ text: current, highlight: currentHighlight });
      current = display[i]!;
      currentHighlight = isMatch;
    }
  }
  if (current) parts.push({ text: current, highlight: currentHighlight });

  return (
    <Text bold={isBold}>
      {parts.map((p, i) =>
        p.highlight ? (
          <Text key={i} bold color="yellow">
            {p.text}
          </Text>
        ) : (
          <Text key={i}>{p.text}</Text>
        )
      )}
    </Text>
  );
}

// Fixed columns: marker(2) + branch(12) + status(16) + time(8) = 38
const FIXED_COLS = 2 + BRANCH_WIDTH + STATUS_WIDTH + TIME_WIDTH;

type Props = {
  project: Project;
  isSelected: boolean;
  isMarked: boolean;
  matchIndices: number[] | null;
  maxNameWidth: number;
  termWidth?: number;
};

export function ProjectRow({ project, isSelected, isMarked, matchIndices, maxNameWidth, termWidth }: Props) {
  // Cap name width so total row fits terminal
  const availableForName = termWidth
    ? Math.max(15, termWidth - FIXED_COLS)
    : maxNameWidth + 1;
  const nameWidth = Math.min(maxNameWidth + 1, availableForName);
  const { name, branch, isGitRepo } = project;

  const marker = isMarked ? "> " : "  ";
  const time = relativeTimeFromPrefix(name);
  const statusText = formatStatus(project);
  const clean = isClean(project);

  return (
    <Box>
      <Text inverse={isSelected} bold={isSelected}>
        {marker}
        <HighlightedName
          name={name}
          width={nameWidth}
          indices={matchIndices}
          isBold={isSelected}
        />
        <Text dimColor>{fit(branch ?? "", BRANCH_WIDTH)}</Text>
        <Text
          color={clean ? "green" : "yellow"}
          dimColor={!isGitRepo}
        >
          {fit(statusText, STATUS_WIDTH)}
        </Text>
        <Text dimColor>{fit(time, TIME_WIDTH)}</Text>
      </Text>
    </Box>
  );
}
