import { Box, Text } from "ink";
import type { Project } from "../types.ts";
import { relativeTime } from "../utils/time.ts";

type Props = {
  project: Project;
  isSelected: boolean;
  maxNameWidth: number;
};

export function ProjectRow({ project, isSelected, maxNameWidth }: Props) {
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
        {" "}
        {dot}
        <Text bold={isSelected}>
          {name.padEnd(maxNameWidth + 1)}
        </Text>
        <Text dimColor>{(branch ?? "").padEnd(12)}</Text>
        <Text
          color={dirtyCount > 0 ? "yellow" : "green"}
          dimColor={!isGitRepo}
        >
          {statusText.padEnd(10)}
        </Text>
        <Text dimColor>
          {time.padEnd(8)}
        </Text>
        {isStale && <Text color="yellow"> {"\u26A0"}</Text>}
      </Text>
    </Box>
  );
}
