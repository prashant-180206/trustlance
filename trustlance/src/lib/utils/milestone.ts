import type { MilestoneService } from "../services/milestone.service";

export const MilestoneStatus = {
  Pending: 0,
  Submitted: 1,
  Approved: 2,
  Rejected: 3,
  Disputed: 4,
  Paid: 5,
  Refunded: 6,
} as const;

export type MilestoneStatus =
  (typeof MilestoneStatus)[keyof typeof MilestoneStatus];

export type Milestone = {
  description: string;
  amount: bigint;
  status: MilestoneStatus;
  deliverableCID: string;
  submittedAt: bigint;
  reviewDeadline: bigint;
  disputeDeadline: bigint;
};

export type MilestoneTuple = Awaited<
  ReturnType<MilestoneService["get"]>
>;

export function mapMilestone(
  milestone: MilestoneTuple,
): Milestone {
  return {
    description: milestone[0],
    amount: milestone[1],
    status: milestone[2] as MilestoneStatus,
    deliverableCID: milestone[3],
    submittedAt: milestone[4],
    reviewDeadline: milestone[5],
    disputeDeadline: milestone[6],
  };
}

export function mapMilestones(
  milestones: MilestoneTuple[],
): Milestone[] {
  return milestones.map(mapMilestone);
}

export function getMilestoneStatusLabel(
  status: MilestoneStatus,
): string {
  return (
    Object.entries(MilestoneStatus).find(([, value]) => value === status)?.[0] ??
    "Unknown"
  );
}