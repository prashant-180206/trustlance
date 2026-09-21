import { createFileRoute } from "@tanstack/react-router";
import { useCompanyProjects } from "../../hooks/project.hooks";
import { useAuth } from "../../hooks/provider/AuthProvider";
// import { useAuth } from "../../contexts/auth.context";

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

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error.message}</div>;

  return (
    <div>
      <h1>Company Dashboard</h1>

      <p>Projects: {projects?.length ?? 0}</p>
    </div>
  );
}