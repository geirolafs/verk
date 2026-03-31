import { Box, Text } from "ink";
import type { Project } from "../types.ts";
import { relativeTimeFromPrefix } from "../utils/time.ts";

const BRANCH_WIDTH = 12;
const STATUS_WIDTH = 10;
const TIME_WIDTH = 8;

function fit(str: string, width: number): string {
  if (str.length <= width) return str.padEnd(width);
  return str.slice(0, width - 1) + "\u2026";
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
};

export function ProjectRow({ project, isSelected, isMarked, matchIndices, maxNameWidth }: Props) {
  const { name, branch, dirtyCount, isGitRepo } = project;

  const marker = isMarked ? "> " : "  ";
  const time = relativeTimeFromPrefix(name);

  const statusText =
    !isGitRepo
      ? ""
      : dirtyCount > 0
        ? `${dirtyCount} dirty`
        : "clean";

  return (
    <Box>
      <Text inverse={isSelected} bold={isSelected}>
        {marker}
        <HighlightedName
          name={name}
          width={maxNameWidth + 1}
          indices={matchIndices}
          isBold={isSelected}
        />
        <Text dimColor>{fit(branch ?? "", BRANCH_WIDTH)}</Text>
        <Text
          color={dirtyCount > 0 ? "yellow" : "green"}
          dimColor={!isGitRepo}
        >
          {fit(statusText, STATUS_WIDTH)}
        </Text>
        <Text dimColor>{fit(time, TIME_WIDTH)}</Text>
      </Text>
    </Box>
  );
}
