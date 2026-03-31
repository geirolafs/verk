import { useState, useCallback } from "react";
import type { Screen } from "./types.ts";
import { useProjects } from "./hooks/useProjects.ts";
import { ProjectList } from "./screens/ProjectList.tsx";
import { NewProject } from "./screens/NewProject.tsx";
import { ArchiveList } from "./screens/ArchiveList.tsx";

export function App() {
  const [screen, setScreen] = useState<Screen>("list");
  const [refreshKey, setRefreshKey] = useState(0);
  const { projects, loading } = useProjects(refreshKey);

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  switch (screen) {
    case "new":
      return <NewProject onSetScreen={setScreen} />;
    case "archive":
      return (
        <ArchiveList onSetScreen={setScreen} onRefresh={handleRefresh} />
      );
    default:
      return (
        <ProjectList
          projects={projects}
          loading={loading}
          onSetScreen={setScreen}
          onRefresh={handleRefresh}
        />
      );
  }
}
