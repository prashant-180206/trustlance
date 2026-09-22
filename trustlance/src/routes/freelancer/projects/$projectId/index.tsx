import {
  createFileRoute,
  Link,
} from "@tanstack/react-router";

import { useState } from "react";

import { useProject } from "../../../../hooks/project.hooks";
import { useApplyToProject } from "../../../../hooks/application.hooks";
import { useAuth } from "../../../../hooks/provider/AuthProvider";

import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

import { Shell } from "../../../-components";

export const Route = createFileRoute(
  "/freelancer/projects/$projectId/",
)({
  component: FreelancerProject,
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
      month: "long",
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

function FreelancerProject() {
  const { projectId } = Route.useParams();

  const { user } = useAuth();

  const apply = useApplyToProject();

  const [proposal, setProposal] =
    useState("");

  const [proposedAmount, setProposedAmount] =
    useState("");

  const {
    data: project,
    isLoading,
    error,
  } = useProject(projectId);

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!user?.id) {
      return;
    }

    apply.mutate({
      projectId,
      freelancerId: user.id,
      proposal: proposal.trim(),
      proposedAmount: Number(
        proposedAmount,
      ),
    });
  };

  if (isLoading) {
    return (
      <Shell
        title="Project"
        role="freelancer"
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">

          <Card>
            <CardHeader className="space-y-3">
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-4 w-24" />
            </CardHeader>

            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>

            <CardContent className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </Shell>
    );
  }

  if (!project) {
    return (
      <Shell
        title="Project"
        role="freelancer"
      >
        <Alert variant="destructive">
          <AlertDescription>
            {error?.message ??
              "Project not found."}
          </AlertDescription>
        </Alert>
      </Shell>
    );
  }

  const canApply =
    project.status === "open";

  return (
    <Shell
      title={project.title}
      role="freelancer"
    >
      <div className="space-y-6">

        {/* Project header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight">
                {project.title}
              </h2>

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

            <p className="mt-2 text-sm text-muted-foreground">
              Posted{" "}
              {new Date(
                project.created_at,
              ).toLocaleDateString(
                undefined,
                {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                },
              )}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap gap-2">
          <Button

            variant="outline"
            size="sm"
          >
            <Link
              to="/freelancer/projects/$projectId/milestones"
              params={{ projectId }}
            >
              Milestones
            </Link>
          </Button>

          <Button

            variant="outline"
            size="sm"
          >
            <Link
              to="/freelancer/projects/$projectId/disputes"
              params={{ projectId }}
            >
              Disputes
            </Link>
          </Button>
        </div>

        {/* Main layout */}
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">

          {/* Project information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Project overview
              </CardTitle>

              <CardDescription>
                Details provided by the company.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">

              <div>
                <h3 className="mb-2 text-sm font-medium">
                  Description
                </h3>

                <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                  {project.description}
                </p>
              </div>

              <Separator />

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Project budget
                  </p>

                  <p className="mt-1 text-lg font-semibold">
                    {formatBudget(
                      project.budget,
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Deadline
                  </p>

                  <p className="mt-1 text-lg font-semibold">
                    {formatDeadline(
                      project.deadline,
                    )}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-xs text-muted-foreground">
                  Project ID
                </p>

                <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                  {project.id}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Application */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-base">
                Submit your proposal
              </CardTitle>

              <CardDescription>
                Tell the company why you're a good
                fit for this project.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {!canApply ? (
                <Alert>
                  <AlertDescription>
                    This project is no longer open
                    for applications.
                  </AlertDescription>
                </Alert>
              ) : (
                <form
                  className="space-y-5"
                  onSubmit={handleSubmit}
                >
                  <div className="space-y-2">
                    <Label htmlFor="proposal">
                      Proposal
                    </Label>

                    <Textarea
                      id="proposal"
                      value={proposal}
                      onChange={(event) =>
                        setProposal(
                          event.target.value,
                        )
                      }
                      placeholder="Explain your experience, approach, and why you're a good fit..."
                      rows={7}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="proposed-amount">
                      Proposed amount
                    </Label>

                    <div className="relative">
                      <Input
                        id="proposed-amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          proposedAmount
                        }
                        onChange={(event) =>
                          setProposedAmount(
                            event.target.value,
                          )
                        }
                        placeholder="0"
                        required
                      />

                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        INR
                      </span>
                    </div>
                  </div>

                  {apply.error && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        {apply.error.message}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={
                      apply.isPending ||
                      !user?.id
                    }
                  >
                    {apply.isPending
                      ? "Submitting..."
                      : "Submit proposal"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  );
}