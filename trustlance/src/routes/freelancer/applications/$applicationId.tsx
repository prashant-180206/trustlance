
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DollarSign,
  FileText,
  XCircle,
} from "lucide-react";

import { useAuth } from "../../../hooks/provider/AuthProvider";
import { useFreelancerApplications } from "../../../hooks/application.hooks";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute(
  "/freelancer/applications/$applicationId",
)({
  component: FreelancerApplication,
});

type ApplicationStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "withdrawn";

function FreelancerApplication() {
  const { applicationId } = Route.useParams();
  const { user } = useAuth();

  const {
    data: applications,
    isLoading,
    error,
  } = useFreelancerApplications(user?.id ?? "");

  if (isLoading) {
    return <ApplicationDetailSkeleton />;
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Alert variant="destructive">
          <AlertTitle>
            Failed to load application
          </AlertTitle>

          <AlertDescription>
            {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const application = applications?.find(
    (item) => item.id === applicationId,
  );

  if (!application) {
    return <ApplicationNotFound />;
  }

  const project = application.projects;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* ================================================== */}
      {/* BACK */}
      {/* ================================================== */}

      <Button
        variant="ghost"
        size="sm"

        className="mb-6 -ml-2"
      >
        <Link to="/freelancer/applications">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to applications
        </Link>
      </Button>

      {/* ================================================== */}
      {/* HEADER */}
      {/* ================================================== */}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BriefcaseBusiness className="h-4 w-4" />
            Application
          </div>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            {project?.title ??
              "Project Application"}
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Submitted{" "}
            {formatDate(
              application.created_at,
            )}
          </p>
        </div>

        <ApplicationStatusBadge
          status={application.status}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* ================================================== */}
        {/* MAIN CONTENT */}
        {/* ================================================== */}

        <div className="space-y-6">
          {/* Proposal */}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Your Proposal
              </CardTitle>
            </CardHeader>

            <CardContent>
              {application.proposal ? (
                <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                  {application.proposal}
                </p>
              ) : (
                <p className="text-sm italic text-muted-foreground">
                  No proposal text was provided.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Project information */}

          <Card>
            <CardHeader>
              <CardTitle>
                Project Information
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">
              <div>
                <p className="text-sm font-medium">
                  Project
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  {project?.title ??
                    "Unknown project"}
                </p>
              </div>

              <Separator />

              <div className="grid gap-5 sm:grid-cols-2">
                <InfoItem
                  icon={
                    <DollarSign className="h-4 w-4" />
                  }
                  label="Project Budget"
                  value={formatCurrency(
                    project?.budget ??
                    null,
                  )}
                />

                <InfoItem
                  icon={
                    <DollarSign className="h-4 w-4" />
                  }
                  label="Your Proposal"
                  value={formatCurrency(
                    application.proposed_amount,
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ================================================== */}
        {/* SIDEBAR */}
        {/* ================================================== */}

        <div className="space-y-6">
          {/* Status */}

          <Card>
            <CardHeader>
              <CardTitle>
                Application Status
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="flex items-center gap-3">
                <StatusIcon
                  status={
                    application.status
                  }
                />

                <div>
                  <p className="font-medium">
                    {getStatusLabel(
                      application.status,
                    )}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {getStatusDescription(
                      application.status,
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}

          <Card>
            <CardHeader>
              <CardTitle>
                Application Details
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">
              <DetailRow
                label="Submitted"
                value={formatDate(
                  application.created_at,
                )}
                icon={
                  <CalendarDays className="h-4 w-4" />
                }
              />

              <DetailRow
                label="Last Updated"
                value={formatDate(
                  application.updated_at,
                )}
                icon={
                  <Clock3 className="h-4 w-4" />
                }
              />
            </CardContent>
          </Card>

          {/* Project button */}

          <Button

            className="w-full"
          >
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
        </div>
      </div>
    </div>
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
      className={`px-3 py-1 ${config[status]}`}
    >
      {getStatusLabel(status)}
    </Badge>
  );
}

// ============================================================
// STATUS ICON
// ============================================================

function StatusIcon({
  status,
}: {
  status: ApplicationStatus;
}) {
  if (status === "accepted") {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
        <CheckCircle2 className="h-5 w-5" />
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
        <XCircle className="h-5 w-5" />
      </div>
    );
  }

  if (status === "withdrawn") {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <XCircle className="h-5 w-5" />
      </div>
    );
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
      <Clock3 className="h-5 w-5" />
    </div>
  );
}

// ============================================================
// INFO ITEM
// ============================================================

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 text-muted-foreground">
        {icon}
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>

        <p className="mt-1 font-semibold">
          {value}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// DETAIL ROW
// ============================================================

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>

      <span className="text-right text-sm font-medium">
        {value}
      </span>
    </div>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================

function ApplicationNotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-5xl items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center py-12 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>

          <h2 className="text-lg font-semibold">
            Application not found
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            This application doesn't exist or
            you don't have access to it.
          </p>

          <Button

            className="mt-6"
          >
            <Link to="/freelancer/applications">
              Back to applications
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// LOADING
// ============================================================

function ApplicationDetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="h-9 w-44" />

      <div className="mb-8 mt-8 flex items-start justify-between">
        <div>
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-3 h-9 w-72" />
          <Skeleton className="mt-2 h-4 w-40" />
        </div>

        <Skeleton className="h-7 w-24" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>

            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>

            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>

            <CardContent>
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>

            <CardContent className="space-y-5">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
            </CardContent>
          </Card>
        </div>
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

function getStatusDescription(
  status: ApplicationStatus,
) {
  return {
    pending:
      "Your application is waiting for the company to review it.",
    accepted:
      "Your application has been accepted by the company.",
    rejected:
      "The company has decided not to proceed with this application.",
    withdrawn:
      "You withdrew this application.",
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
