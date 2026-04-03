/** Check if a string looks like a git-cloneable URL */
export function isGitUrl(s: string): boolean {
  return /^(https?:\/\/|ssh:\/\/|git@)/.test(s) && parseGitUrl(s) !== null;
}

/** Parse a git URL into owner + repo, or null */
export function parseGitUrl(
  url: string,
): { owner: string; repo: string } | null {
  let path: string | undefined;

  // git@host:owner/repo.git
  const sshMatch = url.match(/^git@[^:]+:(.+)/);
  if (sshMatch) {
    path = sshMatch[1];
  }

  // https://host/owner/repo or ssh://git@host/owner/repo
  if (!path) {
    try {
      const u = new URL(url);
      path = u.pathname.replace(/^\//, "");
    } catch {
      return null;
    }
  }

  if (!path) return null;

  // Strip .git suffix and trailing slashes
  path = path.replace(/\.git\/?$/, "").replace(/\/+$/, "");

  const parts = path.split("/").filter(Boolean);
  if (parts.length < 2) return null;

  return { owner: parts[0]!, repo: parts[1]! };
}

/** Generate a project name from parsed URL: "owner-repo" */
export function repoName(parsed: { owner: string; repo: string }): string {
  return `${parsed.owner}-${parsed.repo}`;
}
