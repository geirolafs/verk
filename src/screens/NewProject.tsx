import { Box, Text, useInput, useApp } from "ink";
import { useState } from "react";
import { join } from "path";
import { TemplatePicker } from "../components/TemplatePicker.tsx";
import { fullProjectName, templateCommands } from "../utils/templates.ts";
import { writeShellCommand } from "../utils/shellOutput.ts";

type Step = "template" | "name";

type Props = {
  basePath: string;
  initialName?: string;
  onBack: () => void;
};

export function NewProject({ basePath, initialName, onBack }: Props) {
  const { exit } = useApp();
  const [step, setStep] = useState<Step>("template");
  const [template, setTemplate] = useState("");
  const [name, setName] = useState(initialName ?? "");

  function create(projectName: string, tmpl: string) {
    const full = fullProjectName(projectName);
    const projectPath = join(basePath, full);
    writeShellCommand(templateCommands(projectPath, tmpl));
    exit();
  }

  useInput((input, key) => {
    if (step !== "name") return;
    if (key.escape) {
      onBack();
    } else if (key.backspace || key.delete) {
      setName((n) => n.slice(0, -1));
    } else if (key.return && name.trim()) {
      create(name.trim(), template);
    } else if (input && !key.ctrl && !key.meta) {
      setName((n) => n + input);
    }
  });

  if (step === "template") {
    return (
      <TemplatePicker
        onSelect={(t) => {
          setTemplate(t);
          if (initialName) {
            create(initialName, t);
          } else {
            setStep("name");
          }
        }}
        onCancel={onBack}
      />
    );
  }

  const preview = fullProjectName(name.trim() || "...");
  const displayPath = basePath.replace(process.env["HOME"]!, "~");

  return (
    <Box flexDirection="column" paddingLeft={1} paddingTop={1}>
      <Text bold>New {template} project</Text>
      <Text> </Text>
      <Box>
        <Text bold color="blue">Name: </Text>
        <Text>{name}</Text>
        <Text dimColor>{"\u2588"}</Text>
      </Box>
      <Text dimColor>
        {"\u2192"} {displayPath}/{preview}
      </Text>
      <Text> </Text>
      <Text dimColor>enter create  esc back</Text>
    </Box>
  );
}
