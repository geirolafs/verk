import { Box, Text, useInput } from "ink";
import { useState } from "react";
import { TEMPLATES } from "../utils/templates.ts";

type Props = {
  onSelect: (template: string) => void;
  onCancel: () => void;
};

export function TemplatePicker({ onSelect, onCancel }: Props) {
  const [selected, setSelected] = useState(0);

  useInput((input, key) => {
    if (key.upArrow || input === "k") {
      setSelected((s) => Math.max(0, s - 1));
    } else if (key.downArrow || input === "j") {
      setSelected((s) => Math.min(TEMPLATES.length - 1, s + 1));
    } else if (key.return) {
      onSelect(TEMPLATES[selected]!.name);
    } else if (key.escape) {
      onCancel();
    }
  });

  return (
    <Box flexDirection="column" paddingLeft={1}>
      <Text bold>Select template:</Text>
      <Text> </Text>
      {TEMPLATES.map((t, i) => (
        <Box key={t.name}>
          <Text inverse={i === selected} bold={i === selected}>
            {" "}
            {t.label.padEnd(10)} <Text dimColor>{t.description}</Text>
          </Text>
        </Box>
      ))}
      <Text> </Text>
      <Text dimColor>enter select  esc back</Text>
    </Box>
  );
}
