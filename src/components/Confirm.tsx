import { Box, Text, useInput } from "ink";

type Props = {
  message: string;
  items?: string[];
  warning?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function Confirm({ message, items, warning, onConfirm, onCancel }: Props) {
  useInput((input, key) => {
    if (input === "y" || input === "Y") onConfirm();
    if (input === "n" || input === "N" || key.escape) onCancel();
  });

  return (
    <Box flexDirection="column" paddingLeft={1} paddingTop={1}>
      <Text bold>{message}</Text>
      {items?.map((item) => (
        <Text key={item}>  {item}</Text>
      ))}
      {warning && (
        <Text color="yellow">{"\u26A0"} {warning}</Text>
      )}
      <Text dimColor>y/n</Text>
    </Box>
  );
}
