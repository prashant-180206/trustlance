import { createFileRoute } from "@tanstack/react-router";

import { useProjectEscrow } from "../../../../../hooks/project.hooks";
import {
  useApproveMilestone,
  useAutoApproveMilestone,
  useMilestone,
  useRejectMilestone,
  useWithdrawRejection,
} from "../../../../../hooks/milestone.hooks";

import { mapMilestone } from "../../../../../lib/utils/milestone";
import { MilestoneStatus } from "../../../../../lib/utils/milestone";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute(
  "/company/projects/$projectId/milestones/$milestoneId",
)({
  component: CompanyMilestoneDetail,
});

function formatEth(amount: bigint): string {
  return `${Number(amount) / 1e18} ETH`;
}

function formatTimestamp(timestamp: bigint): string {
  if (timestamp === 0n) {
    return "Not set";
  }

  return new Date(Number(timestamp) * 1000).toLocaleString();
}

function getStatusVariant(
  status: MilestoneStatus,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case MilestoneStatus.Approved:
    case MilestoneStatus.Paid:
      return "default";

    case MilestoneStatus.Rejected:
    case MilestoneStatus.Refunded:
      return "destructive";

    case MilestoneStatus.Disputed:
      return "destructive";

    case MilestoneStatus.Submitted:
      return "secondary";

    default:
      return "outline";
  }
}

function CompanyMilestoneDetail() {
  const { projectId, milestoneId } = Route.useParams();

  const {
    data: projectAddress,
    isLoading: addressLoading,
    error: addressError,
  } = useProjectEscrow(projectId);

  const index = BigInt(milestoneId);

  const {
    data: milestoneTuple,
    isLoading: milestoneLoading,
    error: milestoneError,
  } = useMilestone(projectAddress, index);

  const approve = useApproveMilestone();
  const reject = useRejectMilestone();
  const autoApprove = useAutoApproveMilestone();
  const withdrawRejection = useWithdrawRejection();

  if (addressLoading || milestoneLoading) {
    return (

      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>

    );
  }

  if (addressError || milestoneError) {
    return (

      <Alert variant="destructive">
        <AlertDescription>
          {addressError?.message ??
            milestoneError?.message ??
            "Failed to load milestone."}
        </AlertDescription>
      </Alert>

    );
  }

  if (!milestoneTuple) {
    return (

      <Alert variant="destructive">
        <AlertDescription>
          Milestone not found.
        </AlertDescription>
      </Alert>
    );
  }

  const milestone = mapMilestone(milestoneTuple);

  const isPending = [
    approve.isPending,
    reject.isPending,
    autoApprove.isPending,
    withdrawRejection.isPending,
  ].some(Boolean);

  const runAction = (
    action: {
      mutate: (variables: {
        projectAddress: `0x${string}`;
        index: bigint;
      }) => void;
    },
  ) => {
    if (!projectAddress) return;

    action.mutate({
      projectAddress,
      index,
    });
  };

  return (

    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Milestone #{milestoneId}
          </p>

          <h1 className="text-2xl font-semibold tracking-tight">
            {milestone.description}
          </h1>
        </div>

        <Badge
          variant={getStatusVariant(milestone.status)}
          className="w-fit"
        >
          {Object.entries(MilestoneStatus).find(
            ([, value]) => value === milestone.status,
          )?.[0] ?? "Unknown"}
        </Badge>
      </div>

      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Milestone overview</CardTitle>
          <CardDescription>
            Payment and delivery information for this
            milestone.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">
                Payment amount
              </p>

              <p className="mt-1 text-lg font-semibold">
                {formatEth(milestone.amount)}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Status
              </p>

              <div className="mt-1">
                <Badge
                  variant={getStatusVariant(
                    milestone.status,
                  )}
                >
                  {Object.entries(MilestoneStatus).find(
                    ([, value]) => value === milestone.status,
                  )?.[0] ?? "Unknown"}
                </Badge>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Submitted at
              </p>

              <p className="mt-1 text-sm font-medium">
                {formatTimestamp(
                  milestone.submittedAt,
                )}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Review deadline
              </p>

              <p className="mt-1 text-sm font-medium">
                {formatTimestamp(
                  milestone.reviewDeadline,
                )}
              </p>
            </div>

            <div className="sm:col-span-2">
              <p className="text-sm text-muted-foreground">
                Dispute deadline
              </p>

              <p className="mt-1 text-sm font-medium">
                {formatTimestamp(
                  milestone.disputeDeadline,
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deliverable */}
      <Card>
        <CardHeader>
          <CardTitle>Deliverable</CardTitle>
          <CardDescription>
            Content identifier submitted by the
            freelancer.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {milestone.deliverableCID ? (
            <div className="rounded-md border bg-muted/50 p-4">
              <p className="break-all font-mono text-xs">
                {milestone.deliverableCID}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No deliverable has been submitted yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Milestone actions</CardTitle>
          <CardDescription>
            Manage the current state of this milestone.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {milestone.status === MilestoneStatus.Submitted && (
              <>
                <Button
                  disabled={!projectAddress || isPending}
                  onClick={() => runAction(approve)}
                >
                  {approve.isPending ? "Approving..." : "Approve"}
                </Button>

                <Button
                  variant="destructive"
                  disabled={!projectAddress || isPending}
                  onClick={() => runAction(reject)}
                >
                  {reject.isPending ? "Rejecting..." : "Reject"}
                </Button>
              </>
            )}

            {milestone.status === MilestoneStatus.Submitted && (
              <Button
                variant="secondary"
                disabled={!projectAddress || isPending}
                onClick={() => runAction(autoApprove)}
              >
                {autoApprove.isPending ? "Approving..." : "Auto approve"}
              </Button>
            )}

            {milestone.status === MilestoneStatus.Disputed && (
              <Button
                variant="outline"
                disabled={!projectAddress || isPending}
                onClick={() => runAction(withdrawRejection)}
              >
                {withdrawRejection.isPending ? "Accepting dispute..." : "Accept dispute"}
              </Button>
            )}
          </div>

          {(approve.error ||
            reject.error ||
            autoApprove.error ||
            withdrawRejection.error) && (
              <>
                <Separator />

                <Alert variant="destructive">
                  <AlertDescription>
                    {approve.error?.message ??
                      reject.error?.message ??
                      autoApprove.error?.message ??
                      withdrawRejection.error?.message}
                  </AlertDescription>
                </Alert>
              </>
            )}
        </CardContent>
      </Card>

      {/* Payment released */}
      {milestone.status === MilestoneStatus.Approved && (
        <Alert>
          <AlertDescription>
            Payment has been released for this milestone.
          </AlertDescription>
        </Alert>
      )}

      {milestone.status === MilestoneStatus.Paid && (
        <Alert>
          <AlertDescription>
            This milestone has been paid successfully.
          </AlertDescription>
        </Alert>
      )}
    </div>

  );
}