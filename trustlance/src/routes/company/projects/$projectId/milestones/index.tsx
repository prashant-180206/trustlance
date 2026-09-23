import { createFileRoute, Link } from "@tanstack/react-router";

import {
  useMilestoneCount,
  useMilestones,
} from "../../../../../hooks/milestone.hooks";
import { useProjectEscrow } from "../../../../../hooks/project.hooks";
import {
  getMilestoneStatusLabel,
  mapMilestones,
  MilestoneStatus,
} from "../../../../../lib/utils/milestone";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute(
  "/company/projects/$projectId/milestones/",
)({
  component: CompanyMilestonesList,
});

function formatEth(amount: bigint) {
  const eth = Number(amount) / 1e18;

  return `${eth.toLocaleString(undefined, {
    maximumFractionDigits: 4,
  })} ETH`;
}

function getStatusVariant(
  status: MilestoneStatus,
) {
  switch (status) {
    case MilestoneStatus.Approved:
    case MilestoneStatus.Paid:
      return "default" as const;

    case MilestoneStatus.Submitted:
      return "secondary" as const;

    case MilestoneStatus.Rejected:
      return "destructive" as const;

    default:
      return "outline" as const;
  }
}

function CompanyMilestonesList() {
  const { projectId } = Route.useParams();

  const {
    data: projectAddress,
    isLoading: addressLoading,
  } = useProjectEscrow(projectId);

  const {
    data: count,
    isLoading: countLoading,
  } = useMilestoneCount(projectAddress);

  const {
    data,
    isLoading: listLoading,
  } = useMilestones(projectAddress);

  const isLoading =
    addressLoading ||
    countLoading ||
    listLoading;

  const milestones = data
    ? mapMilestones(data)
    : [];

  const totalAmount = milestones.reduce(
    (total, milestone) =>
      total + milestone.amount,
    0n,
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>

          <Skeleton className="h-10 w-36" />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map(
            (_, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>

                <CardContent>
                  <Skeleton className="h-7 w-28" />
                </CardContent>
              </Card>
            ),
          )}
        </div>

        <div className="space-y-3">
          {Array.from({ length: 3 }).map(
            (_, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-3">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-64" />
                    </div>

                    <Skeleton className="h-6 w-20" />
                  </div>
                </CardContent>
              </Card>
            ),
          )}
        </div>
      </div>

    );
  }

  return (

    <div className="space-y-6">

      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Milestones
          </h2>

          <p className="text-sm text-muted-foreground">
            Manage project deliverables and
            payments.
          </p>
        </div>

        <Button >
          <Link
            to="/company/projects/$projectId/milestones/new"
            params={{ projectId }}
          >
            Add milestones
          </Link>
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total milestones
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-semibold">
              {count?.toString() ?? "0"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total value
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-semibold">
              {formatEth(totalAmount)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Escrow
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div
              className="truncate font-mono text-xs text-muted-foreground"
              title={projectAddress}
            >
              {projectAddress ?? "Unavailable"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Empty state */}
      {milestones.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-3">
              <span className="text-xl">+</span>
            </div>

            <h3 className="mt-4 font-semibold">
              No milestones yet
            </h3>

            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Break this project into milestones
              and define how each deliverable will
              be paid.
            </p>

            <Button

              className="mt-5"
            >
              <Link
                to="/company/projects/$projectId/milestones/new"
                params={{ projectId }}
              >
                Create first milestone
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {milestones.map(
            (milestone, index) => (
              <Link
                key={index}
                to="/company/projects/$projectId/milestones/$milestoneId"
                params={{
                  projectId,
                  milestoneId:
                    index.toString(),
                }}
                className="block"
              >
                <Card className="transition-colors hover:border-foreground/20 hover:bg-muted/30">
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">
                            Milestone {index + 1}
                          </span>

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

                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {milestone.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-6 sm:justify-end">
                        <div className="text-right">
                          <p className="font-semibold">
                            {formatEth(
                              milestone.amount,
                            )}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            Payment
                          </p>
                        </div>

                        <span className="text-muted-foreground">
                          →
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ),
          )}
        </div>
      )}
    </div>
  );
}