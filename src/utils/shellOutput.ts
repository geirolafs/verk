import { writeFileSync } from "fs";

declare global {
  var __devOutputFile: string | undefined;
  var __devNewName: string | undefined;
}

/** Escape a string for safe use inside single quotes in shell commands */
export function shellQuote(s: string): string {
  return "'" + s.replace(/'/g, "'\\''") + "'";
}

/** Validate a user-provided name (project, client, etc.) */
export const SAFE_NAME = /^[a-zA-Z0-9._-]+$/;

/** Write a shell command to the output file for the wrapper to eval */
export function writeShellCommand(cmd: string) {
  const file = globalThis.__devOutputFile;
  if (file) {
    writeFileSync(file, cmd + "\n");
  }
}
