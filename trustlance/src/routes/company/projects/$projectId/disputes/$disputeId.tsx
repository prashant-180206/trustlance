import {
  createFileRoute,
  Link,
} from "@tanstack/react-router";

import {
  useWithdrawRejection,
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
  "/company/projects/$projectId/disputes/$disputeId",
)({
  component: CompanyDisputeDetail,
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

function CompanyDisputeDetail() {
  const {
    projectId,
    disputeId,
  } = Route.useParams();

  const index = BigInt(disputeId);

  const {
    data: projectAddress,
    isLoading: addressLoading,
    error: addressError,
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
  const withdraw = useWithdrawRejection();

  const milestone = data
    ? mapMilestone(data)
    : null;

  const isLoading =
    addressLoading || milestoneLoading;

  const isDisputed =
    milestone?.status ===
    MilestoneStatus.Disputed;

  const actionPending = resolve.isPending || withdraw.isPending;

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
          {addressError?.message ??
            milestoneError?.message ??
            "Milestone not found."}
        </AlertDescription>
      </Alert>

    );
  }

  return (

    <div className="max-w-3xl space-y-6">

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
          Review the disputed milestone and execute
          the available resolution.
        </p>
      </div>

      {/* Status alert */}
      {isDisputed ? (
        <Alert variant="destructive">
          <AlertDescription>
            This milestone is currently disputed.
            Its payment remains subject to the
            dispute resolution process.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <AlertDescription>
            This milestone is no longer in the
            disputed state.
          </AlertDescription>
        </Alert>
      )}

      {/* Milestone details */}
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
                Locked funds
              </p>

              <p className="mt-1 text-lg font-semibold">
                {formatEth(
                  milestone.amount,
                )}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Milestone status
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
              Deliverable CID
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
            Timeline
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-sm font-medium">
                Submitted
              </p>

              <p className="text-xs text-muted-foreground">
                Freelancer submission time.
              </p>
            </div>

            <p className="text-right text-sm text-muted-foreground">
              {formatTimestamp(
                milestone.submittedAt,
              )}
            </p>
          </div>

          <Separator />

          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-sm font-medium">
                Review deadline
              </p>

              <p className="text-xs text-muted-foreground">
                End of the review period.
              </p>
            </div>

            <p className="text-right text-sm text-muted-foreground">
              {formatTimestamp(
                milestone.reviewDeadline,
              )}
            </p>
          </div>

          <Separator />

          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-sm font-medium">
                Dispute deadline
              </p>

              <p className="text-xs text-muted-foreground">
                Resolution deadline.
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
            Resolution
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Execute the smart contract's automatic
            dispute resolution for this milestone.
          </p>

          {resolve.error && (
            <Alert variant="destructive">
              <AlertDescription>
                {resolve.error.message}
              </AlertDescription>
            </Alert>
          )}

          <Button
            disabled={
              !projectAddress ||
              !isDisputed ||
              actionPending
            }
            onClick={() => {
              if (!projectAddress) {
                return;
              }

              resolve.mutate({
                projectAddress,
                index,
              });
            }}
          >
            {resolve.isPending
              ? "Resolving dispute..."
              : "Execute resolution"}
          </Button>

          <Button
            variant="outline"
            disabled={!projectAddress || !isDisputed || actionPending}
            onClick={() => {
              if (projectAddress) {
                withdraw.mutate({ projectAddress, index });
              }
            }}
          >
            {withdraw.isPending ? "Accepting dispute..." : "Accept dispute and pay freelancer"}
          </Button>

          {(resolve.error || withdraw.error) && (
            <Alert variant="destructive">
              <AlertDescription>
                {resolve.error?.message ?? withdraw.error?.message}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Milestone link */}
      <div>
        <Button
          variant="outline"
        >
          <Link
            to="/company/projects/$projectId/milestones/$milestoneId"
            params={{
              projectId,
              milestoneId: disputeId,
            }}
          >
            Open milestone actions
          </Link>
        </Button>
      </div>
    </div>

  );
}