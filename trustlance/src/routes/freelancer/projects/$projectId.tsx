import { createFileRoute } from "@tanstack/react-router";
import { useProject } from "../../../hooks/project.hooks";

export const Route = createFileRoute(
  "/freelancer/projects/$projectId",
)({
  component: FreelancerProject,
});

function FreelancerProject() {
  const { projectId } = Route.useParams();

  const {
    data: project,
    isLoading,
    error,
  } = useProject(projectId);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error.message}</div>;
  if (!project) return <div>Project not found.</div>;

  return (
    <div>
      <h1>{project.title}</h1>

      <p>{project.description}</p>

      <p>Budget: {project.budget}</p>

      {/* Apply button goes here */}
    </div>
  );
}