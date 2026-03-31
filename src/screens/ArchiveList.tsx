import { Box, Text, useInput, useApp } from "ink";
import { useState, useEffect } from "react";
import {
  listArchivedProjects,
  unarchiveProject,
  type ArchivedProject,
} from "../utils/archive.ts";
import { Confirm } from "../components/Confirm.tsx";
import type { Screen } from "../types.ts";
import { existsSync } from "fs";
import { join } from "path";

type Props = {
  onSetScreen: (screen: Screen) => void;
  onRefresh: () => void;
};

export function ArchiveList({ onSetScreen, onRefresh }: Props) {
  const { exit } = useApp();
  const [projects, setProjects] = useState<ArchivedProject[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [confirmRestore, setConfirmRestore] = useState<ArchivedProject | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listArchivedProjects().then(setProjects);
  }, []);

  const selected = projects[selectedIndex];

  useInput((input, key) => {
    if (confirmRestore) return;

    if (key.upArrow || input === "k") {
      setSelectedIndex((i) => Math.max(0, i - 1));
    } else if (key.downArrow || input === "j") {
      setSelectedIndex((i) => Math.min(projects.length - 1, i + 1));
    } else if (key.return) {
      if (selected) {
        const devDir = join(process.env["HOME"]!, "Developer");
        if (existsSync(join(devDir, selected.name))) {
          setError(`'${selected.name}' already exists in ~/Developer`);
          return;
        }
        setConfirmRestore(selected);
      }
    } else if (key.escape || input === "q") {
      onSetScreen("list");
    }
  });

  if (confirmRestore) {
    return (
      <Confirm
        message={`Restore '${confirmRestore.name}' from ${confirmRestore.year}?`}
        onConfirm={async () => {
          await unarchiveProject(confirmRestore.name, confirmRestore.year);
          setConfirmRestore(null);
          onRefresh();
          // cd into restored project
          const devDir = join(process.env["HOME"]!, "Developer");
          process.stdout.write(`cd '${join(devDir, confirmRestore.name)}'\n`);
          exit();
        }}
        onCancel={() => setConfirmRestore(null)}
      />
    );
  }

  return (
    <Box flexDirection="column" paddingLeft={1} paddingTop={1}>
      <Text bold dimColor>
        Archived Projects
      </Text>
      <Text> </Text>

      {error && (
        <Text color="red">
          {"\u2718"} {error}
        </Text>
      )}

      {projects.length === 0 ? (
        <Text dimColor>No archived projects</Text>
      ) : (
        <>
          {projects.map((p, i) => (
            <Box key={`${p.year}-${p.name}`}>
              <Text inverse={i === selectedIndex} bold={i === selectedIndex}>
                {" "}
                <Text dimColor>{p.year}/</Text>
                {p.name}
              </Text>
            </Box>
          ))}
        </>
      )}

      <Text> </Text>
      <Text dimColor>enter restore  esc back</Text>
    </Box>
  );
}
