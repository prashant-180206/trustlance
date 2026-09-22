
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  DollarSign,
  FileText,
  UserRound,
  X,
  XCircle,
} from "lucide-react";

import {
  useCompanyApplications,
  useUpdateApplicationStatus,
} from "../../../hooks/application.hooks";

import { useAuth } from "../../../hooks/provider/AuthProvider";

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
  "/company/applications/$applicationId",
)({
  component: CompanyApplication,
});

type ApplicationStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "withdrawn";

function CompanyApplication() {
  const { applicationId } = Route.useParams();
  const { user } = useAuth();

  const {
    data: applications,
    isLoading,
    error,
  } = useCompanyApplications(user?.id ?? "");

  const updateStatus =
    useUpdateApplicationStatus();

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
  const freelancer =
    application.freelancer_profiles;

  const isUpdating =
    updateStatus.isPending &&
    updateStatus.variables?.applicationId ===
    application.id;

  const handleStatusChange = (
    status: "accepted" | "rejected",
  ) => {
    if (!user?.id) {
      return;
    }

    updateStatus.mutate({
      applicationId: application.id,
      status,
      projectId: application.project_id,
      freelancerId:
        application.freelancer_id,
      companyId: user.id,
    });
  };

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
        <Link to="/company/applications">
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
            Application Review
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

      {/* ================================================== */}
      {/* ERROR */}
      {/* ================================================== */}

      {updateStatus.error && (
        <Alert
          variant="destructive"
          className="mb-6"
        >
          <AlertTitle>
            Failed to update application
          </AlertTitle>

          <AlertDescription>
            {updateStatus.error.message}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* ================================================== */}
        {/* MAIN */}
        {/* ================================================== */}

        <div className="space-y-6">
          {/* Freelancer */}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="h-5 w-5" />
                Freelancer
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-muted">
                  <UserRound className="h-6 w-6 text-muted-foreground" />
                </div>

                <div>
                  <p className="font-semibold">
                    Freelancer
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {freelancer?.headline ??
                      "No headline provided"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Proposal */}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Proposal
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

          {/* Project */}

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
                  label="Proposed Amount"
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

          {/* Application Details */}

          <Card>
            <CardHeader>
              <CardTitle>
                Application Details
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">
              <DetailRow
                icon={
                  <CalendarDays className="h-4 w-4" />
                }
                label="Submitted"
                value={formatDate(
                  application.created_at,
                )}
              />

              <DetailRow
                icon={
                  <Clock3 className="h-4 w-4" />
                }
                label="Last Updated"
                value={formatDate(
                  application.updated_at,
                )}
              />
            </CardContent>
          </Card>

          {/* Review actions */}

          {application.status ===
            "pending" && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Review Application
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                  <Button
                    className="w-full"
                    disabled={isUpdating}
                    onClick={() =>
                      handleStatusChange(
                        "accepted",
                      )
                    }
                  >
                    <Check className="mr-2 h-4 w-4" />

                    {isUpdating &&
                      updateStatus
                        .variables
                        ?.status ===
                      "accepted"
                      ? "Accepting..."
                      : "Accept Application"}
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={isUpdating}
                    onClick={() =>
                      handleStatusChange(
                        "rejected",
                      )
                    }
                  >
                    <X className="mr-2 h-4 w-4" />

                    {isUpdating &&
                      updateStatus
                        .variables
                        ?.status ===
                      "rejected"
                      ? "Rejecting..."
                      : "Reject Application"}
                  </Button>

                  <p className="pt-1 text-center text-xs text-muted-foreground">
                    Accepting an application
                    will reject other
                    pending applications
                    for this project.
                  </p>
                </CardContent>
              </Card>
            )}

          {/* Project */}

          <Button
            variant="outline"
        
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
      className={config[status]}
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
// NOT FOUND
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
            <Link to="/company/applications">
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
      <Skeleton className="h-9 w-48" />

      <div className="mb-8 mt-8 flex items-start justify-between">
        <div>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-3 h-9 w-72" />
          <Skeleton className="mt-2 h-4 w-40" />
        </div>

        <Skeleton className="h-7 w-24" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>

            <CardContent>
              <Skeleton className="h-14 w-full" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-28" />
            </CardHeader>

            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
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

            <CardContent className="space-y-4">
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
      "This application is waiting for your review.",
    accepted:
      "You accepted this freelancer's application.",
    rejected:
      "You rejected this freelancer's application.",
    withdrawn:
      "The freelancer withdrew this application.",
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
