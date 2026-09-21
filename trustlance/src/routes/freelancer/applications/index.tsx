import { createFileRoute } from "@tanstack/react-router";
// import { useAuth } from "../../../contexts/auth.context";
import { useFreelancerApplications } from "../../../hooks/application.hooks";
import { useAuth } from "../../../hooks/provider/AuthProvider";

export const Route = createFileRoute(
  "/freelancer/applications/",
)({
  component: FreelancerApplications,
});

function FreelancerApplications() {
  const { user } = useAuth();

  const {
    data: applications,
    isLoading,
    error,
  } = useFreelancerApplications(user?.id ?? "");

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error.message}</div>;

  return (
    <div>
      <h1>My Applications</h1>

      {applications?.length === 0 && (
        <p>No applications found.</p>
      )}

      {applications?.map((application) => (
        <div key={application.id}>
          <p>Project: {application.project_id}</p>
          <p>Status: {application.status}</p>
          <p>Proposed Amount: {application.proposed_amount}</p>
        </div>
      ))}
    </div>
  );
}