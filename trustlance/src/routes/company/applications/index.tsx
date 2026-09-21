import { createFileRoute } from "@tanstack/react-router";
// import { useAuth } from "../../../contexts/auth.context";
import { useCompanyApplications } from "../../../hooks/application.hooks";
import { useAuth } from "../../../hooks/provider/AuthProvider";

export const Route = createFileRoute(
  "/company/applications/",
)({
  component: CompanyApplications,
});

function CompanyApplications() {
  const { user } = useAuth();

  const {
    data: applications,
    isLoading,
    error,
  } = useCompanyApplications(user?.id ?? "");

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error.message}</div>;

  return (
    <div>
      <h1>Applications</h1>

      {applications?.length === 0 && (
        <p>No applications found.</p>
      )}

      {applications?.map((application) => (
        <div key={application.id}>
          <p>Project: {application.project_id}</p>

          <p>
            Freelancer: {application.freelancer_id}
          </p>

          <p>Status: {application.status}</p>

          <p>
            Proposed Amount:{" "}
            {application.proposed_amount}
          </p>
        </div>
      ))}
    </div>
  );
}