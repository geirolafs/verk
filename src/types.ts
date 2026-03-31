export type Project = {
  name: string;
  path: string;
  isGitRepo: boolean;
  branch: string | null;
  dirtyCount: number;
  lastCommitMessage: string | null;
  lastCommitTime: number | null;
  hasUnpushed: boolean;
  isStale: boolean;
};

export type Screen = "list" | "new" | "archive";
