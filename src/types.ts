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

export type Screen = "list" | "new" | "archive";
