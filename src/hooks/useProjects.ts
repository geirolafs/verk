import { useState, useEffect } from "react";
import { readdir } from "fs/promises";
import { join } from "path";
import type { Project } from "../types.ts";
import * as git from "../utils/git.ts";

const DEV_DIR = join(process.env["HOME"]!, "Developer");
const EXCLUDED = new Set(["Archive", "Clients", "tries", ".DS_Store", "TheDev"]);

const EMPTY_STATUS: git.GitStatus = { modified: 0, untracked: 0, deleted: 0 };

export function useProjects(refreshKey = 0) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const entries = await readdir(DEV_DIR, { withFileTypes: true });
      const dirs = entries
        .filter((e) => e.isDirectory() && !EXCLUDED.has(e.name) && !e.name.startsWith("."))
        .map((e) => e.name);

      const initial: Project[] = dirs.map((name) => ({
        name,
        path: join(DEV_DIR, name),
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
          const path = join(DEV_DIR, name);
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
            const [branch, status, lastCommit, ahead] =
              await Promise.all([
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
  }, [refreshKey]);

  return { projects, loading };
}
