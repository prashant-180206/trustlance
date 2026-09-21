import { createFileRoute } from "@tanstack/react-router";
import { useProjects } from "../../../hooks/project.hooks";

export const Route = createFileRoute("/freelancer/projects/")({
  component: FreelancerProjects,
});

function FreelancerProjects() {
  const {
    data: projects,
    isLoading,
    error,
  } = useProjects();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error.message}</div>;

  return (
    <div>
      <h1>Projects</h1>

      {projects?.map((project) => (
        <div key={project.id}>
          <h2>{project.title}</h2>
          <p>{project.budget}</p>
        </div>
      ))}
    </div>
  );
}