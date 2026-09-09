// types/domain.ts

export type ProjectStatus = 'draft' | 'open' | 'awarded' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
export type MilestoneStatus = 'pending' | 'submitted' | 'approved' | 'rejected' | 'disputed' | 'paid';
export type ProposalStatus = 'submitted' | 'accepted' | 'rejected' | 'withdrawn';
export type DisputeStatus = 'open' | 'voting' | 'resolved_client' | 'resolved_freelancer';

export interface Profile {
    id: string;
    walletAddress: string;
    role: 'client' | 'freelancer' | 'admin';
    displayName: string | null;
    bio: string | null;
    avatarCid: string | null;
    didVerified: boolean;
    skills: string[];
    isSuspended: boolean;
}

export interface Milestone {
    id: string;
    projectId: string;
    orderIndex: number;
    description: string;
    deliverableExpectation: string | null;
    amount: string;               // stored as string to preserve precision (numeric(38,18))
    status: MilestoneStatus;
    deliverableCid: string | null;
    submittedAt: string | null;
    approvedAt: string | null;
}

export interface Project {
    id: string;
    clientId: string;
    title: string;
    description: string;
    category: string;
    skills: string[];
    budgetAmount: string;
    budgetToken: string;
    deadline: string | null;
    status: ProjectStatus;
    contractAddress: string | null;
    awardedFreelancerId: string | null;
    milestones?: Milestone[];     // populated on detail fetch
}

export interface Proposal {
    id: string;
    projectId: string;
    freelancerId: string;
    coverMessage: string;
    proposedTimeline: string | null;
    proposedAmount: string | null;
    status: ProposalStatus;
}

export interface Dispute {
    id: string;
    milestoneId: string;
    raisedBy: string;
    reason: string;
    status: DisputeStatus;
    votingStart: string | null;
    votingEnd: string | null;
    votesForClient: number;
    votesForFreelancer: number;
    resolutionTxHash: string | null;
}
