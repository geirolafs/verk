#!/usr/bin/env bun

import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { archiveProject, restoreProject } from "../src/utils/archive.ts";
import {
	fullProjectName,
	TEMPLATES,
	templateCommands,
} from "../src/utils/templates.ts";
import { shellQuote, SAFE_NAME } from "../src/utils/shellOutput.ts";

// Strip --output <file> from args (injected by shell wrapper)
const rawArgs = process.argv.slice(2);
let outputFile: string | undefined;
const args: string[] = [];

for (let i = 0; i < rawArgs.length; i++) {
	if (rawArgs[i] === "--output" && i + 1 < rawArgs.length) {
		outputFile = rawArgs[i + 1];
		i++; // skip value
	} else {
		args.push(rawArgs[i]!);
	}
}

const DEV_DIR = join(process.env.HOME!, "Developer");

function validateName(name: string) {
	if (!SAFE_NAME.test(name)) {
		console.error("Invalid name: only alphanumeric, dots, dashes, underscores allowed");
		process.exit(1);
	}
}

/** Write shell command — to output file if set, otherwise stdout */
function emit(cmd: string) {
	if (outputFile) {
		writeFileSync(outputFile, `${cmd}\n`);
	} else {
		console.log(cmd);
	}
}

if (args.length === 0) {
	// Set output file for TUI shell commands
	globalThis.__devOutputFile = outputFile;
	await import("../src/index.tsx");
} else if (args[0] === "--help" || args[0] === "-h") {
	console.error(`verk - project hub

Usage:
  verk                          Interactive TUI
  verk new <name> [template]    Create project (templates: ${TEMPLATES.map((t) => t.name).join(", ")})
  verk archive <name>           Archive project
  verk unarchive <name> [year]  Restore from archive

Projects are created with YYYY-MM-DD- prefix.`);
} else if (args[0] === "new") {
	const name = args[1];
	const template = args[2];
	if (!name) {
		console.error("Usage: verk new <name> [template]");
		process.exit(1);
	}
	validateName(name);
	if (!template) {
		// No template specified — launch TUI template picker
		globalThis.__devOutputFile = outputFile;
		globalThis.__devNewName = name;
		await import("../src/index.tsx");
	} else {
		if (!TEMPLATES.find((t) => t.name === template)) {
			console.error(
				`Unknown template: ${template}. Available: ${TEMPLATES.map((t) => t.name).join(", ")}`,
			);
			process.exit(1);
		}
		const full = fullProjectName(name);
		const projectPath = join(DEV_DIR, full);
		if (existsSync(projectPath)) {
			console.error(`Project '${full}' already exists`);
			process.exit(1);
		}
		console.error(`Creating ${full} (${template})...`);
		emit(templateCommands(projectPath, template));
	}
} else if (args[0] === "archive") {
	const name = args[1];
	if (!name) {
		console.error("Usage: verk archive <name>");
		process.exit(1);
	}
	validateName(name);
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
		console.error("Usage: verk unarchive <name> [year]");
		process.exit(1);
	}
	validateName(name);
	if (existsSync(join(DEV_DIR, name))) {
		console.error(`Project '${name}' already exists in ~/Developer`);
		process.exit(1);
	}
	try {
		await restoreProject(name, year);
	} catch (e: any) {
		console.error(`Failed to restore '${name}': ${e.message}`);
		process.exit(1);
	}
	console.error(`Restored '${name}' from ${year}`);
	emit(`cd ${shellQuote(join(DEV_DIR, name))}`);
} else {
	console.error(`Unknown command: ${args[0]}. Run 'verk --help' for usage.`);
	process.exit(1);
}
