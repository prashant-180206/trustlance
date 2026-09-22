import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { useAuth } from "../../../hooks/provider/AuthProvider";
import { useCompanyProjects } from "../../../hooks/project.hooks";

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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Shell } from "../../-components";

export const Route = createFileRoute("/company/projects/")({
    component: CompanyProjects,
});

function getStatusVariant(
    status: string,
): "default" | "secondary" | "destructive" | "outline" {
    switch (status) {
        case "open":
            return "default";

        case "in_progress":
            return "secondary";

        case "completed":
            return "outline";

        case "cancelled":
            return "destructive";

        default:
            return "outline";
    }
}

function formatBudget(budget: number | null): string {
    if (budget === null) {
        return "Not specified";
    }

    return `₹${budget.toLocaleString("en-IN")}`;
}

function CompanyProjects() {
    const { user } = useAuth();

    const {
        data: projects,
        isLoading,
        error,
    } = useCompanyProjects(user?.id ?? "");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const filteredProjects = useMemo(() => {
        if (!projects) return [];

        const query = search.trim().toLowerCase();

        return projects.filter((project) => {
            const matchesSearch =
                !query ||
                project.title.toLowerCase().includes(query) ||
                project.description.toLowerCase().includes(query);

            const matchesStatus =
                statusFilter === "all" ||
                project.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [projects, search, statusFilter]);

    const statusCounts = {
        all: projects?.length ?? 0,
        open:
            projects?.filter((project) => project.status === "open")
                .length ?? 0,
        in_progress:
            projects?.filter(
                (project) => project.status === "in_progress",
            ).length ?? 0,
        completed:
            projects?.filter(
                (project) => project.status === "completed",
            ).length ?? 0,
    };

    return (
        <Shell title="My projects" role="company">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            My projects
                        </h1>

                        <p className="text-sm text-muted-foreground">
                            Manage projects created by your company.
                        </p>
                    </div>

                    <Button >
                        <Link to="/company/projects/new">
                            Create project
                        </Link>
                    </Button>
                </div>

                {/* Error */}
                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>
                            {error.message}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Loading */}
                {isLoading ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <Card key={index}>
                                <CardHeader>
                                    <Skeleton className="h-6 w-2/3" />
                                    <Skeleton className="h-4 w-full" />
                                </CardHeader>

                                <CardContent>
                                    <Skeleton className="h-5 w-24" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <>
                        {/* Filters */}
                        <Card>
                            <CardContent className="space-y-4 pt-6">
                                <Input
                                    placeholder="Search projects..."
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                />

                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        variant={
                                            statusFilter === "all"
                                                ? "default"
                                                : "outline"
                                        }
                                        size="sm"
                                        onClick={() =>
                                            setStatusFilter("all")
                                        }
                                    >
                                        All ({statusCounts.all})
                                    </Button>

                                    <Button
                                        variant={
                                            statusFilter === "open"
                                                ? "default"
                                                : "outline"
                                        }
                                        size="sm"
                                        onClick={() =>
                                            setStatusFilter("open")
                                        }
                                    >
                                        Open ({statusCounts.open})
                                    </Button>

                                    <Button
                                        variant={
                                            statusFilter === "in_progress"
                                                ? "default"
                                                : "outline"
                                        }
                                        size="sm"
                                        onClick={() =>
                                            setStatusFilter("in_progress")
                                        }
                                    >
                                        In progress (
                                        {statusCounts.in_progress})
                                    </Button>

                                    <Button
                                        variant={
                                            statusFilter === "completed"
                                                ? "default"
                                                : "outline"
                                        }
                                        size="sm"
                                        onClick={() =>
                                            setStatusFilter("completed")
                                        }
                                    >
                                        Completed (
                                        {statusCounts.completed})
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Project list */}
                        {filteredProjects.length === 0 ? (
                            <Card>
                                <CardContent className="flex min-h-48 flex-col items-center justify-center text-center">
                                    <p className="font-medium">
                                        No projects found
                                    </p>

                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {search || statusFilter !== "all"
                                            ? "Try changing your search or filters."
                                            : "You have not created any projects yet."}
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2">
                                {filteredProjects.map((project) => (
                                    <Link
                                        key={project.id}
                                        to="/company/projects/$projectId"
                                        params={{
                                            projectId: project.id,
                                        }}
                                        className="group"
                                    >
                                        <Card className="h-full transition-colors group-hover:border-primary">
                                            <CardHeader>
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="min-w-0">
                                                        <CardTitle className="truncate">
                                                            {project.title}
                                                        </CardTitle>

                                                        <CardDescription className="mt-2 line-clamp-2">
                                                            {
                                                                project.description
                                                            }
                                                        </CardDescription>
                                                    </div>

                                                    <Badge
                                                        variant={getStatusVariant(
                                                            project.status,
                                                        )}
                                                    >
                                                        {project.status.replace(
                                                            "_",
                                                            " ",
                                                        )}
                                                    </Badge>
                                                </div>
                                            </CardHeader>

                                            <CardContent>
                                                <div className="flex items-center justify-between border-t pt-4">
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">
                                                            Budget
                                                        </p>

                                                        <p className="font-semibold">
                                                            {formatBudget(
                                                                project.budget,
                                                            )}
                                                        </p>
                                                    </div>

                                                    {project.deadline && (
                                                        <div className="text-right">
                                                            <p className="text-xs text-muted-foreground">
                                                                Deadline
                                                            </p>

                                                            <p className="text-sm font-medium">
                                                                {new Date(
                                                                    project.deadline,
                                                                ).toLocaleDateString(
                                                                    "en-IN",
                                                                    {
                                                                        day: "numeric",
                                                                        month: "short",
                                                                        year: "numeric",
                                                                    },
                                                                )}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </Shell>
    );
}