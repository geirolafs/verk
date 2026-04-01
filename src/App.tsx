import { useCallback, useEffect, useMemo, useState } from "react";
import { join } from "path";
import { existsSync } from "fs";
import type { View, ListConfig } from "./types.ts";
import { ProjectList } from "./screens/ProjectList.tsx";
import { NewProject } from "./screens/NewProject.tsx";

const DEV_DIR = join(process.env["HOME"]!, "Developer");

const PROJECTS_EXCLUDES = new Set([
  "Archive",
  "Clients",
  "tries",
  ".DS_Store",
  "TheDev",
]);
const EMPTY_EXCLUDES = new Set([".DS_Store"]);

function getConfig(view: View): ListConfig {
  switch (view.kind) {
    case "projects":
      return {
        basePath: DEV_DIR,
        title: "~/Developer",
        excludes: PROJECTS_EXCLUDES,
        actions: new Set(),
      };
    case "tries":
      return {
        basePath: join(DEV_DIR, "tries"),
        title: "~/Developer/tries",
        excludes: EMPTY_EXCLUDES,
        actions: new Set(),
      };
    case "clients":
      return {
        basePath: join(DEV_DIR, "Clients"),
        title: "~/Developer/Clients",
        excludes: EMPTY_EXCLUDES,
        actions: new Set(),
      };
    case "client":
      return {
        basePath: join(DEV_DIR, "Clients", view.name),
        title: `~/Developer/Clients/${view.name}`,
        excludes: EMPTY_EXCLUDES,
        actions: new Set(),
      };
    case "archive":
      return {
        basePath: join(DEV_DIR, "Archive"),
        title: "~/Developer/Archive",
        excludes: EMPTY_EXCLUDES,
        actions: new Set(),
      };
    default:
      return {
        basePath: DEV_DIR,
        title: "~/Developer",
        excludes: PROJECTS_EXCLUDES,
        actions: new Set(),
      };
  }
}

export function App({ initialNewName }: { initialNewName?: string }) {
  const [view, setView] = useState<View>(
    initialNewName
      ? { kind: "new", basePath: join(DEV_DIR, "") }
      : { kind: "projects" }
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const [hasTries, setHasTries] = useState(false);
  const [hasClients, setHasClients] = useState(false);

  // Check which optional folders exist (re-check on refresh)
  useEffect(() => {
    setHasTries(existsSync(join(DEV_DIR, "tries")));
    setHasClients(existsSync(join(DEV_DIR, "Clients")));
  }, [refreshKey]);

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const config = useMemo(() => getConfig(view), [view]);

  if (view.kind === "new") {
    return (
      <NewProject
        basePath={view.basePath}
        initialName={initialNewName}
        onBack={() => setView({ kind: "projects" })}
      />
    );
  }

  return (
    <ProjectList
      view={view}
      config={config}
      onSetView={setView}
      refreshKey={refreshKey}
      onRefresh={handleRefresh}
      hasTries={hasTries}
      hasClients={hasClients}
    />
  );
}
