import { Box, Text } from "ink";

type Props = {
  filterMode?: boolean;
  selectedCount?: number;
};

export function StatusBar({ filterMode, selectedCount = 0 }: Props) {
  if (filterMode) {
    return (
      <Box borderStyle="single" borderTop borderBottom={false} borderLeft={false} borderRight={false} borderDimColor paddingLeft={1}>
        <Text dimColor>esc close filter</Text>
      </Box>
    );
  }

  if (selectedCount > 0) {
    return (
      <Box borderStyle="single" borderTop borderBottom={false} borderLeft={false} borderRight={false} borderDimColor paddingLeft={1}>
        <Text bold color="blue">{selectedCount} selected</Text>
        <Text dimColor>  a archive  space toggle  esc clear</Text>
      </Box>
    );
  }

  return (
    <Box borderStyle="single" borderTop borderBottom={false} borderLeft={false} borderRight={false} borderDimColor paddingLeft={1}>
      <Text dimColor>
        enter cd  v nvim  n new  a archive  u unarchive  / filter  space select  q quit
      </Text>
    </Box>
  );
}
