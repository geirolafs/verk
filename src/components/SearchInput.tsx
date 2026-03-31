import { Box, Text } from "ink";

type Props = {
  query: string;
};

export function SearchInput({ query }: Props) {
  return (
    <Box paddingLeft={1}>
      <Text bold color="blue">
        /{" "}
      </Text>
      <Text>{query}</Text>
      <Text dimColor>{"\u2588"}</Text>
    </Box>
  );
}
