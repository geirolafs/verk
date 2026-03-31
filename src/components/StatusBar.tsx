import { Box, Text } from "ink";

type Props = {
  filterMode?: boolean;
};

export function StatusBar({ filterMode }: Props) {
  if (filterMode) {
    return (
      <Box borderStyle="single" borderTop borderBottom={false} borderLeft={false} borderRight={false} borderDimColor paddingLeft={1}>
        <Text dimColor>esc close filter</Text>
      </Box>
    );
  }

  return (
    <Box borderStyle="single" borderTop borderBottom={false} borderLeft={false} borderRight={false} borderDimColor paddingLeft={1}>
      <Text dimColor>
        enter cd  v nvim  n new  a archive  u unarchive  / filter  q quit
      </Text>
    </Box>
  );
}
