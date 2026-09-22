
import { createFileRoute, Link } from "@tanstack/react-router";
import {
    BriefcaseBusiness,
    CheckCircle2,
    Clock3,
    FileText,
    XCircle,
} from "lucide-react";

import { useMemo, useState } from "react";

import { useFreelancerApplications } from "../../../hooks/application.hooks";
import { useAuth } from "../../../hooks/provider/AuthProvider";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Tabs,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";

export const Route = createFileRoute(
    "/freelancer/applications/",
)({
    component: FreelancerApplications,
});

type ApplicationStatus =
    | "pending"
    | "accepted"
    | "rejected"
    | "withdrawn";

type FilterStatus = "all" | ApplicationStatus;

function FreelancerApplications() {
    const { user } = useAuth();

    const {
        data: applications,
        isLoading,
        error,
    } = useFreelancerApplications(user?.id ?? "");

    const [filter, setFilter] = useState<FilterStatus>("all");

    const filteredApplications = useMemo(() => {
        if (!applications) {
            return [];
        }

        if (filter === "all") {
            return applications;
        }

        return applications.filter(
            (application) => application.status === filter,
        );
    }, [applications, filter]);

    const counts = useMemo(() => {
        const items = applications ?? [];

        return {
            all: items.length,
            pending: items.filter(
                (application) =>
                    application.status === "pending",
            ).length,
            accepted: items.filter(
                (application) =>
                    application.status === "accepted",
            ).length,
            rejected: items.filter(
                (application) =>
                    application.status === "rejected",
            ).length,
            withdrawn: items.filter(
                (application) =>
                    application.status === "withdrawn",
            ).length,
        };
    }, [applications]);

    if (isLoading) {
        return <ApplicationsSkeleton />;
    }

    if (error) {
        return (
            <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <Alert variant="destructive">
                    <AlertTitle>
                        Failed to load applications
                    </AlertTitle>

                    <AlertDescription>
                        {error.message}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {/* ================================================== */}
            {/* HEADER */}
            {/* ================================================== */}

            <div className="mb-8">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BriefcaseBusiness className="h-4 w-4" />
                    Freelancer
                    <span>/</span>
                    Applications
                </div>

                <div className="mt-3">
                    <h1 className="text-3xl font-bold tracking-tight">
                        My Applications
                    </h1>

                    <p className="mt-2 text-muted-foreground">
                        Track your proposals and see where they
                        stand.
                    </p>
                </div>
            </div>

            {/* ================================================== */}
            {/* STATS */}
            {/* ================================================== */}

            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    label="Total Applications"
                    value={counts.all}
                    icon={
                        <FileText className="h-4 w-4" />
                    }
                />

                <StatCard
                    label="Pending"
                    value={counts.pending}
                    icon={
                        <Clock3 className="h-4 w-4" />
                    }
                />

                <StatCard
                    label="Accepted"
                    value={counts.accepted}
                    icon={
                        <CheckCircle2 className="h-4 w-4" />
                    }
                />

                <StatCard
                    label="Rejected"
                    value={counts.rejected}
                    icon={
                        <XCircle className="h-4 w-4" />
                    }
                />
            </div>

            {/* ================================================== */}
            {/* FILTERS */}
            {/* ================================================== */}

            <div className="mb-6 overflow-x-auto">
                <Tabs
                    value={filter}
                    onValueChange={(value ) =>
                        setFilter(value as FilterStatus)
                    }
                >
                    <TabsList>
                        <TabsTrigger value="all">
                            All
                            <span className="ml-1.5 text-xs text-muted-foreground">
                                {counts.all}
                            </span>
                        </TabsTrigger>

                        <TabsTrigger value="pending">
                            Pending
                            <span className="ml-1.5 text-xs text-muted-foreground">
                                {counts.pending}
                            </span>
                        </TabsTrigger>

                        <TabsTrigger value="accepted">
                            Accepted
                            <span className="ml-1.5 text-xs text-muted-foreground">
                                {counts.accepted}
                            </span>
                        </TabsTrigger>

                        <TabsTrigger value="rejected">
                            Rejected
                            <span className="ml-1.5 text-xs text-muted-foreground">
                                {counts.rejected}
                            </span>
                        </TabsTrigger>

                        <TabsTrigger value="withdrawn">
                            Withdrawn
                            <span className="ml-1.5 text-xs text-muted-foreground">
                                {counts.withdrawn}
                            </span>
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* ================================================== */}
            {/* EMPTY STATE */}
            {/* ================================================== */}

            {filteredApplications.length === 0 && (
                <EmptyApplications
                    filtered={filter !== "all"}
                />
            )}

            {/* ================================================== */}
            {/* APPLICATIONS */}
            {/* ================================================== */}

            {filteredApplications.length > 0 && (
                <div className="grid gap-5 lg:grid-cols-2">
                    {filteredApplications.map(
                        (application) => (
                            <ApplicationCard
                                key={application.id}
                                application={application}
                            />
                        ),
                    )}
                </div>
            )}
        </div>
    );
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({
    label,
    value,
    icon,
}: {
    label: string;
    value: number;
    icon: React.ReactNode;
}) {
    return (
        <Card>
            <CardContent className="flex items-center justify-between p-5">
                <div>
                    <p className="text-sm text-muted-foreground">
                        {label}
                    </p>

                    <p className="mt-1 text-2xl font-bold tracking-tight">
                        {value}
                    </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    {icon}
                </div>
            </CardContent>
        </Card>
    );
}

// ============================================================
// APPLICATION CARD
// ============================================================

function ApplicationCard({
    application,
}: {
    application: any;
}) {
    const project = application.projects;

    return (
        <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
            <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h2 className="truncate text-lg font-semibold">
                            {project?.title ??
                                "Untitled Project"}
                        </h2>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Application submitted{" "}
                            {formatDate(
                                application.created_at,
                            )}
                        </p>
                    </div>

                    <ApplicationStatusBadge
                        status={application.status}
                    />
                </div>
            </CardHeader>

            <CardContent className="flex-1">
                {/* Proposal */}

                {application.proposal && (
                    <div className="mb-6">
                        <p className="mb-2 text-sm font-medium">
                            Your proposal
                        </p>

                        <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
                            {application.proposal}
                        </p>
                    </div>
                )}

                {/* Financial information */}

                <div className="grid grid-cols-2 gap-4 rounded-lg border bg-muted/30 p-4">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Your proposal
                        </p>

                        <p className="mt-1 text-lg font-semibold">
                            {formatCurrency(
                                application.proposed_amount,
                            )}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Project budget
                        </p>

                        <p className="mt-1 text-lg font-semibold">
                            {formatCurrency(
                                project?.budget ?? null,
                            )}
                        </p>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="flex items-center justify-between gap-3 border-t pt-4">
                <div className="text-xs text-muted-foreground">
                    Updated{" "}
                    {formatDate(application.updated_at)}
                </div>

                <Button  size="sm">
                    <Link
                        to="/projects/$projectId"
                        params={{
                            projectId:
                                application.project_id,
                        }}
                    >
                        View Project
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}

// ============================================================
// STATUS BADGE
// ============================================================

function ApplicationStatusBadge({
    status,
}: {
    status: ApplicationStatus;
}) {
    const config = {
        pending: {
            label: "Pending",
            className:
                "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
        },

        accepted: {
            label: "Accepted",
            className:
                "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
        },

        rejected: {
            label: "Rejected",
            className:
                "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
        },

        withdrawn: {
            label: "Withdrawn",
            className:
                "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400",
        },
    } satisfies Record<
        ApplicationStatus,
        {
            label: string;
            className: string;
        }
    >;

    const current = config[status];

    return (
        <Badge
            variant="outline"
            className={current.className}
        >
            {current.label}
        </Badge>
    );
}

// ============================================================
// EMPTY STATE
// ============================================================

function EmptyApplications({
    filtered,
}: {
    filtered: boolean;
}) {
    return (
        <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                </div>

                <h2 className="text-lg font-semibold">
                    {filtered
                        ? "No applications found"
                        : "No applications yet"}
                </h2>

                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                    {filtered
                        ? "You don't have any applications with this status."
                        : "Start applying to projects that match your skills and experience."}
                </p>

                {!filtered && (
                    <Button
                        
                        className="mt-6"
                    >
                        <Link to="/projects">
                            Browse Projects
                        </Link>
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

// ============================================================
// LOADING STATE
// ============================================================

function ApplicationsSkeleton() {
    return (
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-8">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-4 h-9 w-64" />
                <Skeleton className="mt-3 h-5 w-96 max-w-full" />
            </div>

            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map(
                    (_, index) => (
                        <Card key={index}>
                            <CardContent className="p-5">
                                <Skeleton className="h-4 w-28" />
                                <Skeleton className="mt-2 h-8 w-12" />
                            </CardContent>
                        </Card>
                    ),
                )}
            </div>

            <Skeleton className="mb-6 h-10 w-105 max-w-full" />

            <div className="grid gap-5 lg:grid-cols-2">
                {Array.from({ length: 4 }).map(
                    (_, index) => (
                        <Card key={index}>
                            <CardHeader>
                                <Skeleton className="h-6 w-2/3" />
                                <Skeleton className="mt-2 h-4 w-40" />
                            </CardHeader>

                            <CardContent>
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="mt-2 h-4 w-5/6" />
                                <Skeleton className="mt-2 h-4 w-4/6" />

                                <Skeleton className="mt-6 h-20 w-full" />
                            </CardContent>
                        </Card>
                    ),
                )}
            </div>
        </div>
    );
}

// ============================================================
// HELPERS
// ============================================================

function formatCurrency(
    amount: number | null,
) {
    if (amount === null || amount === undefined) {
        return "Not specified";
    }

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(amount);
}

function formatDate(date: string) {
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(new Date(date));
}
