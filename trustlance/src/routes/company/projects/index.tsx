import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useAuth } from "../../../hooks/provider/AuthProvider";
import { useCompanyProjects } from "../../../hooks/project.hooks";
import { ErrorMessage, Shell } from "../../-components";

export const Route = createFileRoute("/company/projects/")({
  component: CompanyProjects,
});

function CompanyProjects() {
  const { user } = useAuth();

  const {
    data: projects,
    isLoading,
    error,
  } = useCompanyProjects(user?.id ?? "");

  if (isLoading) return <Shell title="My projects" role="company"><p>Loading...</p></Shell>;

  return (
    <Shell title="My projects" role="company">
      <ErrorMessage error={error} />
      <div className="grid gap-3">{projects?.map((project) => <Link key={project.id} to="/company/projects/$projectId" params={{ projectId: project.id }} className="rounded border bg-white p-4"><b>{project.title}</b><span className="ml-3 text-sm">{project.status}</span><p>Budget: {project.budget ?? "-"}</p></Link>)}</div>
    </Shell>
  );
}