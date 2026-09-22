
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  FolderOpen,
  Plus,
  Wallet,
} from "lucide-react";

import { useCompanyProjects } from "../../hooks/project.hooks";
import { useAuth } from "../../hooks/provider/AuthProvider";

import { ErrorMessage, Shell } from "../-components";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/company/dashboard")({
  component: CompanyDashboard,
});

function CompanyDashboard() {
  const { user } = useAuth();

  const companyId = user?.id ?? "";

  const {
    data: projects,
    isLoading,
    error,
  } = useCompanyProjects(companyId);

  if (isLoading) {
    return (
      <Shell title="Company dashboard" role="company">
        <DashboardSkeleton />
      </Shell>
    );
  }

  const projectList = projects ?? [];

  const totalProjects = projectList.length;

  const openProjects = projectList.filter(
    (project) => project.status === "open",
  ).length;

  const activeProjects = projectList.filter(
    (project) => project.status === "in_progress",
  ).length;

  const completedProjects = projectList.filter(
    (project) => project.status === "completed",
  ).length;

  const totalBudget = projectList.reduce(
    (total, project) => total + (project.budget ?? 0),
    0,
  );

  const recentProjects = [...projectList]
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() -
        new Date(a.updated_at).getTime(),
    )
    .slice(0, 5);

  return (
    <Shell title="Company dashboard" role="company">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm text-muted-foreground">
              Company workspace
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Dashboard
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage your projects and track your freelance work.
            </p>
          </div>

          <Button >
            <Plus className="mr-2 h-4 w-4" />
            <Link to="/company/projects/new">
              Create project
            </Link>
          </Button>
        </div>

        <ErrorMessage error={error} />

        {/* Overview */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total projects"
            value={totalProjects}
            description="All projects"
            icon={<FolderOpen className="h-4 w-4" />}
          />

          <StatCard
            title="Open"
            value={openProjects}
            description="Looking for freelancers"
            icon={<BriefcaseBusiness className="h-4 w-4" />}
          />

          <StatCard
            title="In progress"
            value={activeProjects}
            description="Currently active"
            icon={<Clock3 className="h-4 w-4" />}
          />

          <StatCard
            title="Completed"
            value={completedProjects}
            description="Successfully completed"
            icon={<CheckCircle2 className="h-4 w-4" />}
          />
        </div>

        {/* Budget overview */}
        <Card>
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted">
                <Wallet className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Total project budget
                </p>

                <p className="text-2xl font-semibold tracking-tight">
                  {formatBudget(totalBudget)}
                </p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Across {totalProjects} project
              {totalProjects === 1 ? "" : "s"}
            </p>
          </CardContent>
        </Card>

        {/* Projects */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Recent projects
              </h2>

              <p className="text-sm text-muted-foreground">
                Your most recently updated projects.
              </p>
            </div>

            {projectList.length > 5 && (
              <Button variant="ghost" size="sm">
                <Link to="/company/projects">
                  View all
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>

          {recentProjects.length === 0 ? (
            <EmptyProjects />
          ) : (
            <div className="space-y-3">
              {recentProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </Shell>
  );
}

type Project = {
  budget: number | null;
  company_id: string;
  created_at: string;
  deadline: string | null;
  description: string;
  escrow_address: string | null;
  id: string;
  status:
  | "draft"
  | "open"
  | "in_progress"
  | "completed"
  | "cancelled";
  title: string;
  updated_at: string;
};

function StatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{title}</p>

          <div className="flex h-8 w-8 items-center justify-center rounded-md border bg-muted">
            {icon}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-2xl font-semibold tracking-tight">
            {value}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      to="/company/projects/$projectId"
      params={{ projectId: project.id }}
      className="block"
    >
      <Card className="transition-colors hover:bg-muted/40">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate font-medium">
                  {project.title}
                </h3>

                <ProjectStatus status={project.status} />
              </div>

              <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                {project.description}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-6">
              <div className="text-right">
                <p className="text-sm font-medium">
                  {formatBudget(project.budget)}
                </p>

                <p className="text-xs text-muted-foreground">
                  {project.deadline
                    ? `Due ${formatDate(project.deadline)}`
                    : "No deadline"}
                </p>
              </div>

              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Updated {formatDate(project.updated_at)}
            </span>

            <span>
              {project.escrow_address
                ? "Escrow configured"
                : "No escrow yet"}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ProjectStatus({
  status,
}: {
  status: Project["status"];
}) {
  const config = {
    draft: {
      label: "Draft",
      variant: "secondary" as const,
    },
    open: {
      label: "Open",
      variant: "default" as const,
    },
    in_progress: {
      label: "In progress",
      variant: "outline" as const,
    },
    completed: {
      label: "Completed",
      variant: "secondary" as const,
    },
    cancelled: {
      label: "Cancelled",
      variant: "destructive" as const,
    },
  };

  const current = config[status];

  return (
    <Badge variant={current.variant}>
      {current.label}
    </Badge>
  );
}

function EmptyProjects() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border bg-muted">
          <FolderOpen className="h-5 w-5 text-muted-foreground" />
        </div>

        <h3 className="mt-4 font-medium">
          No projects yet
        </h3>

        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Create your first project and start finding trusted
          freelancers.
        </p>

        <Button className="mt-5">
            <Plus className="mr-2 h-4 w-4" />
          <Link to="/company/projects/new">
            Create project
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-4 w-32 rounded bg-muted" />
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-4 w-72 rounded bg-muted" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="h-32 p-5" />
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="h-24 p-6" />
      </Card>

      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="h-28 p-5" />
          </Card>
        ))}
      </div>
    </div>
  );
}

function formatBudget(budget: number | null) {
  if (budget === null) {
    return "Not specified";
  }

  return `${budget.toLocaleString()} ETH`;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}
