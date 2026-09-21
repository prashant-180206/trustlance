import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "../../../contexts/auth.context";
import { useCompanyProjects } from "../../../hooks/project.hooks";

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

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error.message}</div>;

  return (
    <div>
      <h1>My Projects</h1>

      {projects?.map((project) => (
        <div key={project.id}>
          <h2>{project.title}</h2>
          <p>{project.budget}</p>
          <p>{project.status}</p>
        </div>
      ))}
    </div>
  );
}