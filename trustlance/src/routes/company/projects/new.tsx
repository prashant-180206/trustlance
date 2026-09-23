
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { useCreateProject } from "../../../hooks/project.hooks";
import { useAuth } from "../../../hooks/provider/AuthProvider";

import { Alert, AlertDescription } from "../../../components/ui/alert";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";

export const Route = createFileRoute("/company/projects/new")({
  component: NewProject,
});

function NewProject() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createProject = useCreateProject();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");

  const isSubmitting = createProject.isPending;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user?.id) return;

    const numericBudget = Number(budget);

    if (!Number.isFinite(numericBudget) || numericBudget <= 0) {
      return;
    }

    if (deadline && new Date(`${deadline}T23:59:59`) < new Date()) {
      return;
    }

    createProject.mutate(
      {
        companyId: user.id,
        projectData: {
          title: title.trim(),
          description: description.trim(),
          budget: numericBudget,
          deadline: deadline || undefined,
        },
      },
      {
        onSuccess: (project) => {
          navigate({
            to: "/company/projects/$projectId",
            params: {
              projectId: project.id,
            },
          });
        },
      },
    );
  };

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12">
        <div className="mb-8">
          <Button
            variant="ghost"

            className="-ml-3 mb-4"
          >
            <Link to="/company/projects">
              ← Back to projects
            </Link>
          </Button>

          <h1 className="text-3xl font-bold tracking-tight">
            Create a project
          </h1>

          <p className="mt-2 text-muted-foreground">
            Describe the work you need done and set your
            project budget and deadline.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Project details</CardTitle>
            <CardDescription>
              Provide enough information for freelancers to
              understand what you need.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <div className="space-y-2">
                <Label htmlFor="title">
                  Project title
                </Label>

                <Input
                  id="title"
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  placeholder="e.g. Build a React dashboard"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Description
                </Label>

                <Textarea
                  id="description"
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder="Describe the work, requirements, deliverables, and any important expectations..."
                  className="min-h-36 resize-y"
                  required
                  disabled={isSubmitting}
                />

                <p className="text-sm text-muted-foreground">
                  Be specific about the work and expected
                  deliverables.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="budget">
                    Budget
                  </Label>

                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      ETH
                    </span>

                    <Input
                      id="budget"
                      type="number"
                      min="0.0001"
                      step="0.0001"
                      value={budget}
                      onChange={(event) =>
                        setBudget(event.target.value)
                      }
                      placeholder="50000"
                      className="pl-12"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Set the total project budget.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline">
                    Deadline
                  </Label>

                  <Input
                    id="deadline"
                    type="date"
                      min={new Date().toISOString().slice(0, 10)}
                    value={deadline}
                    onChange={(event) =>
                      setDeadline(event.target.value)
                    }
                    disabled={isSubmitting}
                  />

                  <p className="text-sm text-muted-foreground">
                    Optional. You can set this later.
                  </p>
                </div>
              </div>

              {createProject.error && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {createProject.error.message}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() =>
                    navigate({
                      to: "/company/projects",
                    })
                  }
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !title.trim() ||
                    !description.trim() ||
                    !budget
                  }
                >
                  {isSubmitting
                    ? "Creating project..."
                    : "Create project"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
