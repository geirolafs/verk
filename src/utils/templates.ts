export type Template = {
  name: string;
  label: string;
  description: string;
};

export const TEMPLATES: Template[] = [
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
