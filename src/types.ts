import type { GitStatus } from "./utils/git.ts";

export type Project = {
  name: string;
  path: string;
  isGitRepo: boolean;
  branch: string | null;
  status: GitStatus;
  ahead: number;
  lastCommitMessage: string | null;
  lastCommitTime: number | null;
};

export type View =
  | { kind: "projects" }
  | { kind: "tries" }
  | { kind: "clients" }
  | { kind: "client"; name: string }
  | { kind: "archive" }
  | { kind: "new"; basePath: string };

export type ListConfig = {
  basePath: string;
  title: string;
  excludes: Set<string>;
};
