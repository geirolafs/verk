import { useCallback, useState } from "react";
import { useProjects } from "./hooks/useProjects.ts";
import { ArchiveList } from "./screens/ArchiveList.tsx";
import { NewProject } from "./screens/NewProject.tsx";
import { ProjectList } from "./screens/ProjectList.tsx";
import type { Screen } from "./types.ts";

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
			return <ArchiveList onSetScreen={setScreen} onRefresh={handleRefresh} />;
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
