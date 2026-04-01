import { Box, Text, useInput, useApp } from "ink";
import { useState } from "react";
import { join } from "path";
import { TemplatePicker } from "../components/TemplatePicker.tsx";
import { fullProjectName, templateCommands } from "../utils/templates.ts";
import { writeShellCommand } from "../utils/shellOutput.ts";

type Step = "template" | "name" | "pm";

type Props = {
  basePath: string;
  initialName?: string;
  onBack: () => void;
};

const PM_OPTIONS = [
  { flag: "--use-bun", label: "bun (default)" },
  { flag: "--use-pnpm", label: "pnpm" },
  { flag: "--use-npm", label: "npm" },
];

export function NewProject({ basePath, initialName, onBack }: Props) {
  const { exit } = useApp();
  // If name is pre-filled (from `dev new <name>`), skip straight to template picker
  const [step, setStep] = useState<Step>(initialName ? "template" : "template");
  const [template, setTemplate] = useState("");
  const [name, setName] = useState(initialName ?? "");
  const [pmIndex, setPmIndex] = useState(0);

  useInput((input, key) => {
    if (step === "name") {
      if (key.escape) {
        onBack();
      } else if (key.backspace || key.delete) {
        setName((n) => n.slice(0, -1));
      } else if (key.return && name.trim()) {
        if (template === "next") {
          setStep("pm");
        } else {
          create(name.trim(), template);
        }
      } else if (input && !key.ctrl && !key.meta) {
        setName((n) => n + input);
      }
    } else if (step === "pm") {
      if (key.upArrow || input === "k") {
        setPmIndex((i) => Math.max(0, i - 1));
      } else if (key.downArrow || input === "j") {
        setPmIndex((i) => Math.min(PM_OPTIONS.length - 1, i + 1));
      } else if (key.return) {
        create(name.trim(), template, PM_OPTIONS[pmIndex]!.flag);
      } else if (key.escape) {
        setStep("name");
      }
    }
  });

  function create(projectName: string, tmpl: string, pmFlag?: string) {
    const full = fullProjectName(projectName);
    const projectPath = join(basePath, full);
    const cmds = templateCommands(projectPath, tmpl, pmFlag);
    writeShellCommand(cmds);
    exit();
  }

  if (step === "template") {
    return (
      <TemplatePicker
        onSelect={(t) => {
          setTemplate(t);
          if (initialName) {
            // Name already provided — skip to pm or create
            if (t === "next") {
              setStep("pm");
            } else {
              create(initialName, t);
            }
          } else {
            setStep("name");
          }
        }}
        onCancel={onBack}
      />
    );
  }

  if (step === "pm") {
    return (
      <Box flexDirection="column" paddingLeft={1} paddingTop={1}>
        <Text bold>Package manager:</Text>
        <Text> </Text>
        {PM_OPTIONS.map((opt, i) => (
          <Text key={opt.flag} inverse={i === pmIndex} bold={i === pmIndex}>
            {" "}
            {opt.label}
          </Text>
        ))}
        <Text> </Text>
        <Text dimColor>enter select  esc back</Text>
      </Box>
    );
  }

  const preview = fullProjectName(name.trim() || "...");
  const displayPath = basePath.replace(process.env["HOME"]!, "~");

  return (
    <Box flexDirection="column" paddingLeft={1} paddingTop={1}>
      <Text bold>
        New {template} project
      </Text>
      <Text> </Text>
      <Box>
        <Text bold color="blue">
          Name:{" "}
        </Text>
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
