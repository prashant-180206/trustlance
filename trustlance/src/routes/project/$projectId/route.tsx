import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/project/$projectId")({
  component: ProjectLayout,
});

function ProjectLayout() {
  return <Outlet />;
}