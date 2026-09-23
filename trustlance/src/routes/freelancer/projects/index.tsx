import { createFileRoute, Link } from "@tanstack/react-router";

import { useMemo, useState } from "react";

import { useProjects } from "../../../hooks/project.hooks";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";


export const Route = createFileRoute(
  "/freelancer/projects/",
)({
  component: FreelancerProjects,
});

function formatBudget(budget: number | null) {
  if (budget === null) {
    return "Budget not specified";
  }

  return `ETH ${budget.toLocaleString()}`;
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

function getStatusVariant(status: string) {
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

function FreelancerProjects() {
  const {
    data: projects,
    isLoading,
    error,
  } = useProjects();

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const filteredProjects = useMemo(() => {
    if (!projects) {
      return [];
    }

    const normalizedSearch =
      search.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesSearch =
        !normalizedSearch ||
        project.title
          .toLowerCase()
          .includes(normalizedSearch) ||
        project.description
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" ||
        project.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [projects, search, statusFilter]);

  if (isLoading) {
    return (

      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-72" />
        </div>

        <Skeleton className="h-10 w-full max-w-md" />

        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 6 }).map(
            (_, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-8 w-full" />
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

      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          Browse projects
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Explore projects and find opportunities
          that match your skills.
        </p>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {error.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Search & filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search projects..."
              className="sm:max-w-md"
            />

            <div className="flex flex-wrap gap-2">
              {[
                ["all", "All"],
                ["open", "Open"],
                [
                  "in_progress",
                  "In progress",
                ],
                [
                  "completed",
                  "Completed",
                ],
              ].map(
                ([value, label]) => (
                  <Button
                    key={value}
                    type="button"
                    size="sm"
                    variant={
                      statusFilter === value
                        ? "default"
                        : "outline"
                    }
                    onClick={() =>
                      setStatusFilter(
                        value,
                      )
                    }
                  >
                    {label}
                  </Button>
                ),
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredProjects.length}{" "}
          {filteredProjects.length === 1
            ? "project"
            : "projects"}
        </p>
      </div>

      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-3">
              <span className="text-lg">
                ⌕
              </span>
            </div>

            <h3 className="mt-4 font-semibold">
              No projects found
            </h3>

            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Try changing your search or
              status filter.
            </p>

            {(search ||
              statusFilter !== "all") && (
                <Button
                  variant="outline"
                  className="mt-5"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                  }}
                >
                  Clear filters
                </Button>
              )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredProjects.map(
            (project) => (
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

                    {/* Top row */}
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-semibold leading-6">
                        {project.title}
                      </h3>

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
                    <div className="mt-auto grid grid-cols-2 gap-4 pt-6">
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

                    {/* CTA */}
                    <div className="mt-5 flex items-center justify-between border-t pt-4">
                      <span className="text-xs text-muted-foreground">
                        Posted{" "}
                        {new Date(
                          project.created_at,
                        ).toLocaleDateString()}
                      </span>

                      <span className="text-sm font-medium">
                        View project →
                      </span>
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