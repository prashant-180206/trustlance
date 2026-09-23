import {
  createFileRoute,
  Link,
  useNavigate,
} from "@tanstack/react-router";

import { useMemo, useState } from "react";
import type { Address } from "viem";
import { parseEther } from "viem";

import {
  useFundProject,
  useProjectBlockchainStatus,
  useProjectFreelancer,
} from "../../../../../hooks/project.hooks";

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
import { Textarea } from "@/components/ui/textarea";


export const Route = createFileRoute(
  "/company/projects/$projectId/milestones/new",
)({
  component: NewMilestones,
});

type MilestoneDraft = {
  amount: string;
  description: string;
};

function NewMilestones() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();

  const fundProject = useFundProject();
  const blockchainQuery = useProjectBlockchainStatus(projectId);
  const freelancerQuery = useProjectFreelancer(projectId);

  const acceptedWallet =
    freelancerQuery.data?.freelancer_profiles?.profiles?.wallet_address ??
    "";

  const [freelancerWallet, setFreelancerWallet] =
    useState("");

  const [milestones, setMilestones] =
    useState<MilestoneDraft[]>([
      {
        amount: "",
        description: "",
      },
    ]);

  const [formError, setFormError] =
    useState<string | null>(null);

  const totalEth = useMemo(() => {
    return milestones.reduce((total, milestone) => {
      if (!milestone.amount) {
        return total;
      }

      try {
        return (
          total + Number(milestone.amount)
        );
      } catch {
        return total;
      }
    }, 0);
  }, [milestones]);

  const updateMilestone = (
    index: number,
    field: keyof MilestoneDraft,
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

  const addMilestone = () => {
    setMilestones((current) => [
      ...current,
      {
        amount: "",
        description: "",
      },
    ]);
  };

  const removeMilestone = (
    index: number,
  ) => {
    setMilestones((current) =>
      current.filter(
        (_, milestoneIndex) =>
          milestoneIndex !== index,
      ),
    );
  };

  const submit = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setFormError(null);

    const wallet = acceptedWallet || freelancerWallet.trim();

    if (
      !wallet.startsWith("0x") ||
      wallet.length !== 42
    ) {
      setFormError(
        "Enter a valid freelancer wallet address.",
      );
      return;
    }

    if (milestones.length === 0) {
      setFormError(
        "Add at least one milestone.",
      );
      return;
    }

    if (
      milestones.some(
        ({ amount, description }) =>
          !amount ||
          Number(amount) <= 0 ||
          !description.trim(),
      )
    ) {
      setFormError(
        "Every milestone needs a valid amount and description.",
      );
      return;
    }

    try {
      const amounts = milestones.map(
        ({ amount }) => parseEther(amount),
      );

      const descriptions = milestones.map(
        ({ description }) =>
          description.trim(),
      );

      fundProject.mutate(
        {
          projectId,
          freelancerWallet: wallet as Address,
          milestoneData: {
            amounts,
            descriptions,
          },
        },
        {
          onSuccess: () => {
            navigate({
              to: "/company/projects/$projectId/milestones",
              params: { projectId },
            });
          },
        },
      );
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Invalid milestone amount.",
      );
    }
  };

  return (

    <form
      onSubmit={submit}
      className="max-w-3xl space-y-6"
    >

      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          Define project milestones
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Set the freelancer, deliverables, and
          payment amounts before funding the project.
        </p>
      </div>

      {/* Freelancer */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Freelancer
          </CardTitle>

          <CardDescription>
            The wallet address that will receive
            this project.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="freelancer-wallet">
              Wallet address
            </Label>

            <Input
              id="freelancer-wallet"
              value={acceptedWallet || freelancerWallet}
              onChange={(event) =>
                setFreelancerWallet(
                  event.target.value,
                )
              }
              placeholder="0x..."
              className="font-mono"
              disabled={Boolean(acceptedWallet)}
            />

            <p className="text-xs text-muted-foreground">
              {acceptedWallet
                ? "Using the wallet from the accepted freelancer application."
                : "Accept a freelancer application before funding this project."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Milestones */}
      {blockchainQuery.data?.funded && (
        <Alert>
          <AlertDescription>
            This project has already been funded. Manage its existing milestones instead.
          </AlertDescription>
        </Alert>
      )}

      {blockchainQuery.data?.cancelled && (
        <Alert variant="destructive">
          <AlertDescription>
            This project has been cancelled and cannot be funded.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base">
                Payment milestones
              </CardTitle>

              <CardDescription>
                Define each deliverable and its
                payment.
              </CardDescription>
            </div>

            <Badge variant="secondary">
              {milestones.length}{" "}
              {milestones.length === 1
                ? "milestone"
                : "milestones"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {milestones.map(
            (milestone, index) => (
              <div
                key={index}
                className="rounded-lg border p-5"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Milestone {index + 1}
                    </p>

                    <p className="mt-1 font-medium">
                      Payment & deliverable
                    </p>
                  </div>

                  {milestones.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        removeMilestone(index)
                      }
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid gap-5">
                  <div className="space-y-2">
                    <Label
                      htmlFor={`amount-${index}`}
                    >
                      Payment amount
                    </Label>

                    <div className="relative">
                      <Input
                        id={`amount-${index}`}
                        type="number"
                        min="0"
                        step="0.0001"
                        value={milestone.amount}
                        onChange={(event) =>
                          updateMilestone(
                            index,
                            "amount",
                            event.target.value,
                          )
                        }
                        placeholder="0.5"
                        className="pr-14"
                      />

                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                        ETH
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor={`description-${index}`}
                    >
                      Deliverable
                    </Label>

                    <Textarea
                      id={`description-${index}`}
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
                      placeholder="Describe what the freelancer needs to deliver..."
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            ),
          )}

          <Button
            type="button"
            variant="outline"
            onClick={addMilestone}
            className="w-full"
          >
            + Add another milestone
          </Button>
        </CardContent>
      </Card>

      {/* Funding summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Funding summary
          </CardTitle>

          <CardDescription>
            Review the amount that will be funded
            into escrow.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Milestones
            </span>

            <span className="font-medium">
              {milestones.length}
            </span>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="font-medium">
              Total escrow
            </span>

            <span className="text-xl font-semibold">
              {totalEth.toLocaleString(
                undefined,
                {
                  maximumFractionDigits: 4,
                },
              )}{" "}
              ETH
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {formError && (
        <Alert variant="destructive">
          <AlertDescription>
            {formError}
          </AlertDescription>
        </Alert>
      )}

      {fundProject.error && (
        <Alert variant="destructive">
          <AlertDescription>
            {fundProject.error.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"

        >
          <Link
            to="/company/projects/$projectId/milestones"
            params={{ projectId }}
          >
            Cancel
          </Link>
        </Button>

        <Button
          type="submit"
          disabled={
            fundProject.isPending ||
            blockchainQuery.isLoading ||
            blockchainQuery.data?.funded ||
            blockchainQuery.data?.cancelled ||
            !acceptedWallet
          }
        >
          {fundProject.isPending
            ? "Funding project..."
            : "Fund & award project"}
        </Button>
      </div>
    </form>

  );
}