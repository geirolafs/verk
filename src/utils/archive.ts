import { readdir, rename, mkdir, rmdir } from "fs/promises";
import { join } from "path";

const DEV_DIR = join(process.env["HOME"]!, "Developer");
const ARCHIVE_DIR = join(DEV_DIR, "Archive");
const TRIES_DIR = join(DEV_DIR, "tries");
const CLIENTS_DIR = join(DEV_DIR, "Clients");

export type ArchivedProject = {
  name: string;
  year: string;
  path: string;
};

export async function archiveProject(
  name: string,
  fromDir = DEV_DIR
): Promise<void> {
  const year = new Date().getFullYear().toString();
  const yearDir = join(ARCHIVE_DIR, year);
  await mkdir(yearDir, { recursive: true });
  await rename(join(fromDir, name), join(yearDir, name));
}

export async function restoreProject(
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
          if (entry.isDirectory() && !entry.isSymbolicLink()) {
            projects.push({
              name: entry.name,
              year,
              path: join(yearPath, entry.name),
            });
          }
        }
      } catch {
        // skip
      }
    }
  } catch {
    // no archive dir
  }
  return projects;
}

/** Move project from tries → ~/Developer */
export async function promoteTry(name: string): Promise<void> {
  await rename(join(TRIES_DIR, name), join(DEV_DIR, name));
}

/** Move project to a client folder */
export async function sendToClient(
  name: string,
  clientName: string,
  fromDir = DEV_DIR
): Promise<void> {
  const dest = join(CLIENTS_DIR, clientName, name);
  await rename(join(fromDir, name), dest);
}

/** List client folder names */
export async function listClients(): Promise<string[]> {
  try {
    const entries = await readdir(CLIENTS_DIR, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory() && !e.isSymbolicLink() && !e.name.startsWith("."))
      .map((e) => e.name)
      .sort();
  } catch {
    return [];
  }
}

/** Create a new client folder */
export async function createClient(name: string): Promise<void> {
  await mkdir(join(CLIENTS_DIR, name), { recursive: true });
}

/** Delete a client folder, archiving any projects inside first */
export async function deleteClient(name: string): Promise<string[]> {
  const clientDir = join(CLIENTS_DIR, name);
  const entries = await readdir(clientDir, { withFileTypes: true });
  const archived: string[] = [];
  for (const entry of entries) {
    if (entry.isDirectory() && !entry.isSymbolicLink() && !entry.name.startsWith(".")) {
      await archiveProject(entry.name, clientDir);
      archived.push(entry.name);
    }
  }
  await rmdir(clientDir);
  return archived;
}

/** Count projects inside a client folder */
export async function countClientProjects(name: string): Promise<number> {
  try {
    const entries = await readdir(join(CLIENTS_DIR, name), { withFileTypes: true });
    return entries.filter((e) => e.isDirectory() && !e.isSymbolicLink() && !e.name.startsWith(".")).length;
  } catch {
    return 0;
  }
}
