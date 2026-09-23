import {
  createFileRoute,
  Link,
} from "@tanstack/react-router";

import {
  useMilestones,
} from "../../../../../hooks/milestone.hooks";
import {
  useProjectEscrow,
} from "../../../../../hooks/project.hooks";

import {
  getMilestoneStatusLabel,
  mapMilestones,
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
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";


export const Route = createFileRoute(
  "/company/projects/$projectId/disputes/",
)({
  component: CompanyDisputesList,
});

function formatEth(amount: bigint) {
  return `${(
    Number(amount) / 1e18
  ).toLocaleString(undefined, {
    maximumFractionDigits: 4,
  })} ETH`;
}

function CompanyDisputesList() {
  const { projectId } = Route.useParams();

  const {
    data: projectAddress,
    isLoading: addressLoading,
    error: addressError,
  } = useProjectEscrow(projectId);

  const {
    data,
    isLoading: listLoading,
    error: listError,
  } = useMilestones(projectAddress);

  const isLoading =
    addressLoading || listLoading;

  const milestones = data
    ? mapMilestones(data)
    : [];

  const disputedMilestones =
    milestones
      .map((milestone, index) => ({
        milestone,
        index,
      }))
      .filter(
        ({ milestone }) =>
          milestone.status ===
          MilestoneStatus.Disputed,
      );

  if (isLoading) {
    return (

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>

          <Skeleton className="h-7 w-28" />
        </div>

        <div className="space-y-3">
          {[1, 2].map((item) => (
            <Card key={item}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Skeleton className="h-5 w-44" />
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

    );
  }

  if (addressError || listError) {
    return (

      <Alert variant="destructive">
        <AlertDescription>
          {addressError?.message ??
            listError?.message ??
            "Unable to load disputes."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Project disputes
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Review milestones that require dispute
            resolution.
          </p>
        </div>

        <Badge variant="destructive">
          {disputedMilestones.length}{" "}
          {disputedMilestones.length === 1
            ? "Active dispute"
            : "Active disputes"}
        </Badge>
      </div>

      {/* Disputes */}
      {disputedMilestones.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-3">
              <span className="text-lg">
                ✓
              </span>
            </div>

            <h3 className="mt-4 font-semibold">
              No active disputes
            </h3>

            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              There are currently no milestones in
              dispute for this project.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {disputedMilestones.map(
            ({ milestone, index }) => (
              <Card key={index}>
                <CardContent className="p-5">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">
                          Milestone {index + 1}
                        </h3>

                        <Badge variant="destructive">
                          {getMilestoneStatusLabel(
                            milestone.status,
                          )}
                        </Badge>
                      </div>

                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {milestone.description}
                      </p>

                      <p className="mt-2 text-sm font-medium">
                        {formatEth(
                          milestone.amount,
                        )}{" "}
                        locked in dispute
                      </p>
                    </div>

                    <Button >
                      <Link
                        to="/company/projects/$projectId/disputes/$disputeId"
                        params={{
                          projectId,
                          disputeId:
                            index.toString(),
                        }}
                      >
                        Review dispute
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ),
          )}
        </div>
      )}
    </div>

  );
}