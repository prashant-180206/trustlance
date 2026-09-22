import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  UserRound,
  X,
  XCircle,
} from "lucide-react";

import { useState } from "react";

import {
  useCompanyApplications,
  useUpdateApplicationStatus,
  type CompanyApplication,
} from "../../../hooks/application.hooks";

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
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute(
  "/company/applications/",
)({
  component: CompanyApplications,
});

type ApplicationStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "withdrawn";

type FilterStatus = "all" | ApplicationStatus;

function CompanyApplications() {
  const { user } = useAuth();

  const {
    data: applications,
    isLoading,
    error,
  } = useCompanyApplications(user?.id ?? "");

  const [filter, setFilter] =
    useState<FilterStatus>("all");

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

  const allApplications = applications ?? [];

  const counts = {
    all: allApplications.length,

    pending: allApplications.filter(
      (application) =>
        application.status === "pending",
    ).length,

    accepted: allApplications.filter(
      (application) =>
        application.status === "accepted",
    ).length,

    rejected: allApplications.filter(
      (application) =>
        application.status === "rejected",
    ).length,

    withdrawn: allApplications.filter(
      (application) =>
        application.status === "withdrawn",
    ).length,
  };

  const filteredApplications =
    filter === "all"
      ? allApplications
      : allApplications.filter(
        (application) =>
          application.status === filter,
      );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* ================================================== */}
      {/* HEADER */}
      {/* ================================================== */}

      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BriefcaseBusiness className="h-4 w-4" />
          Company
          <span>/</span>
          Applications
        </div>

        <h1 className="mt-3 text-3xl font-bold tracking-tight">
          Applications
        </h1>

        <p className="mt-2 text-muted-foreground">
          Review freelancers who have applied
          to your projects.
        </p>
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
          label="Pending Review"
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
          onValueChange={(value) =>
            setFilter(
              value as FilterStatus,
            )
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
        <EmptyState filtered={filter !== "all"} />
      )}

      {/* ================================================== */}
      {/* APPLICATIONS */}
      {/* ================================================== */}

      {filteredApplications.length > 0 && (
        <div className="grid gap-5 lg:grid-cols-2">
          {filteredApplications.map(
            (application) => (
              <CompanyApplicationCard
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

function CompanyApplicationCard({
  application,
}: {
  application: CompanyApplication;
}) {
  const updateStatus =
    useUpdateApplicationStatus();

  const isUpdating =
    updateStatus.isPending &&
    updateStatus.variables?.applicationId ===
    application.id;

  const handleStatusChange = (
    status: "accepted" | "rejected",
  ) => {
    updateStatus.mutate({
      applicationId: application.id,
      status,

      projectId: application.project_id,
      freelancerId:
        application.freelancer_id,
    });
  };

  return (
    <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted">
              <UserRound className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="min-w-0">
              <p className="font-semibold">
                Freelancer
              </p>

              <p className="truncate text-sm text-muted-foreground">
                {application
                  .freelancer_profiles
                  ?.headline ??
                  "No headline provided"}
              </p>
            </div>
          </div>

          <ApplicationStatusBadge
            status={application.status}
          />
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        {/* Project */}

        <div className="mb-5 rounded-lg border bg-muted/30 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Applied to
          </p>

          <p className="mt-1 font-semibold">
            {application.projects?.title ??
              "Unknown project"}
          </p>
        </div>

        {/* Proposal */}

        <div className="mb-6">
          <p className="mb-2 text-sm font-medium">
            Proposal
          </p>

          {application.proposal ? (
            <p className="line-clamp-4 text-sm leading-6 text-muted-foreground">
              {application.proposal}
            </p>
          ) : (
            <p className="text-sm italic text-muted-foreground">
              No proposal provided.
            </p>
          )}
        </div>

        {/* Amount */}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Proposed amount
            </p>

            <p className="mt-1 text-lg font-semibold">
              {formatCurrency(
                application.proposed_amount,
              )}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Applied
            </p>

            <p className="mt-1 text-sm font-medium">
              {formatDate(
                application.created_at,
              )}
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="outline"
          size="sm"

        >
          <Link
            to="/company/applications/$applicationId"
            params={{
              applicationId:
                application.id,
            }}
          >
            View Application
          </Link>
        </Button>

        {application.status === "pending" && (
          <div className="flex w-full gap-2 sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none"
              disabled={isUpdating}
              onClick={() =>
                handleStatusChange(
                  "rejected",
                )
              }
            >
              <X className="mr-1.5 h-4 w-4" />
              Reject
            </Button>

            <Button
              size="sm"
              className="flex-1 sm:flex-none"
              disabled={isUpdating}
              onClick={() =>
                handleStatusChange(
                  "accepted",
                )
              }
            >
              <Check className="mr-1.5 h-4 w-4" />
              Accept
            </Button>
          </div>
        )}
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
    pending:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",

    accepted:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",

    rejected:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",

    withdrawn:
      "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400",
  };

  return (
    <Badge
      variant="outline"
      className={config[status]}
    >
      {getStatusLabel(status)}
    </Badge>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================

function EmptyState({
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
            ? "There are no applications with this status."
            : "Applications from freelancers will appear here when they apply to your projects."}
        </p>
      </CardContent>
    </Card>
  );
}

// ============================================================
// LOADING
// ============================================================

function ApplicationsSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-4 h-9 w-56" />
        <Skeleton className="mt-3 h-5 w-96 max-w-full" />
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map(
          (_, index) => (
            <Card key={index}>
              <CardContent className="p-5">
                <Skeleton className="h-4 w-32" />
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
                <div className="flex gap-3">
                  <Skeleton className="h-11 w-11 rounded-full" />

                  <div>
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="mt-2 h-4 w-44" />
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <Skeleton className="h-20 w-full" />

                <Skeleton className="mt-5 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-5/6" />
                <Skeleton className="mt-2 h-4 w-4/6" />

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
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

function getStatusLabel(
  status: ApplicationStatus,
) {
  return {
    pending: "Pending",
    accepted: "Accepted",
    rejected: "Rejected",
    withdrawn: "Withdrawn",
  }[status];
}

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
