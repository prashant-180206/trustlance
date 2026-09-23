import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { useProjectEscrow } from "../../../../../hooks/project.hooks";
import {
    useAcceptRejection,
    useAutoApproveMilestone,
    useMilestone,
    useRaiseDispute,
    useSubmitMilestone,
} from "../../../../../hooks/milestone.hooks";

import {
    getMilestoneStatusLabel,
    mapMilestone,
    MilestoneStatus,
} from "../../../../../lib/utils/milestone";

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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute(
    "/freelancer/projects/$projectId/milestones/$milestoneId",
)({
    component: MilestoneDetail,
});

function formatEth(amount: bigint): string {
    return `${Number(amount) / 1e18} ETH`;
}

function formatTimestamp(timestamp: bigint): string {
    if (timestamp === 0n) {
        return "Not set";
    }

    return new Date(Number(timestamp) * 1000).toLocaleString(
        "en-IN",
    );
}

function getStatusVariant(
    status: MilestoneStatus,
): "default" | "secondary" | "destructive" | "outline" {
    switch (status) {
        case MilestoneStatus.Approved:
        case MilestoneStatus.Paid:
            return "default";

        case MilestoneStatus.Rejected:
        case MilestoneStatus.Disputed:
        case MilestoneStatus.Refunded:
            return "destructive";

        case MilestoneStatus.Submitted:
            return "secondary";

        default:
            return "outline";
    }
}

function MilestoneDetail() {
    const { projectId, milestoneId } = Route.useParams();

    const {
        data: projectAddress,
        isLoading: addressLoading,
        error: addressError,
    } = useProjectEscrow(projectId);

    const {
        data: milestoneTuple,
        isLoading: milestoneLoading,
        error: milestoneError,
    } = useMilestone(
        projectAddress,
        BigInt(milestoneId),
    );

    const submitMilestone = useSubmitMilestone();
    const autoApprove = useAutoApproveMilestone();
    const raiseDispute = useRaiseDispute();
    const acceptRejection = useAcceptRejection();

    const [cid, setCid] = useState("");

    const isLoading = addressLoading || milestoneLoading;

    if (isLoading) {
        return (

            <div className="space-y-6">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>

        );
    }

    if (addressError || milestoneError) {
        return (

            <Alert variant="destructive">
                <AlertDescription>
                    {addressError?.message ??
                        milestoneError?.message ??
                        "Failed to load milestone."}
                </AlertDescription>
            </Alert>

        );
    }

    if (!milestoneTuple) {
        return (

            <Alert variant="destructive">
                <AlertDescription>
                    Milestone not found.
                </AlertDescription>
            </Alert>

        );
    }

    const milestone = mapMilestone(milestoneTuple);

    const canSubmit =
        milestone.status === MilestoneStatus.Pending ||
        milestone.status === MilestoneStatus.Rejected;

    const handleSubmit = () => {
        if (!projectAddress || !cid.trim()) {
            return;
        }

        submitMilestone.mutate({
            projectAddress,
            index: BigInt(milestoneId),
            cid: cid.trim(),
        });
    };

    const runAction = (action: {
        mutate: (variables: {
            projectAddress: `0x${string}`;
            index: bigint;
        }) => void;
    }) => {
        if (!projectAddress) {
            return;
        }

        action.mutate({
            projectAddress,
            index: BigInt(milestoneId),
        });
    };

    const actionPending = [
        submitMilestone.isPending,
        autoApprove.isPending,
        raiseDispute.isPending,
        acceptRejection.isPending,
    ].some(Boolean);

    return (

        <div className="mx-auto max-w-3xl space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-sm text-muted-foreground">
                        Milestone #{milestoneId}
                    </p>

                    <h1 className="text-2xl font-semibold tracking-tight">
                        {milestone.description}
                    </h1>
                </div>

                <Badge
                    variant={getStatusVariant(
                        milestone.status,
                    )}
                >
                    {getMilestoneStatusLabel(
                        milestone.status,
                    )}
                </Badge>
            </div>

            {/* Overview */}
            <Card>
                <CardHeader>
                    <CardTitle>Milestone details</CardTitle>

                    <CardDescription>
                        Payment and timeline information for
                        this milestone.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <div className="grid gap-6 sm:grid-cols-2">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Payment amount
                            </p>

                            <p className="mt-1 text-lg font-semibold">
                                {formatEth(
                                    milestone.amount,
                                )}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">
                                Status
                            </p>

                            <div className="mt-1">
                                <Badge
                                    variant={getStatusVariant(
                                        milestone.status,
                                    )}
                                >
                                    {getMilestoneStatusLabel(
                                        milestone.status,
                                    )}
                                </Badge>
                            </div>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">
                                Submitted at
                            </p>

                            <p className="mt-1 text-sm font-medium">
                                {formatTimestamp(
                                    milestone.submittedAt,
                                )}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">
                                Review deadline
                            </p>

                            <p className="mt-1 text-sm font-medium">
                                {formatTimestamp(
                                    milestone.reviewDeadline,
                                )}
                            </p>
                        </div>

                        <div className="sm:col-span-2">
                            <p className="text-sm text-muted-foreground">
                                Dispute deadline
                            </p>

                            <p className="mt-1 text-sm font-medium">
                                {formatTimestamp(
                                    milestone.disputeDeadline,
                                )}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Existing deliverable */}
            {milestone.deliverableCID && (
                <Card>
                    <CardHeader>
                        <CardTitle>Submitted deliverable</CardTitle>

                        <CardDescription>
                            The IPFS content identifier currently
                            associated with this milestone.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <div className="rounded-md border bg-muted/50 p-4">
                            <p className="break-all font-mono text-xs">
                                {milestone.deliverableCID}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Submission */}
            {canSubmit && (
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {milestone.status ===
                                MilestoneStatus.Rejected
                                ? "Resubmit deliverable"
                                : "Submit deliverable"}
                        </CardTitle>

                        <CardDescription>
                            Submit the IPFS CID containing your
                            completed work.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="cid">
                                IPFS CID
                            </Label>

                            <Input
                                id="cid"
                                value={cid}
                                onChange={(event) =>
                                    setCid(event.target.value)
                                }
                                placeholder="Qm... or bafy..."
                                disabled={
                                    actionPending
                                }
                            />

                            <p className="text-xs text-muted-foreground">
                                Enter the CID of the content you
                                have uploaded to IPFS.
                            </p>
                        </div>

                        {submitMilestone.error && (
                            <Alert variant="destructive">
                                <AlertDescription>
                                    {
                                        submitMilestone.error
                                            .message
                                    }
                                </AlertDescription>
                            </Alert>
                        )}

                        {submitMilestone.isSuccess && (
                            <Alert>
                                <AlertDescription>
                                    Milestone submitted
                                    successfully.
                                </AlertDescription>
                            </Alert>
                        )}

                        <Separator />

                        <div className="flex justify-end">
                            <Button
                                onClick={handleSubmit}
                                disabled={
                                    !projectAddress ||
                                    !cid.trim() ||
                                    submitMilestone.isPending
                                }
                            >
                                {submitMilestone.isPending
                                    ? "Submitting..."
                                    : milestone.status ===
                                        MilestoneStatus.Rejected
                                        ? "Resubmit work"
                                        : "Submit work"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {milestone.status === MilestoneStatus.Submitted && (
                <Card>
                    <CardHeader>
                        <CardTitle>Review deadline</CardTitle>
                        <CardDescription>
                            Anyone can trigger automatic approval after the client review period ends.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            variant="secondary"
                            disabled={!projectAddress || actionPending}
                            onClick={() => runAction(autoApprove)}
                        >
                            {autoApprove.isPending ? "Approving..." : "Auto approve milestone"}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {milestone.status === MilestoneStatus.Rejected && (
                <Card>
                    <CardHeader>
                        <CardTitle>Rejection response</CardTitle>
                        <CardDescription>
                            Dispute the rejection if the deliverable should be paid.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            variant="outline"
                            disabled={!projectAddress || actionPending}
                            onClick={() => runAction(raiseDispute)}
                        >
                            {raiseDispute.isPending ? "Raising..." : "Raise dispute"}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {milestone.status === MilestoneStatus.Disputed && (
                <Card>
                    <CardHeader>
                        <CardTitle>Dispute response</CardTitle>
                        <CardDescription>
                            Accept the rejection and return this milestone's funds to the company.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            variant="destructive"
                            disabled={!projectAddress || actionPending}
                            onClick={() => runAction(acceptRejection)}
                        >
                            {acceptRejection.isPending ? "Accepting..." : "Accept rejection"}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {(autoApprove.error || raiseDispute.error || acceptRejection.error) && (
                <Alert variant="destructive">
                    <AlertDescription>
                        {autoApprove.error?.message ?? raiseDispute.error?.message ?? acceptRejection.error?.message}
                    </AlertDescription>
                </Alert>
            )}

            {/* Status messages */}
            {milestone.status ===
                MilestoneStatus.Submitted && (
                    <Alert>
                        <AlertDescription>
                            Your work has been submitted and is
                            waiting for company review.
                        </AlertDescription>
                    </Alert>
                )}

            {milestone.status ===
                MilestoneStatus.Approved && (
                    <Alert>
                        <AlertDescription>
                            This milestone has been approved.
                        </AlertDescription>
                    </Alert>
                )}

            {milestone.status ===
                MilestoneStatus.Paid && (
                    <Alert>
                        <AlertDescription>
                            Payment for this milestone has been
                            released.
                        </AlertDescription>
                    </Alert>
                )}

            {milestone.status ===
                MilestoneStatus.Disputed && (
                    <Alert variant="destructive">
                        <AlertDescription>
                            This milestone is currently under
                            dispute.
                        </AlertDescription>
                    </Alert>
                )}

            {milestone.status ===
                MilestoneStatus.Rejected && (
                    <Alert variant="destructive">
                        <AlertDescription>
                            This milestone was rejected. Review the
                            feedback and submit your work again.
                        </AlertDescription>
                    </Alert>
                )}
        </div>

    );
}