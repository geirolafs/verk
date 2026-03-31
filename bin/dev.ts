#!/usr/bin/env bun

import { join } from "path";
import {
  fullProjectName,
  templateCommands,
  TEMPLATES,
} from "../src/utils/templates.ts";
import { archiveProject } from "../src/utils/archive.ts";
import { unarchiveProject } from "../src/utils/archive.ts";
import { existsSync } from "fs";

const args = process.argv.slice(2);
const DEV_DIR = join(process.env["HOME"]!, "Developer");

if (args.length === 0) {
  // Interactive TUI mode
  await import("../src/index.tsx");
} else if (args[0] === "--help" || args[0] === "-h") {
  console.error(`dev - project hub

Usage:
  dev                          Interactive TUI
  dev new <name> [template]    Create project (templates: ${TEMPLATES.map((t) => t.name).join(", ")})
  dev archive <name>           Archive project
  dev unarchive <name> [year]  Restore from archive

Projects are created with YYYY-MM-DD- prefix.`);
} else if (args[0] === "new") {
  const name = args[1];
  const template = args[2] ?? "empty";
  if (!name) {
    console.error("Usage: dev new <name> [template]");
    process.exit(1);
  }
  if (!TEMPLATES.find((t) => t.name === template)) {
    console.error(
      `Unknown template: ${template}. Available: ${TEMPLATES.map((t) => t.name).join(", ")}`
    );
    process.exit(1);
  }
  const full = fullProjectName(name);
  const projectPath = join(DEV_DIR, full);
  if (existsSync(projectPath)) {
    console.error(`Project '${full}' already exists`);
    process.exit(1);
  }
  // Output shell commands for eval
  console.log(templateCommands(projectPath, template));
} else if (args[0] === "archive") {
  const name = args[1];
  if (!name) {
    console.error("Usage: dev archive <name>");
    process.exit(1);
  }
  if (!existsSync(join(DEV_DIR, name))) {
    console.error(`Project '${name}' not found`);
    process.exit(1);
  }
  await archiveProject(name);
  console.error(`Archived '${name}'`);
} else if (args[0] === "unarchive") {
  const name = args[1];
  const year = args[2] ?? new Date().getFullYear().toString();
  if (!name) {
    console.error("Usage: dev unarchive <name> [year]");
    process.exit(1);
  }
  if (existsSync(join(DEV_DIR, name))) {
    console.error(`Project '${name}' already exists in ~/Developer`);
    process.exit(1);
  }
  await unarchiveProject(name, year);
  console.error(`Restored '${name}' from ${year}`);
  console.log(`cd '${join(DEV_DIR, name)}'`);
} else {
  console.error(`Unknown command: ${args[0]}. Run 'dev --help' for usage.`);
  process.exit(1);
}
