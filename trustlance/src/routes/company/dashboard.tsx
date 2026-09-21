import { createFileRoute } from "@tanstack/react-router";
import { useCompanyProjects } from "../../hooks/project.hooks";
import { useAuth } from "../../hooks/provider/AuthProvider";
import { Link } from "@tanstack/react-router";
import { ErrorMessage, Shell } from "../-components";

export const Route = createFileRoute("/company/dashboard")({
  component: CompanyDashboard,
});

function CompanyDashboard() {
  const { user } = useAuth();

  const companyId = user?.id ?? "";

  const {
    data: projects,
    isLoading,
    error,
  } = useCompanyProjects(companyId);

  if (isLoading) return <Shell title="Company dashboard" role="company"><p>Loading...</p></Shell>;

  return (
    <Shell title="Company dashboard" role="company">
      <ErrorMessage error={error} />
      <p className="mb-4">Projects: {projects?.length ?? 0}</p>
      <Link to="/company/projects/new" className="rounded bg-zinc-950 px-3 py-2 text-sm text-white">Create project</Link>
      <div className="mt-6 grid gap-3">{projects?.map((project) => <Link key={project.id} to="/company/projects/$projectId" params={{ projectId: project.id }} className="rounded border bg-white p-4"><b>{project.title}</b><span className="ml-3 text-sm text-zinc-500">{project.status}</span></Link>)}</div>
    </Shell>
  );
}