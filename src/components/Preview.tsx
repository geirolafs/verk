import { Box, Text } from "ink";
import { useEffect, useState } from "react";
import type { Project } from "../types.ts";
import * as git from "../utils/git.ts";

type PreviewData = {
	commits: string[];
	branches: string[];
	tree: string[];
};

export function Preview({ project, height }: { project: Project | undefined; height?: number }) {
	const [data, setData] = useState<PreviewData | null>(null);

	useEffect(() => {
		if (!project) {
			setData(null);
			return;
		}

		let cancelled = false;

		async function load() {
			const p = project!;
			const [commits, branches, tree] = await Promise.all([
				git.getRecentCommits(p.path, 5),
				git.getBranches(p.path),
				getTree(p.path),
			]);

			if (!cancelled) {
				setData({ commits, branches, tree });
			}
		}

		load();
		return () => {
			cancelled = true;
		};
	}, [project?.path, project]);

	if (!project) {
		return (
			<Box flexDirection="column" paddingLeft={1} height={height}>
				<Text dimColor>No project selected</Text>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" paddingLeft={1} paddingRight={1} height={height}>
			<Text bold>{project.name}</Text>
			{project.lastCommitMessage && (
				<Text dimColor>last: {project.lastCommitMessage}</Text>
			)}
			{data && (
				<>
					{data.branches.length > 0 && (
						<Text dimColor>branches: {data.branches.join(", ")}</Text>
					)}
					<Text> </Text>
					{data.tree.slice(0, 12).map((line, i) => (
						<Text key={i} dimColor>
							{line}
						</Text>
					))}
				</>
			)}
		</Box>
	);
}

async function getTree(path: string): Promise<string[]> {
	try {
		const proc = Bun.spawn(
			["eza", "--tree", "--level=2", "--icons=never", path],
			{
				stdout: "pipe",
				stderr: "ignore",
			},
		);
		const text = await new Response(proc.stdout).text();
		return text.split("\n").slice(1, 15);
	} catch {
		try {
			const proc = Bun.spawn(["ls", path], {
				stdout: "pipe",
				stderr: "ignore",
			});
			const text = await new Response(proc.stdout).text();
			return text.split("\n").filter(Boolean);
		} catch {
			return [];
		}
	}
}
