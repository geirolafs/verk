import { useState, useEffect } from "react";
import { readdir } from "fs/promises";
import { join } from "path";
import type { Project } from "../types.ts";
import * as git from "../utils/git.ts";
import { isStale } from "../utils/time.ts";

const DEV_DIR = join(process.env["HOME"]!, "Developer");
const EXCLUDED = new Set(["archive", "tries", ".DS_Store", "TheDev"]);

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

      // Show names immediately
      const initial: Project[] = dirs.map((name) => ({
        name,
        path: join(DEV_DIR, name),
        isGitRepo: false,
        branch: null,
        dirtyCount: 0,
        lastCommitMessage: null,
        lastCommitTime: null,
        hasUnpushed: false,
        isStale: false,
      }));
      if (!cancelled) {
        setProjects(initial);
        setLoading(false);
      }

      // Load git info with bounded concurrency
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
            dirtyCount: 0,
            lastCommitMessage: null,
            lastCommitTime: null,
            hasUnpushed: false,
            isStale: false,
          };

          if (isRepo) {
            const [branch, dirtyCount, lastCommit, unpushed] =
              await Promise.all([
                git.getBranch(path),
                git.getDirtyCount(path),
                git.getLastCommit(path),
                git.hasUnpushed(path),
              ]);

            project = {
              ...project,
              branch,
              dirtyCount,
              lastCommitMessage: lastCommit?.message ?? null,
              lastCommitTime: lastCommit?.timestamp ?? null,
              hasUnpushed: unpushed,
              isStale: lastCommit ? isStale(lastCommit.timestamp) : false,
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

      // Sort by last commit time once all loaded
      if (!cancelled) {
        setProjects((prev) =>
          [...prev].sort((a, b) => {
            if (a.lastCommitTime && b.lastCommitTime)
              return b.lastCommitTime - a.lastCommitTime;
            if (a.lastCommitTime) return -1;
            if (b.lastCommitTime) return 1;
            return a.name.localeCompare(b.name);
          })
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
