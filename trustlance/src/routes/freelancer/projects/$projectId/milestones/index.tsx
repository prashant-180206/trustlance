import { createFileRoute, Link } from "@tanstack/react-router";

import { useProjectEscrow } from "../../../../../hooks/project.hooks";
import {
  useMilestoneCount,
  useMilestones,
} from "../../../../../hooks/milestone.hooks";

import {
  getMilestoneStatusLabel,
  mapMilestones,
  MilestoneStatus,
} from "../../../../../lib/utils/milestone";

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
import { Skeleton } from "@/components/ui/skeleton";
import { Shell } from "../../../../-components";

export const Route = createFileRoute(
  "/freelancer/projects/$projectId/milestones/",
)({
  component: MilestonesList,
});

function formatEth(amount: bigint): string {
  return `${Number(amount) / 1e18} ETH`;
}

function formatTimestamp(timestamp: bigint): string {
  if (timestamp === 0n) {
    return "Not set";
  }

  return new Date(Number(timestamp) * 1000).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );
}

function getStatusVariant(
  status: MilestoneStatus,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case MilestoneStatus.Approved:
    case MilestoneStatus.Paid:
      return "default";

    case MilestoneStatus.Disputed:
    case MilestoneStatus.Rejected:
    case MilestoneStatus.Refunded:
      return "destructive";

    case MilestoneStatus.Submitted:
      return "secondary";

    default:
      return "outline";
  }
}

function MilestonesList() {
  const { projectId } = Route.useParams();

  const {
    data: projectAddress,
    isLoading: addressLoading,
    error: addressError,
  } = useProjectEscrow(projectId);

  const {
    data: count,
    isLoading: countLoading,
    error: countError,
  } = useMilestoneCount(projectAddress);

  const {
    data: milestoneTuples,
    isLoading: listLoading,
    error: listError,
  } = useMilestones(projectAddress);

  const isLoading =
    addressLoading || countLoading || listLoading;

  if (isLoading) {
    return (
      <Shell title="Project milestones" role="freelancer">
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />

          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-32 w-full"
            />
          ))}
        </div>
      </Shell>
    );
  }

  if (addressError || countError || listError) {
    return (
      <Shell title="Project milestones" role="freelancer">
        <Alert variant="destructive">
          <AlertDescription>
            {addressError?.message ??
              countError?.message ??
              listError?.message ??
              "Failed to load milestones."}
          </AlertDescription>
        </Alert>
      </Shell>
    );
  }

  const milestones = milestoneTuples
    ? mapMilestones(milestoneTuples)
    : [];

  return (
    <Shell title="Project milestones" role="freelancer">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <p className="text-sm text-muted-foreground">
            Project milestones
          </p>

          <h1 className="text-2xl font-semibold tracking-tight">
            Milestones
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Track milestone progress, submissions, and
            payments for this project.
          </p>
        </div>

        {/* Summary */}
        <Card>
          <CardContent className="grid gap-6 pt-6 sm:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">
                Total milestones
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {count?.toString() ?? milestones.length}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Submitted
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {
                  milestones.filter(
                    (milestone) =>
                      milestone.status ===
                      MilestoneStatus.Submitted,
                  ).length
                }
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Paid
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {
                  milestones.filter(
                    (milestone) =>
                      milestone.status ===
                      MilestoneStatus.Paid,
                  ).length
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Milestones */}
        {milestones.length === 0 ? (
          <Card>
            <CardContent className="flex min-h-48 items-center justify-center">
              <div className="text-center">
                <p className="font-medium">
                  No milestones found
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  This project does not have any
                  milestones yet.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {milestones.map((milestone, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <CardTitle>
                        Milestone #{index}
                      </CardTitle>

                      <CardDescription className="mt-1">
                        {milestone.description}
                      </CardDescription>
                    </div>

                    <Badge
                      variant={getStatusVariant(
                        milestone.status,
                      )}
                    >
                      {getMilestoneStatusLabel(
                        milestone.status,
                      )}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Amount
                      </p>

                      <p className="mt-1 font-semibold">
                        {formatEth(
                          milestone.amount,
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Submitted
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {formatTimestamp(
                          milestone.submittedAt,
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Review deadline
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {formatTimestamp(
                          milestone.reviewDeadline,
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex justify-end">
                    <Button
                      variant="outline"
                    >
                      <Link
                        to="/freelancer/projects/$projectId/milestones/$milestoneId"
                        params={{
                          projectId,
                          milestoneId:
                            index.toString(),
                        }}
                      >
                        View details
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}