import { createFileRoute } from "@tanstack/react-router";
import { Button, ErrorMessage, Shell } from "../../../../-components";
import { useProjectEscrow } from "../../../../../hooks/project.hooks";
import { useAutoResolveDispute, useMilestone } from "../../../../../hooks/milestone.hooks";

export const Route = createFileRoute("/freelancer/projects/$projectId/disputes/$disputeId")({
  component: FreelancerDisputeDetail,
});

function FreelancerDisputeDetail() {
  const { projectId, disputeId } = Route.useParams();
  const index = BigInt(disputeId);
  const escrow = useProjectEscrow(projectId);
  const milestone = useMilestone(escrow.data, index);
  const resolve = useAutoResolveDispute();

  if (escrow.isLoading || milestone.isLoading) {
    return <Shell title="Dispute" role="freelancer"><p>Loading dispute...</p></Shell>;
  }

  return (
    <Shell title={`Dispute for milestone #${disputeId}`} role="freelancer">
      <ErrorMessage error={escrow.error ?? milestone.error ?? resolve.error} />
      <div className="grid max-w-xl gap-2 rounded border bg-white p-4">
        <p><b>Description:</b> {milestone.data?.[0] ?? "-"}</p>
        <p><b>Amount:</b> {milestone.data?.[1]?.toString() ?? "0"}</p>
        <p><b>Status:</b> {milestone.data?.[2] ?? "-"}</p>
        <p className="break-all"><b>Deliverable CID:</b> {milestone.data?.[3] || "-"}</p>
      </div>
      <Button
        className="mt-4"
        disabled={!escrow.data || resolve.isPending}
        onClick={() => escrow.data && resolve.mutate({ projectAddress: escrow.data, index })}
      >
        {resolve.isPending ? "Resolving..." : "Auto resolve dispute"}
      </Button>
    </Shell>
  );
}