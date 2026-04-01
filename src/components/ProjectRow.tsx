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

type Props = {
  project: Project;
  isSelected: boolean;
  isMarked: boolean;
  matchIndices: number[] | null;
  maxNameWidth: number;
  termWidth?: number;
};

export function ProjectRow({ project, isSelected, isMarked, matchIndices, maxNameWidth, termWidth }: Props) {
  const { name, branch, isGitRepo } = project;
  const marker = isMarked ? "> " : "  ";
  const time = relativeTimeFromPrefix(name);
  const statusText = formatStatus(project);
  const clean = isClean(project);

  // Compute column widths to fit termWidth
  let nameW = maxNameWidth + 1;
  let branchW = BRANCH_WIDTH;
  let statusW = STATUS_WIDTH;
  let timeW = TIME_WIDTH;

  if (termWidth) {
    const available = termWidth - 2; // marker
    // Shrink name first, then time, then status, then branch
    const total = () => nameW + branchW + statusW + timeW;
    if (total() > available) nameW = Math.max(15, available - branchW - statusW - timeW);
    if (total() > available) timeW = Math.max(0, available - nameW - branchW - statusW);
    if (total() > available) statusW = Math.max(0, available - nameW - branchW);
    if (total() > available) branchW = Math.max(0, available - nameW);
  }

  return (
    <Box>
      <Text inverse={isSelected} bold={isSelected}>
        {marker}
        <HighlightedName
          name={name}
          width={nameW}
          indices={matchIndices}
          isBold={isSelected}
        />
        {branchW > 0 && <Text dimColor>{fit(branch ?? "", branchW)}</Text>}
        {statusW > 0 && (
          <Text
            color={clean ? "green" : "yellow"}
            dimColor={!isGitRepo}
          >
            {fit(statusText, statusW)}
          </Text>
        )}
        {timeW > 0 && <Text dimColor>{fit(time, timeW)}</Text>}
      </Text>
    </Box>
  );
}
