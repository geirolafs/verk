async function run(args: string[], cwd: string): Promise<string | null> {
  try {
    const proc = Bun.spawn(["git", "-C", cwd, ...args], {
      stdout: "pipe",
      stderr: "ignore",
    });
    const text = await new Response(proc.stdout).text();
    const code = await proc.exited;
    if (code !== 0) return null;
    return text.trim();
  } catch {
    return null;
  }
}

export async function isGitRepo(path: string): Promise<boolean> {
  return (await run(["rev-parse", "--git-dir"], path)) !== null;
}

export async function getBranch(path: string): Promise<string | null> {
  return run(["branch", "--show-current"], path);
}

export type GitStatus = {
  modified: number;
  untracked: number;
  deleted: number;
};

export async function getStatus(path: string): Promise<GitStatus> {
  const out = await run(["status", "--porcelain"], path);
  const status: GitStatus = { modified: 0, untracked: 0, deleted: 0 };
  if (!out) return status;
  for (const line of out.split("\n")) {
    if (!line) continue;
    const code = line.slice(0, 2);
    if (code === "??") {
      status.untracked++;
    } else if (code.includes("D")) {
      status.deleted++;
    } else {
      status.modified++;
    }
  }
  return status;
}

export async function getLastCommit(
  path: string
): Promise<{ message: string; timestamp: number } | null> {
  const out = await run(["log", "-1", "--format=%s|%ct"], path);
  if (!out) return null;
  const sep = out.lastIndexOf("|");
  if (sep === -1) return null;
  return {
    message: out.slice(0, sep),
    timestamp: parseInt(out.slice(sep + 1), 10),
  };
}

export async function getBranches(path: string): Promise<string[]> {
  const out = await run(
    ["branch", "--format=%(refname:short)"],
    path
  );
  if (!out) return [];
  return out.split("\n").filter(Boolean);
}

export async function getAheadCount(path: string): Promise<number> {
  const out = await run(["log", "@{u}..HEAD", "--oneline"], path);
  if (!out) return 0;
  return out.split("\n").filter(Boolean).length;
}

export async function getRecentCommits(
  path: string,
  count = 5
): Promise<string[]> {
  const out = await run(["log", "--oneline", `-${count}`], path);
  if (!out) return [];
  return out.split("\n").filter(Boolean);
}
