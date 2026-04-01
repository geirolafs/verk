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
  if (parts.length === 0) return "\u25cb";
  return parts.join(" ");
}

function isClean(project: Project): boolean {
  const { modified, untracked, deleted } = project.status;
  return modified === 0 && untracked === 0 && deleted === 0 && project.ahead === 0;
}

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})-(.+)$/;

/** Split name into date prefix and rest. Returns null if no date prefix. */
function splitDateName(name: string): { date: string; rest: string; shortDate: string } | null {
  const m = name.match(DATE_RE);
  if (!m) return null;
  return {
    date: `${m[1]}-${m[2]}-${m[3]}-`,       // "2026-03-14-"
    shortDate: `${m[1]!.slice(2)}-${m[2]}-${m[3]}-`, // "26-03-14-"
    rest: m[4]!,
  };
}

/**
 * Render the project name with:
 * - Date prefix dimmed
 * - Progressive truncation: YYYY→YY first, then truncate rest with …
 * - Min 5 chars of rest visible before truncating
 * - Fuzzy match highlighting
 */
function ProjectName({
  name,
  width,
  indices,
  isBold,
  forceShortDate,
}: {
  name: string;
  width: number;
  indices: number[] | null;
  isBold: boolean;
  forceShortDate?: boolean;
}) {
  const parsed = splitDateName(name);

  if (!parsed) {
    // No date prefix — just render with fit + highlighting
    return <HighlightedText text={fit(name, width)} indices={indices} isBold={isBold} />;
  }

  const { date, shortDate, rest } = parsed;
  const fullLen = date.length + rest.length;

  let dateDisplay: string;
  let restDisplay: string;
  // Offset for match indices when using short date (2 chars shorter)
  let indexOffset = 0;

  if (forceShortDate) {
    // All rows use short date when any row needs it
    dateDisplay = shortDate;
    indexOffset = 2;
    const shortFullLen = shortDate.length + rest.length;
    if (shortFullLen <= width) {
      restDisplay = rest;
    } else {
      const availableForRest = width - shortDate.length;
      restDisplay = availableForRest >= 2 ? rest.slice(0, availableForRest - 1) + "\u2026" : "";
    }
  } else if (fullLen <= width) {
    // Full date fits
    dateDisplay = date;
    restDisplay = rest;
  } else if (shortDate.length + rest.length <= width) {
    // Short date fits
    dateDisplay = shortDate;
    restDisplay = rest;
    indexOffset = 2;
  } else {
    // Need to truncate rest too
    dateDisplay = shortDate;
    indexOffset = 2;
    const availableForRest = width - shortDate.length;
    if (availableForRest >= 6) {
      // At least 5 chars + ellipsis
      restDisplay = rest.slice(0, availableForRest - 1) + "\u2026";
    } else if (availableForRest > 0) {
      restDisplay = rest.slice(0, availableForRest - 1) + "\u2026";
    } else {
      restDisplay = "";
    }
  }

  const totalLen = dateDisplay.length + restDisplay.length;
  const padding = width > totalLen ? " ".repeat(width - totalLen) : "";

  // Adjust match indices for the shortened date
  const adjustedIndices = indices && indexOffset > 0
    ? indices.map((i) => i - indexOffset).filter((i) => i >= 0)
    : indices;

  // Split indices into date part and rest part
  const dateLen = dateDisplay.length;
  const dateIndices = adjustedIndices?.filter((i) => i < dateLen) ?? [];
  const restIndices = adjustedIndices?.filter((i) => i >= dateLen).map((i) => i - dateLen) ?? [];

  return (
    <Text bold={isBold}>
      <HighlightedText text={dateDisplay} indices={dateIndices.length > 0 ? dateIndices : null} isBold={isBold} dimBase />
      <HighlightedText text={restDisplay + padding} indices={restIndices.length > 0 ? restIndices : null} isBold={isBold} />
    </Text>
  );
}

/** Render text with optional highlighted indices */
function HighlightedText({
  text,
  indices,
  isBold,
  dimBase,
}: {
  text: string;
  indices: number[] | null;
  isBold: boolean;
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
          <Text key={i} bold color="yellow">
            {p.text}
          </Text>
        ) : dimBase ? (
          <Text key={i} dimColor>
            {p.text}
          </Text>
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
  const clean = isClean(project);

  // Min name: short date (9) + 5 chars + ellipsis = 15
  const MIN_NAME = 15;

  // Compute column widths to fit termWidth
  let nameW = maxNameWidth + 1;
  let branchW = BRANCH_WIDTH;
  let statusW = STATUS_WIDTH;
  let timeW = TIME_WIDTH;

  if (termWidth) {
    const available = termWidth - 2; // marker
    const total = () => nameW + branchW + statusW + timeW;
    // 1. Shrink branch first (before name)
    if (total() > available) branchW = Math.max(0, branchW - (total() - available));
    // 2. Then shrink name
    if (total() > available) nameW = Math.max(MIN_NAME, available - branchW - statusW - timeW);
    // 3. Then time
    if (total() > available) timeW = Math.max(0, available - nameW - branchW - statusW);
    // 4. Then status
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
          isBold={isSelected}
          forceShortDate={forceShortDate}
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
