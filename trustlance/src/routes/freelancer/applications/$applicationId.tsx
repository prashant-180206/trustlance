import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "../../../hooks/provider/AuthProvider";
import { useFreelancerApplications } from "../../../hooks/application.hooks";

export const Route = createFileRoute(
  "/freelancer/applications/$applicationId",
)({
  component: FreelancerApplication,
});

function FreelancerApplication() {
  const { applicationId } = Route.useParams();
  const { user } = useAuth();

  const {
    data: applications,
    isLoading,
    error,
  } = useFreelancerApplications(user?.id ?? "");

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error.message}</div>;

  const application = applications?.find(
    (item) => item.id === applicationId,
  );

  if (!application) {
    return <div>Application not found.</div>;
  }

  return (
    <div>
      <h1>Application</h1>

      <p>Project: {application.project_id}</p>

      <p>Status: {application.status}</p>

      <p>
        Proposed Amount: {application.proposed_amount}
      </p>

      <p>{application.proposal}</p>
    </div>
  );
}