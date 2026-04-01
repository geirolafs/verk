import { readdirSync, readFileSync } from "fs";
import { join, basename } from "path";

export type Template = {
  name: string;
  description: string;
};

const TEMPLATES_DIR = join(import.meta.dir, "../../templates");

/** Load all templates from templates/*.sh */
export function getTemplates(): Template[] {
  try {
    return readdirSync(TEMPLATES_DIR)
      .filter((f) => f.endsWith(".sh"))
      .sort()
      .map((file) => {
        const name = basename(file, ".sh");
        const content = readFileSync(join(TEMPLATES_DIR, file), "utf-8");
        const descMatch = content.match(/^#\s*(.+)/);
        return { name, description: descMatch?.[1] ?? name };
      });
  } catch {
    return [];
  }
}

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

/** Read a template .sh file and return shell commands to eval */
export function templateCommands(projectPath: string, template: string): string {
  const scriptPath = join(TEMPLATES_DIR, `${template}.sh`);
  const content = readFileSync(scriptPath, "utf-8");
  const cmds = content
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("#"))
    .join("\n");

  return `mkdir -p '${projectPath}' && cd '${projectPath}'\n${cmds}`;
}
