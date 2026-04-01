import { Box, Text, useInput } from "ink";
import { useState, useEffect } from "react";
import { listClients } from "../utils/archive.ts";

type Props = {
  onSelect: (clientName: string) => void;
  onCancel: () => void;
};

export function ClientPicker({ onSelect, onCancel }: Props) {
  const [clients, setClients] = useState<string[]>([]);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    listClients().then(setClients);
  }, []);

  useInput((input, key) => {
    if (key.upArrow || input === "k") {
      setSelected((s) => Math.max(0, s - 1));
    } else if (key.downArrow || input === "j") {
      setSelected((s) => Math.min(clients.length - 1, s + 1));
    } else if (key.return && clients.length > 0) {
      onSelect(clients[selected]!);
    } else if (key.escape) {
      onCancel();
    }
  });

  return (
    <Box flexDirection="column" paddingLeft={1} paddingTop={1}>
      <Text bold>Send to client:</Text>
      <Text> </Text>
      {clients.length === 0 ? (
        <Text dimColor>No clients found</Text>
      ) : (
        clients.map((name, i) => (
          <Box key={name}>
            <Text inverse={i === selected} bold={i === selected}>
              {" "}
              {name}
            </Text>
          </Box>
        ))
      )}
      <Text> </Text>
      <Text dimColor>enter select  esc cancel</Text>
    </Box>
  );
}
