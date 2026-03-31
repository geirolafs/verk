import { Box, Text } from "ink";
import type { Project } from "../types.ts";
import { relativeTime } from "../utils/time.ts";

const BRANCH_WIDTH = 12;
const STATUS_WIDTH = 10;
const TIME_WIDTH = 8;

function fit(str: string, width: number): string {
  if (str.length <= width) return str.padEnd(width);
  return str.slice(0, width - 1) + "\u2026";
}

type Props = {
  project: Project;
  isSelected: boolean;
  isMarked: boolean;
  maxNameWidth: number;
};

export function ProjectRow({ project, isSelected, isMarked, maxNameWidth }: Props) {
  const { name, branch, dirtyCount, lastCommitTime, isStale, isGitRepo } =
    project;

  const dot = !isGitRepo
    ? "  "
    : dirtyCount > 0
      ? "\u001b[33m\u25cf\u001b[0m "
      : "\u001b[32m\u25cf\u001b[0m ";

  const statusText =
    !isGitRepo
      ? ""
      : dirtyCount > 0
        ? `${dirtyCount} dirty`
        : "clean";

  const time = lastCommitTime ? relativeTime(lastCommitTime) : "";

  return (
    <Box>
      <Text inverse={isSelected} bold={isSelected}>
        {isMarked ? ">" : " "}
        {dot}
        <Text bold={isSelected}>
          {fit(name, maxNameWidth + 1)}
        </Text>
        <Text dimColor>{fit(branch ?? "", BRANCH_WIDTH)}</Text>
        <Text
          color={dirtyCount > 0 ? "yellow" : "green"}
          dimColor={!isGitRepo}
        >
          {fit(statusText, STATUS_WIDTH)}
        </Text>
        <Text dimColor>
          {fit(time, TIME_WIDTH)}
        </Text>
        {isStale && <Text color="yellow"> {"\u26A0"}</Text>}
      </Text>
    </Box>
  );
}
