import { createFileRoute, Link } from "@tanstack/react-router";

import { useProjects } from "../../hooks/project.hooks";

import { Alert, AlertDescription } from "@/components/ui/alert";
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
  "/freelancer/dashboard",
)({
  component: FreelancerDashboard,
});

function formatBudget(budget: number | null) {
  if (budget === null) {
    return "Budget not specified";
  }

  return `₹${budget.toLocaleString()}`;
}

function formatDeadline(deadline: string | null) {
  if (!deadline) {
    return "No deadline";
  }

  return new Date(deadline).toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );
}

function getStatusVariant(
  status:
    | "draft"
    | "open"
    | "in_progress"
    | "completed"
    | "cancelled",
) {
  switch (status) {
    case "open":
      return "default" as const;

    case "in_progress":
      return "secondary" as const;

    case "completed":
      return "outline" as const;

    case "cancelled":
      return "destructive" as const;

    default:
      return "outline" as const;
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "in_progress":
      return "In progress";

    case "completed":
      return "Completed";

    case "cancelled":
      return "Cancelled";

    case "open":
      return "Open";

    case "draft":
      return "Draft";

    default:
      return status;
  }
}

function FreelancerDashboard() {
  const {
    data: projects,
    isLoading,
    error,
  } = useProjects();

  if (isLoading) {
    return (

      <div className="space-y-6">

        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-80" />
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map(
            (_, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-28" />
                </CardHeader>

                <CardContent>
                  <Skeleton className="h-7 w-16" />
                </CardContent>
              </Card>
            ),
          )}
        </div>

        {/* Projects */}
        <div className="space-y-3">
          {Array.from({ length: 3 }).map(
            (_, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-full max-w-xl" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                </CardContent>
              </Card>
            ),
          )}
        </div>
      </div>
    );
  }

  const allProjects = projects ?? [];

  const openProjects = allProjects.filter(
    (project) => project.status === "open",
  );

  const inProgressProjects = allProjects.filter(
    (project) =>
      project.status === "in_progress",
  );

  return (

    <div className="space-y-6">

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {error.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Find your next project
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Browse projects and explore opportunities
            that match your skills.
          </p>
        </div>

        <Button variant="outline">
          <Link to="/freelancer/projects">
            Browse all projects
          </Link>
        </Button>
      </div>

      {/* Overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available projects
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-2xl font-semibold">
              {openProjects.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In progress
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-2xl font-semibold">
              {inProgressProjects.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total projects
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-2xl font-semibold">
              {allProjects.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Available projects */}
      <div className="space-y-4">

        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">
              Available projects
            </h3>

            <p className="text-sm text-muted-foreground">
              Projects currently open for freelancers.
            </p>
          </div>

          <Badge variant="secondary">
            {openProjects.length}
          </Badge>
        </div>

        {openProjects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-14 text-center">
              <div className="rounded-full bg-muted p-3">
                <span className="text-xl">⌕</span>
              </div>

              <h3 className="mt-4 font-semibold">
                No open projects
              </h3>

              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                There are currently no projects
                available for applications.
              </p>

              <Button

                variant="outline"
                className="mt-5"
              >
                <Link to="/freelancer/projects">
                  View all projects
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {openProjects.map((project) => (
              <Link
                key={project.id}
                to="/freelancer/projects/$projectId"
                params={{
                  projectId: project.id,
                }}
                className="block"
              >
                <Card className="h-full transition-colors hover:border-foreground/20 hover:bg-muted/30">
                  <CardContent className="flex h-full flex-col p-6">

                    {/* Title */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="font-semibold leading-6">
                          {project.title}
                        </h3>
                      </div>

                      <Badge
                        variant={getStatusVariant(
                          project.status,
                        )}
                      >
                        {getStatusLabel(
                          project.status,
                        )}
                      </Badge>
                    </div>

                    {/* Description */}
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {project.description}
                    </p>

                    {/* Metadata */}
                    <div className="mt-auto pt-6">
                      <div className="grid grid-cols-2 gap-4 border-t pt-4">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Budget
                          </p>

                          <p className="mt-1 text-sm font-medium">
                            {formatBudget(
                              project.budget,
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">
                            Deadline
                          </p>

                          <p className="mt-1 text-sm font-medium">
                            {formatDeadline(
                              project.deadline,
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-end text-sm font-medium">
                        View project
                        <span className="ml-2 text-muted-foreground">
                          →
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}