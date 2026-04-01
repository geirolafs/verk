import { Box, Text } from "ink";
import type { View } from "../types.ts";

type Props = {
  view: View;
  filterMode?: boolean;
  selectedCount?: number;
  width?: number;
};

function truncate(str: string, maxWidth?: number): string {
  if (!maxWidth || str.length <= maxWidth) return str;
  return str.slice(0, maxWidth - 1) + "\u2026";
}

export function StatusBar({ view, filterMode, selectedCount = 0, width }: Props) {
  // Account for border padding (paddingLeft=1 + border)
  const maxW = width ? width - 2 : undefined;

  if (filterMode) {
    return (
      <Box borderStyle="single" borderTop borderBottom={false} borderLeft={false} borderRight={false} borderDimColor paddingLeft={1}>
        <Text dimColor>esc close filter</Text>
      </Box>
    );
  }

  if (selectedCount > 0) {
    const prefix = `${selectedCount} selected  `;
    const actions = getSelectionActions(view) + "  space toggle  esc clear";
    return (
      <Box borderStyle="single" borderTop borderBottom={false} borderLeft={false} borderRight={false} borderDimColor paddingLeft={1}>
        <Text bold color="blue">{selectedCount} selected</Text>
        <Text dimColor>  {truncate(actions, maxW ? maxW - prefix.length : undefined)}</Text>
      </Box>
    );
  }

  const hints = truncate(getHints(view), maxW);
  return (
    <Box borderStyle="single" borderTop borderBottom={false} borderLeft={false} borderRight={false} borderDimColor paddingLeft={1}>
      <Text dimColor>{hints}</Text>
    </Box>
  );
}

function getSelectionActions(view: View): string {
  switch (view.kind) {
    case "tries":
      return "A archive  p promote  s send";
    case "archive":
      return "enter restore";
    default:
      return "A archive  s send";
  }
}

function getHints(view: View): string {
  switch (view.kind) {
    case "projects":
      return "enter cd  v nvim  n new  A archive  s send  t tries  c clients  a archive  / filter  space select  q quit";
    case "tries":
      return "enter cd  v nvim  p promote  A archive  s send  / filter  space select  esc back";
    case "clients":
      return "enter open  n new client  / filter  esc back";
    case "client":
      return "enter cd  v nvim  n new  / filter  space select  esc back";
    case "archive":
      return "enter restore  / filter  space select  esc back";
    default:
      return "";
  }
}
