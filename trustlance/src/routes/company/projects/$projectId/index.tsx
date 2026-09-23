
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import type { Address } from "viem";

import {
  useProject,
  // useProjectEscrow,
  useProjectBlockchainStatus,
  useFundProject,
  useRequestCancellation,
  useCancelProjectBeforeAward,
} from "../../../../hooks/project.hooks";
import { useProjectApplications } from "../../../../hooks/application.hooks";

import { Alert, AlertDescription } from "../../../../components/ui/alert";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../../components/ui/card";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Separator } from "../../../../components/ui/separator";
import { Textarea } from "../../../../components/ui/textarea";

export const Route = createFileRoute(
  "/company/projects/$projectId/",
)({
  component: CompanyProject,
});

type Milestone = {
  amount: string;
  description: string;
};

function CompanyProject() {
  const { projectId } = Route.useParams();

  const projectQuery = useProject(projectId);
  // const escrowQuery = useProjectEscrow(projectId);
  const blockchainQuery = useProjectBlockchainStatus(projectId);
  const applicationsQuery = useProjectApplications(projectId);

  const fund = useFundProject();
  const requestCancellation = useRequestCancellation();
  const cancelBeforeAward = useCancelProjectBeforeAward();

  const [freelancerWallet, setFreelancerWallet] = useState("");
  const [milestones, setMilestones] = useState<Milestone[]>([
    {
      amount: "",
      description: "",
    },
  ]);

  const isFunding = fund.isPending;
  const isCancelling =
    requestCancellation.isPending ||
    cancelBeforeAward.isPending;

  if (projectQuery.isLoading) {
    return (
      <ProjectPage>
        <LoadingState />
      </ProjectPage>
    );
  }

  if (projectQuery.error) {
    return (
      <ProjectPage>
        <Alert variant="destructive">
          <AlertDescription>
            {projectQuery.error.message}
          </AlertDescription>
        </Alert>
      </ProjectPage>
    );
  }

  const project = projectQuery.data;

  if (!project) {
    return (
      <ProjectPage>
        <Alert>
          <AlertDescription>
            Project not found.
          </AlertDescription>
        </Alert>
      </ProjectPage>
    );
  }

  const blockchain = blockchainQuery.data;

  const canFund =
    Boolean(project.escrow_address) &&
    !blockchain?.funded &&
    !blockchain?.cancelled &&
    !isFunding;

  const canCancelBeforeAward =
    !blockchain?.funded &&
    !blockchain?.cancelled &&
    !isCancelling;

  const addMilestone = () => {
    setMilestones((current) => [
      ...current,
      {
        amount: "",
        description: "",
      },
    ]);
  };

  const removeMilestone = (index: number) => {
    setMilestones((current) =>
      current.filter((_, milestoneIndex) => milestoneIndex !== index),
    );
  };

  const updateMilestone = (
    index: number,
    field: keyof Milestone,
    value: string,
  ) => {
    setMilestones((current) =>
      current.map((milestone, milestoneIndex) =>
        milestoneIndex === index
          ? {
            ...milestone,
            [field]: value,
          }
          : milestone,
      ),
    );
  };

  const handleFund = () => {
    if (!project.escrow_address) return;

    if (!freelancerWallet.trim()) return;

    try {
      const wallet = freelancerWallet.trim() as Address;

      const amounts = milestones.map((milestone) =>
        BigInt(milestone.amount),
      );

      const descriptions = milestones.map(
        (milestone) => milestone.description.trim(),
      );

      fund.mutate({
        projectId,
        freelancerWallet: wallet,
        milestoneData: {
          amounts,
          descriptions,
        },
      });
    } catch (error) {
      console.error("Invalid milestone data", error);
    }
  };

  const fundError = fund.error;
  const cancellationError =
    requestCancellation.error ?? cancelBeforeAward.error;

  return (
    <ProjectPage>
      {/* -------------------------------------------------- */}
      {/* HEADER */}
      {/* -------------------------------------------------- */}

      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"

            className="-ml-3"
          >
            <Link to="/company/projects">
              ← Back to projects
            </Link>
          </Button>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {project.title}
            </h1>

            <ProjectStatusBadge status={project.status} />
          </div>

          <p className="max-w-3xl text-muted-foreground">
            Manage your project, review applications,
            configure milestones, and manage the escrow.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" >
            <Link
              to="/company/projects/$projectId/milestones"
              params={{ projectId }}
            >
              Milestones
            </Link>
          </Button>

          <Button variant="outline" >
            <Link
              to="/company/projects/$projectId/disputes"
              params={{ projectId }}
            >
              Disputes
            </Link>
          </Button>
        </div>
      </div>

      {/* -------------------------------------------------- */}
      {/* PROJECT OVERVIEW */}
      {/* -------------------------------------------------- */}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Project overview</CardTitle>
            <CardDescription>
              Details provided when this project was created.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <h3 className="mb-2 text-sm font-medium">
                Description
              </h3>

              <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                {project.description}
              </p>
            </div>

            <Separator />

            <div className="grid gap-6 sm:grid-cols-3">
              <ProjectMetric
                label="Budget"
                value={formatAmount(project.budget)}
              />

              <ProjectMetric
                label="Deadline"
                value={
                  project.deadline
                    ? formatDate(project.deadline)
                    : "No deadline"
                }
              />

              <ProjectMetric
                label="Created"
                value={formatDate(project.created_at)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Escrow summary */}

        <Card>
          <CardHeader>
            <CardTitle>Escrow</CardTitle>
            <CardDescription>
              Blockchain-backed project funds.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Escrow address
              </p>

              <p className="break-all font-mono text-xs">
                {project.escrow_address ?? "Not available"}
              </p>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Funding
              </span>

              <BlockchainBadge
                funded={blockchain?.funded}
                cancelled={blockchain?.cancelled}
              />
            </div>

            {blockchainQuery.isLoading && (
              <p className="text-xs text-muted-foreground">
                Updating blockchain status...
              </p>
            )}

            {blockchain?.totalEscrowed !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Escrowed
                </span>

                <span className="font-medium">
                  {blockchain.totalEscrowed.toString()} wei
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* -------------------------------------------------- */}
      {/* APPLICATIONS */}
      {/* -------------------------------------------------- */}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Applications</CardTitle>
          <CardDescription>
            Freelancers who have applied to this project.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {applicationsQuery.isLoading ? (
            <LoadingState />
          ) : applicationsQuery.error ? (
            <Alert variant="destructive">
              <AlertDescription>
                {applicationsQuery.error.message}
              </AlertDescription>
            </Alert>
          ) : !applicationsQuery.data?.length ? (
            <EmptyState message="No applications yet." />
          ) : (
            <div className="space-y-3">
              {applicationsQuery.data.map((application) => (
                <Link
                  key={application.id}
                  to="/company/applications/$applicationId"
                  params={{
                    applicationId: application.id,
                  }}
                  className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium">
                        Freelancer
                      </p>

                      <p className="font-mono text-xs text-muted-foreground">
                        {application.freelancer_id}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant="outline">
                        {application.status}
                      </Badge>

                      <span className="text-sm font-medium">
                        {application.proposed_amount ??
                          "—"}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* -------------------------------------------------- */}
      {/* FUND & AWARD */}
      {/* -------------------------------------------------- */}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Fund & award</CardTitle>
          <CardDescription>
            Select a freelancer and define the milestones that
            will be funded through escrow.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {blockchain?.funded && (
            <Alert>
              <AlertDescription>
                This project has already been funded and
                awarded. Funding actions are no longer
                available.
              </AlertDescription>
            </Alert>
          )}

          {blockchain?.cancelled && (
            <Alert variant="destructive">
              <AlertDescription>
                This project has been cancelled. Funding
                and award actions are no longer available.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="freelancer-wallet">
              Freelancer wallet
            </Label>

            <Input
              id="freelancer-wallet"
              value={freelancerWallet}
              onChange={(event) =>
                setFreelancerWallet(event.target.value)
              }
              placeholder="0x..."
              disabled={!canFund}
            />

            <p className="text-xs text-muted-foreground">
              Enter the wallet address that will receive the
              project award.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Milestones</h3>
              <p className="text-sm text-muted-foreground">
                Break the project into individual milestones.
              </p>
            </div>

            <div className="space-y-4">
              {milestones.map((milestone, index) => (
                <div
                  key={index}
                  className="rounded-lg border p-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="text-sm font-medium">
                      Milestone {index + 1}
                    </h4>

                    {milestones.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          removeMilestone(index)
                        }
                        disabled={!canFund}
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-[180px_1fr]">
                    <div className="space-y-2">
                      <Label
                        htmlFor={`milestone-amount-${index}`}
                      >
                        Amount
                      </Label>

                      <Input
                        id={`milestone-amount-${index}`}
                        type="number"
                        min="1"
                        step="1"
                        placeholder="Amount in wei"
                        value={milestone.amount}
                        onChange={(event) =>
                          updateMilestone(
                            index,
                            "amount",
                            event.target.value,
                          )
                        }
                        disabled={!canFund}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor={`milestone-description-${index}`}
                      >
                        Description
                      </Label>

                      <Textarea
                        id={`milestone-description-${index}`}
                        placeholder="Describe what will be delivered..."
                        value={
                          milestone.description
                        }
                        onChange={(event) =>
                          updateMilestone(
                            index,
                            "description",
                            event.target.value,
                          )
                        }
                        className="min-h-24"
                        disabled={!canFund}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={addMilestone}
              disabled={!canFund}
            >
              + Add milestone
            </Button>
          </div>

          {fundError && (
            <Alert variant="destructive">
              <AlertDescription>
                {fundError.message}
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              disabled={!canFund}
              onClick={handleFund}
            >
              {isFunding
                ? "Funding & awarding..."
                : "Fund & award project"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* -------------------------------------------------- */}
      {/* CANCELLATION */}
      {/* -------------------------------------------------- */}

      <Card className="mt-6 border-destructive/30">
        <CardHeader>
          <CardTitle>Project cancellation</CardTitle>
          <CardDescription>
            Manage cancellation before the project has been
            awarded.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {blockchain?.clientCancellationRequested && (
            <Alert>
              <AlertDescription>
                A cancellation request has already been
                submitted by the client.
              </AlertDescription>
            </Alert>
          )}

          {cancellationError && (
            <Alert variant="destructive">
              <AlertDescription>
                {cancellationError.message}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              disabled={!canCancelBeforeAward}
              onClick={() =>
                requestCancellation.mutate({
                  projectId,
                })
              }
            >
              {requestCancellation.isPending
                ? "Requesting..."
                : "Request cancellation"}
            </Button>

            <Button
              variant="destructive"
              disabled={!canCancelBeforeAward}
              onClick={() =>
                cancelBeforeAward.mutate({
                  projectId,
                })
              }
            >
              {cancelBeforeAward.isPending
                ? "Cancelling..."
                : "Cancel before award"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* -------------------------------------------------- */}
      {/* BLOCKCHAIN DETAILS */}
      {/* -------------------------------------------------- */}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Blockchain details</CardTitle>
          <CardDescription>
            Technical state returned directly from the escrow
            contract.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {blockchainQuery.isLoading ? (
            <LoadingState />
          ) : blockchainQuery.error ? (
            <Alert variant="destructive">
              <AlertDescription>
                {blockchainQuery.error.message}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <BlockchainValue
                label="Client"
                value={blockchain?.client}
              />

              <BlockchainValue
                label="Freelancer"
                value={blockchain?.freelancer}
              />

              <BlockchainValue
                label="Total escrowed"
                value={
                  blockchain?.totalEscrowed?.toString()
                }
              />

              <BlockchainValue
                label="Funded"
                value={String(
                  blockchain?.funded ?? false,
                )}
              />

              <BlockchainValue
                label="Cancelled"
                value={String(
                  blockchain?.cancelled ?? false,
                )}
              />

              <BlockchainValue
                label="Client cancellation"
                value={String(
                  blockchain?.clientCancellationRequested ??
                  false,
                )}
              />

              <BlockchainValue
                label="Freelancer cancellation"
                value={String(
                  blockchain?.freelancerCancellationRequested ??
                  false,
                )}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </ProjectPage>
  );
}

/* ============================================================ */
/* HELPERS */
/* ============================================================ */

function ProjectPage({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-muted/30 text-foreground">
      <div className="container mx-auto max-w-6xl px-4 py-8 md:py-12">
        {children}
      </div>
    </main>
  );
}

function ProjectMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

function ProjectStatusBadge({
  status,
}: {
  status: string;
}) {
  const variant =
    status === "completed"
      ? "default"
      : status === "cancelled"
        ? "destructive"
        : "secondary";

  return <Badge variant={variant}>{status.replace("_", " ")}</Badge>;
}

function BlockchainBadge({
  funded,
  cancelled,
}: {
  funded?: boolean;
  cancelled?: boolean;
}) {
  if (cancelled) {
    return <Badge variant="destructive">Cancelled</Badge>;
  }

  if (funded) {
    return <Badge>Funded</Badge>;
  }

  return <Badge variant="secondary">Awaiting funding</Badge>;
}

function BlockchainValue({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs font-medium text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 break-all font-mono text-xs">
        {value ?? "—"}
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <p className="text-sm text-muted-foreground">
      Loading...
    </p>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center">
      <p className="text-sm text-muted-foreground">
        {message}
      </p>
    </div>
  );
}

function formatAmount(amount: number | null) {
  if (amount === null) return "—";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "ETH",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(new Date(date));
}
