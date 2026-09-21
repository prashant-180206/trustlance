import { createFileRoute } from "@tanstack/react-router";
import { useProjects } from "../../hooks/project.hooks";
import { Link } from "@tanstack/react-router";
import { ErrorMessage, Shell } from "../-components";

export const Route = createFileRoute("/freelancer/dashboard")({
  component: FreelancerDashboard,
});

function FreelancerDashboard() {
  const { data: projects, isLoading, error } = useProjects();

  if (isLoading) return <Shell title="Freelancer dashboard" role="freelancer"><p>Loading...</p></Shell>;

  return (
    <Shell title="Freelancer dashboard" role="freelancer">
      <ErrorMessage error={error} />
      <p className="mb-4">Available projects: {projects?.length ?? 0}</p>
      <div className="grid gap-3">{projects?.map((project) => <Link key={project.id} to="/freelancer/projects/$projectId" params={{ projectId: project.id }} className="rounded border bg-white p-4"><b>{project.title}</b><p className="text-sm text-zinc-600">{project.description}</p></Link>)}</div>
    </Shell>
  );
}