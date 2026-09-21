import { createFileRoute } from "@tanstack/react-router";
import { useProjects } from "../../hooks/project.hooks";

export const Route = createFileRoute("/freelancer/dashboard")({
  component: FreelancerDashboard,
});

function FreelancerDashboard() {
  const { data: projects, isLoading, error } = useProjects();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error.message}</div>;

  return (
    <div>
      <h1>Freelancer Dashboard</h1>

      <p>Available Projects: {projects?.length ?? 0}</p>
    </div>
  );
}