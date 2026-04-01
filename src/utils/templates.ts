import { readdirSync, readFileSync } from "fs";
import { join, basename } from "path";

export type Template = {
  name: string;
  label: string;
  description: string;
  custom?: boolean;
};

const BUILTIN: Template[] = [
  { name: "empty", label: "Empty", description: "Git repo + .gitignore" },
  { name: "node", label: "Node.js", description: "npm init + .gitignore" },
  {
    name: "next",
    label: "Next.js",
    description: "TypeScript + Tailwind + App Router",
  },
  { name: "rust", label: "Rust", description: "cargo init" },
  {
    name: "python",
    label: "Python",
    description: "venv + .gitignore",
  },
];

const TEMPLATES_DIR = join(import.meta.dir, "../../templates");

/** Load built-in + custom templates from templates/ dir */
export function getTemplates(): Template[] {
  const templates = [...BUILTIN];
  try {
    const files = readdirSync(TEMPLATES_DIR);
    for (const file of files) {
      if (!file.endsWith(".sh")) continue;
      const name = basename(file, ".sh");
      if (templates.some((t) => t.name === name)) continue; // don't override builtins
      const content = readFileSync(join(TEMPLATES_DIR, file), "utf-8");
      const descMatch = content.match(/^#\s*(.+)/);
      templates.push({
        name,
        label: name,
        description: descMatch?.[1] ?? "Custom template",
        custom: true,
      });
    }
  } catch {
    // no templates dir yet
  }
  return templates;
}

// Keep TEMPLATES as a lazy-loaded singleton for backward compat
export const TEMPLATES: Template[] = getTemplates();

export function datePrefix(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fullProjectName(name: string): string {
  return `${datePrefix()}-${name}`;
}

/** Returns shell commands to eval in the parent shell */
export function templateCommands(
  projectPath: string,
  template: string,
  pmFlag?: string
): string {
  const lines: string[] = [`mkdir -p '${projectPath}'`, `cd '${projectPath}'`];

  // Check for custom template first
  try {
    const scriptPath = join(TEMPLATES_DIR, `${template}.sh`);
    const content = readFileSync(scriptPath, "utf-8");
    // Strip comment lines, join remaining as commands
    const cmds = content
      .split("\n")
      .filter((l) => l.trim() && !l.startsWith("#"))
      .join(" && ");
    lines.push("git init");
    if (cmds) lines.push(cmds);
    return lines.join(" && ");
  } catch {
    // Not a custom template — use built-in
  }

  switch (template) {
    case "node":
      lines.push("git init", "npm init -y");
      lines.push(
        `cat > .gitignore << 'GITIGNORE'\nnode_modules/\n.env\n.DS_Store\nGITIGNORE`
      );
      break;
    case "next":
      lines.push(
        `npx create-next-app@latest . --typescript --tailwind --app --no-src-dir ${pmFlag ?? "--use-bun"} --skip-git`,
        "git init"
      );
      break;
    case "rust":
      lines.push("git init", "cargo init");
      break;
    case "python":
      lines.push("git init", "python3 -m venv .venv");
      lines.push(
        `cat > .gitignore << 'GITIGNORE'\n.venv/\n__pycache__/\n*.pyc\n.env\n.DS_Store\nGITIGNORE`
      );
      break;
    default: // empty
      lines.push("git init", 'echo ".DS_Store" > .gitignore');
      break;
  }

  return lines.join(" && ");
}
