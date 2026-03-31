import { readdir, rename, mkdir } from "fs/promises";
import { join } from "path";

const DEV_DIR = join(process.env["HOME"]!, "Developer");
const ARCHIVE_DIR = join(DEV_DIR, "archive");

export type ArchivedProject = {
  name: string;
  year: string;
  path: string;
};

export async function archiveProject(name: string): Promise<void> {
  const year = new Date().getFullYear().toString();
  const yearDir = join(ARCHIVE_DIR, year);
  await mkdir(yearDir, { recursive: true });
  await rename(join(DEV_DIR, name), join(yearDir, name));
}

export async function unarchiveProject(
  name: string,
  year: string
): Promise<void> {
  await rename(join(ARCHIVE_DIR, year, name), join(DEV_DIR, name));
}

export async function listArchivedProjects(): Promise<ArchivedProject[]> {
  const projects: ArchivedProject[] = [];
  try {
    const years = await readdir(ARCHIVE_DIR);
    for (const year of years.sort().reverse()) {
      const yearPath = join(ARCHIVE_DIR, year);
      try {
        const entries = await readdir(yearPath, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            projects.push({
              name: entry.name,
              year,
              path: join(yearPath, entry.name),
            });
          }
        }
      } catch {
        // skip unreadable year dirs
      }
    }
  } catch {
    // no archive dir
  }
  return projects;
}
