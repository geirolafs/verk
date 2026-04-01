import { Box, Text } from "ink";
import type { View } from "../types.ts";

type Props = {
  view: View;
  filterMode?: boolean;
  selectedCount?: number;
};

export function StatusBar({ view, filterMode, selectedCount = 0 }: Props) {
  if (filterMode) {
    return (
      <Box borderStyle="single" borderTop borderBottom={false} borderLeft={false} borderRight={false} borderDimColor paddingLeft={1}>
        <Text dimColor>esc close filter</Text>
      </Box>
    );
  }

  if (selectedCount > 0) {
    const actions = getSelectionActions(view);
    return (
      <Box borderStyle="single" borderTop borderBottom={false} borderLeft={false} borderRight={false} borderDimColor paddingLeft={1}>
        <Text bold color="blue">{selectedCount} selected</Text>
        <Text dimColor>  {actions}  space toggle  esc clear</Text>
      </Box>
    );
  }

  const hints = getHints(view);
  return (
    <Box borderStyle="single" borderTop borderBottom={false} borderLeft={false} borderRight={false} borderDimColor paddingLeft={1}>
      <Text dimColor>{hints}</Text>
    </Box>
  );
}

function getSelectionActions(view: View): string {
  switch (view.kind) {
    case "tries":
      return "A archive  p promote  s send to client";
    case "archive":
      return "enter restore";
    default:
      return "A archive  s send to client";
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
