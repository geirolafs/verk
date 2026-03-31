import { Box, Text } from "ink";
import type { Project } from "../types.ts";

const BRANCH_WIDTH = 12;
const STATUS_WIDTH = 10;

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
  const { name, branch, dirtyCount, isGitRepo } = project;

  const marker = isMarked ? "> " : "  ";

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
        <Text bold={isSelected}>
          {fit(name, maxNameWidth + 1)}
        </Text>
        <Text dimColor>{fit(branch ?? "", BRANCH_WIDTH)}</Text>
        <Text
          color={dirtyCount > 0 ? "yellow" : "green"}
          dimColor={!isGitRepo}
        >
          {statusText}
        </Text>
      </Text>
    </Box>
  );
}
