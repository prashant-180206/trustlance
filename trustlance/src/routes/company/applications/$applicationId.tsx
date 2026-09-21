import { createFileRoute } from "@tanstack/react-router";
// import { useAuth } from "../../../contexts/auth.context";
import { useCompanyApplications } from "../../../hooks/application.hooks";
import { useAuth } from "../../../hooks/provider/AuthProvider";
import { useUpdateApplicationStatus } from "../../../hooks/application.hooks";
import { Button } from "../../-components";

export const Route = createFileRoute(
  "/company/applications/$applicationId",
)({
  component: CompanyApplication,
});

function CompanyApplication() {
  const { applicationId } = Route.useParams();
  const { user } = useAuth();

  const {
    data: applications,
    isLoading,
    error,
  } = useCompanyApplications(user?.id ?? "");
  const updateStatus = useUpdateApplicationStatus();

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

      <p>
        Freelancer: {application.freelancer_id}
      </p>

      <p>Status: {application.status}</p>

      <p>
        Proposed Amount:{" "}
        {application.proposed_amount}
      </p>

      <p>{application.proposal}</p>

      <div className="mt-4 flex gap-2">
        <Button disabled={updateStatus.isPending} onClick={() => updateStatus.mutate({ applicationId, status: "accepted", companyId: user?.id })}>Accept</Button>
        <Button disabled={updateStatus.isPending} onClick={() => updateStatus.mutate({ applicationId, status: "rejected", companyId: user?.id })}>Reject</Button>
      </div>
      {updateStatus.error && <p>{updateStatus.error.message}</p>}
    </div>
  );
}