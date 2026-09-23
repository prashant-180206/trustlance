import {
  createFileRoute,
} from "@tanstack/react-router";

import {
  useAcceptRejection,
  useAutoResolveDispute,
  useMilestone,
} from "../../../../../hooks/milestone.hooks";

import {
  useProjectEscrow,
} from "../../../../../hooks/project.hooks";

import {
  getMilestoneStatusLabel,
  mapMilestone,
  MilestoneStatus,
} from "../../../../../lib/utils/milestone";

import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";


export const Route = createFileRoute(
  "/freelancer/projects/$projectId/disputes/$disputeId",
)({
  component: FreelancerDisputeDetail,
});

function formatEth(amount: bigint) {
  return `${(
    Number(amount) / 1e18
  ).toLocaleString(undefined, {
    maximumFractionDigits: 4,
  })} ETH`;
}

function formatTimestamp(
  timestamp: bigint,
) {
  if (timestamp === 0n) {
    return "Not available";
  }

  return new Date(
    Number(timestamp) * 1000,
  ).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function FreelancerDisputeDetail() {
  const {
    projectId,
    disputeId,
  } = Route.useParams();

  const index = BigInt(disputeId);

  const {
    data: projectAddress,
    isLoading: escrowLoading,
    error: escrowError,
  } = useProjectEscrow(projectId);

  const {
    data,
    isLoading: milestoneLoading,
    error: milestoneError,
  } = useMilestone(
    projectAddress,
    index,
  );

  const resolve =
    useAutoResolveDispute();
  const accept = useAcceptRejection();

  const milestone = data
    ? mapMilestone(data)
    : null;

  const isLoading =
    escrowLoading || milestoneLoading;

  const error =
    escrowError ??
    milestoneError ??
    resolve.error;

  if (isLoading) {
    return (

      <div className="max-w-3xl">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>

          <CardContent className="space-y-5">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>

    );
  }

  if (!milestone) {
    return (

      <Alert variant="destructive">
        <AlertDescription>
          {error?.message ??
            "Milestone not found."}
        </AlertDescription>
      </Alert>

    );
  }

  const isDisputed =
    milestone.status ===
    MilestoneStatus.Disputed;

  const actionPending = resolve.isPending || accept.isPending;

  return (

    <div className="max-w-3xl space-y-6">

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {error.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold tracking-tight">
            Milestone {Number(disputeId) + 1}
          </h2>

          <Badge
            variant={
              isDisputed
                ? "destructive"
                : "outline"
            }
          >
            {getMilestoneStatusLabel(
              milestone.status,
            )}
          </Badge>
        </div>

        <p className="mt-1 text-sm text-muted-foreground">
          Review the milestone and its dispute
          status.
        </p>
      </div>

      {/* Milestone information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Milestone details
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">

          <div>
            <p className="text-xs text-muted-foreground">
              Description
            </p>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
              {milestone.description}
            </p>
          </div>

          <Separator />

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">
                Payment
              </p>

              <p className="mt-1 text-lg font-semibold">
                {formatEth(
                  milestone.amount,
                )}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Status
              </p>

              <div className="mt-2">
                <Badge
                  variant={
                    isDisputed
                      ? "destructive"
                      : "outline"
                  }
                >
                  {getMilestoneStatusLabel(
                    milestone.status,
                  )}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-xs text-muted-foreground">
              Deliverable
            </p>

            {milestone.deliverableCID ? (
              <p className="mt-2 break-all rounded-md bg-muted p-3 font-mono text-xs">
                {milestone.deliverableCID}
              </p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                No deliverable has been submitted.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Dispute timeline
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium">
                Submitted
              </p>

              <p className="text-xs text-muted-foreground">
                When the freelancer submitted the
                deliverable.
              </p>
            </div>

            <p className="text-right text-sm text-muted-foreground">
              {formatTimestamp(
                milestone.submittedAt,
              )}
            </p>
          </div>

          <Separator />

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium">
                Review deadline
              </p>

              <p className="text-xs text-muted-foreground">
                End of the client review period.
              </p>
            </div>

            <p className="text-right text-sm text-muted-foreground">
              {formatTimestamp(
                milestone.reviewDeadline,
              )}
            </p>
          </div>

          <Separator />

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium">
                Dispute deadline
              </p>

              <p className="text-xs text-muted-foreground">
                Deadline for resolving the dispute.
              </p>
            </div>

            <p className="text-right text-sm text-muted-foreground">
              {formatTimestamp(
                milestone.disputeDeadline,
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Resolution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Dispute resolution
          </CardTitle>
        </CardHeader>

        <CardContent>
          {!isDisputed ? (
            <Alert>
              <AlertDescription>
                This milestone is no longer in the
                disputed state, so there is no active
                dispute to resolve.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                If the dispute has reached the
                appropriate deadline, you can trigger
                the contract's automatic dispute
                resolution.
              </p>

              <Button
                disabled={
                  !projectAddress ||
                  actionPending
                }
                onClick={() =>
                  projectAddress &&
                  resolve.mutate({
                    projectAddress,
                    index,
                  })
                }
              >
                {resolve.isPending
                  ? "Resolving dispute..."
                  : "Auto resolve dispute"}
              </Button>

              <Button
                variant="destructive"
                disabled={!projectAddress || actionPending}
                onClick={() =>
                  projectAddress &&
                  accept.mutate({ projectAddress, index })
                }
              >
                {accept.isPending ? "Accepting rejection..." : "Accept rejection"}
              </Button>

              {accept.error && (
                <Alert variant="destructive">
                  <AlertDescription>{accept.error.message}</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>

  );
}