import { writeFileSync } from "fs";

declare global {
  var __devOutputFile: string | undefined;
  var __devNewName: string | undefined;
}

/** Write a shell command to the output file for the wrapper to eval */
export function writeShellCommand(cmd: string) {
  const file = globalThis.__devOutputFile;
  if (file) {
    writeFileSync(file, cmd + "\n");
  }
}
