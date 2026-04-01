import { Box, Text } from "ink";
import type { Project } from "../types.ts";
import { relativeTimeFromPrefix } from "../utils/time.ts";

const BRANCH_WIDTH = 12;
const STATUS_WIDTH = 16;
const TIME_WIDTH = 3;
const MIN_NAME = 15; // short date (9) + 5 chars + ellipsis

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
  return parts.length === 0 ? "\u25cb" : parts.join(" ");
}

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})-(.+)$/;

function splitDateName(name: string) {
  const m = name.match(DATE_RE);
  if (!m) return null;
  return {
    date: `${m[1]}-${m[2]}-${m[3]}-`,
    shortDate: `${m[1]!.slice(2)}-${m[2]}-${m[3]}-`,
    rest: m[4]!,
  };
}

function ProjectName({
  name,
  width,
  indices,
  forceShortDate,
}: {
  name: string;
  width: number;
  indices: number[] | null;
  forceShortDate?: boolean;
}) {
  const parsed = splitDateName(name);

  if (!parsed) {
    return <HighlightedText text={fit(name, width)} indices={indices} />;
  }

  const { date, shortDate, rest } = parsed;
  const useShort = forceShortDate || date.length + rest.length > width;

  let dateDisplay: string;
  let restDisplay: string;
  let indexOffset = 0;

  if (!useShort && date.length + rest.length <= width) {
    dateDisplay = date;
    restDisplay = rest;
  } else {
    dateDisplay = shortDate;
    indexOffset = 2;
    const available = width - shortDate.length;
    if (available >= rest.length) {
      restDisplay = rest;
    } else if (available >= 2) {
      restDisplay = rest.slice(0, available - 1) + "\u2026";
    } else {
      restDisplay = "";
    }
  }

  const totalLen = dateDisplay.length + restDisplay.length;
  const padding = width > totalLen ? " ".repeat(width - totalLen) : "";

  const adjusted = indices && indexOffset > 0
    ? indices.map((i) => i - indexOffset).filter((i) => i >= 0)
    : indices;

  const dateLen = dateDisplay.length;
  const dateIndices = adjusted?.filter((i) => i < dateLen) ?? [];
  const restIndices = adjusted?.filter((i) => i >= dateLen).map((i) => i - dateLen) ?? [];

  return (
    <Text>
      <HighlightedText text={dateDisplay} indices={dateIndices.length > 0 ? dateIndices : null} dimBase />
      <HighlightedText text={restDisplay + padding} indices={restIndices.length > 0 ? restIndices : null} />
    </Text>
  );
}

function HighlightedText({
  text,
  indices,
  dimBase,
}: {
  text: string;
  indices: number[] | null;
  dimBase?: boolean;
}) {
  if (!indices || indices.length === 0) {
    return dimBase ? <Text dimColor>{text}</Text> : <Text>{text}</Text>;
  }

  const indexSet = new Set(indices);
  const parts: { text: string; highlight: boolean }[] = [];
  let current = "";
  let currentHighlight = false;

  for (let i = 0; i < text.length; i++) {
    const isMatch = indexSet.has(i);
    if (i === 0) {
      currentHighlight = isMatch;
      current = text[i]!;
    } else if (isMatch === currentHighlight) {
      current += text[i];
    } else {
      parts.push({ text: current, highlight: currentHighlight });
      current = text[i]!;
      currentHighlight = isMatch;
    }
  }
  if (current) parts.push({ text: current, highlight: currentHighlight });

  return (
    <>
      {parts.map((p, i) =>
        p.highlight ? (
          <Text key={i} bold color="yellow">{p.text}</Text>
        ) : dimBase ? (
          <Text key={i} dimColor>{p.text}</Text>
        ) : (
          <Text key={i}>{p.text}</Text>
        )
      )}
    </>
  );
}

type Props = {
  project: Project;
  isSelected: boolean;
  isMarked: boolean;
  matchIndices: number[] | null;
  maxNameWidth: number;
  termWidth?: number;
  forceShortDate?: boolean;
};

export function ProjectRow({ project, isSelected, isMarked, matchIndices, maxNameWidth, termWidth, forceShortDate }: Props) {
  const { name, branch, isGitRepo } = project;
  const marker = isMarked ? "> " : "  ";
  const time = relativeTimeFromPrefix(name);
  const statusText = formatStatus(project);
  const { modified, untracked, deleted } = project.status;
  const clean = modified === 0 && untracked === 0 && deleted === 0 && project.ahead === 0;

  let nameW = maxNameWidth + 1;
  let branchW = BRANCH_WIDTH;
  let statusW = STATUS_WIDTH;
  let timeW = TIME_WIDTH;

  if (termWidth) {
    const available = termWidth - 2;
    const total = () => nameW + branchW + statusW + timeW;
    if (total() > available) branchW = Math.max(0, branchW - (total() - available));
    if (total() > available) nameW = Math.max(MIN_NAME, available - branchW - statusW - timeW);
    if (total() > available) timeW = Math.max(0, available - nameW - branchW - statusW);
    if (total() > available) statusW = Math.max(0, available - nameW - branchW);
  }

  return (
    <Box>
      <Text inverse={isSelected} bold={isSelected}>
        {marker}
        <ProjectName
          name={name}
          width={nameW}
          indices={matchIndices}
          forceShortDate={forceShortDate}
        />
        {branchW > 0 && <Text dimColor>{fit(branch ?? "", branchW)}</Text>}
        {statusW > 0 && (
          <Text color={clean ? "green" : "yellow"} dimColor={!isGitRepo}>
            {fit(statusText, statusW)}
          </Text>
        )}
        {timeW > 0 && <Text dimColor>{fit(time, timeW)}</Text>}
      </Text>
    </Box>
  );
}
