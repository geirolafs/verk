import { useState, useEffect } from "react";
import { readdir } from "fs/promises";
import { join } from "path";
import type { Project } from "../types.ts";
import * as git from "../utils/git.ts";

const EMPTY_STATUS: git.GitStatus = { modified: 0, untracked: 0, deleted: 0 };

export function useProjects(
  basePath: string,
  excludes: Set<string>,
  refreshKey = 0
) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      let entries;
      try {
        entries = await readdir(basePath, { withFileTypes: true });
      } catch {
        if (!cancelled) {
          setError(`Cannot read ${basePath}`);
          setProjects([]);
          setLoading(false);
        }
        return;
      }

      const dirs = entries
        .filter(
          (e) =>
            e.isDirectory() &&
            !excludes.has(e.name) &&
            !e.name.startsWith(".")
        )
        .map((e) => e.name);

      const initial: Project[] = dirs.map((name) => ({
        name,
        path: join(basePath, name),
        isGitRepo: false,
        branch: null,
        status: EMPTY_STATUS,
        ahead: 0,
        lastCommitMessage: null,
        lastCommitTime: null,
      }));
      initial.sort((a, b) => b.name.localeCompare(a.name));
      if (!cancelled) {
        setProjects(initial);
        setLoading(false);
      }

      const CONCURRENCY = 8;
      let i = 0;

      async function next(): Promise<void> {
        while (i < dirs.length) {
          const idx = i++;
          const name = dirs[idx]!;
          const path = join(basePath, name);
          const isRepo = await git.isGitRepo(path);

          let project: Project = {
            name,
            path,
            isGitRepo: isRepo,
            branch: null,
            status: EMPTY_STATUS,
            ahead: 0,
            lastCommitMessage: null,
            lastCommitTime: null,
          };

          if (isRepo) {
            const [branch, status, lastCommit, ahead] = await Promise.all([
              git.getBranch(path),
              git.getStatus(path),
              git.getLastCommit(path),
              git.getAheadCount(path),
            ]);

            project = {
              ...project,
              branch,
              status,
              ahead,
              lastCommitMessage: lastCommit?.message ?? null,
              lastCommitTime: lastCommit?.timestamp ?? null,
            };
          }

          if (!cancelled) {
            setProjects((prev) => {
              const updated = [...prev];
              const existing = updated.findIndex((p) => p.name === name);
              if (existing !== -1) updated[existing] = project;
              return updated;
            });
          }
        }
      }

      await Promise.all(
        Array.from({ length: CONCURRENCY }, () => next())
      );

      if (!cancelled) {
        setProjects((prev) =>
          [...prev].sort((a, b) => b.name.localeCompare(a.name))
        );
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [basePath, refreshKey]);

  return { projects, loading, error };
}
