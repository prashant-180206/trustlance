import {
    useMutation,
    useQuery,
    useQueryClient,
    type UseMutationResult,
    type UseQueryResult,
} from "@tanstack/react-query";

import type { Address, Hash } from "viem";

import { MilestoneService } from "../lib/services/milestone.service";


// ============================================================
// QUERY KEYS
// ============================================================

export const milestoneKeys = {
    all: ["milestones"] as const,

    count: (projectAddress: Address) =>
        [
            ...milestoneKeys.all,
            "count",
            projectAddress,
        ] as const,

    list: (projectAddress: Address) =>
        [
            ...milestoneKeys.all,
            "list",
            projectAddress,
        ] as const,

    detail: (
        projectAddress: Address,
        index: bigint,
    ) =>
        [
            ...milestoneKeys.all,
            "detail",
            projectAddress,
            index.toString(),
        ] as const,
};


// ============================================================
// HELPERS
// ============================================================

function getMilestoneService(
    projectAddress: Address,
): MilestoneService {
    return new MilestoneService(projectAddress);
}


// ============================================================
// GET MILESTONE COUNT
// ============================================================

export function useMilestoneCount(
    projectAddress: Address | undefined,
): UseQueryResult<bigint, Error> {
    return useQuery({
        queryKey: projectAddress
            ? milestoneKeys.count(projectAddress)
            : [...milestoneKeys.all, "count", null],

        queryFn: () => {
            if (!projectAddress) {
                throw new Error(
                    "Project address is required",
                );
            }

            return getMilestoneService(
                projectAddress,
            ).getCount();
        },

        enabled: !!projectAddress,
    });
}


// ============================================================
// GET SINGLE MILESTONE
// ============================================================

export function useMilestone(
    projectAddress: Address | undefined,
    index: bigint | undefined,
): UseQueryResult<
    Awaited<
        ReturnType<MilestoneService["get"]>
    >,
    Error
> {
    return useQuery({
        queryKey:
            projectAddress !== undefined &&
            index !== undefined
                ? milestoneKeys.detail(
                      projectAddress,
                      index,
                  )
                : [
                      ...milestoneKeys.all,
                      "detail",
                      null,
                      null,
                  ],

        queryFn: () => {
            if (
                !projectAddress ||
                index === undefined
            ) {
                throw new Error(
                    "Project address and milestone index are required",
                );
            }

            return getMilestoneService(
                projectAddress,
            ).get(index);
        },

        enabled:
            !!projectAddress &&
            index !== undefined,
    });
}


// ============================================================
// GET ALL MILESTONES
// ============================================================

export function useMilestones(
    projectAddress: Address | undefined,
): UseQueryResult<
    Awaited<
        ReturnType<MilestoneService["getAll"]>
    >,
    Error
> {
    return useQuery({
        queryKey: projectAddress
            ? milestoneKeys.list(projectAddress)
            : [...milestoneKeys.all, "list", null],

        queryFn: () => {
            if (!projectAddress) {
                throw new Error(
                    "Project address is required",
                );
            }

            return getMilestoneService(
                projectAddress,
            ).getAll();
        },

        enabled: !!projectAddress,
    });
}


// ============================================================
// SUBMIT MILESTONE
// ============================================================

export type SubmitMilestoneVariables = {
    projectAddress: Address;
    index: bigint;
    cid: string;
};

export function useSubmitMilestone(): UseMutationResult<
    Hash,
    Error,
    SubmitMilestoneVariables
> {
    const queryClient =
        useQueryClient();

    return useMutation({
        mutationFn: ({
            projectAddress,
            index,
            cid,
        }) =>
            getMilestoneService(
                projectAddress,
            ).submit(index, cid),

        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey:
                    milestoneKeys.list(
                        variables.projectAddress,
                    ),
            });

            queryClient.invalidateQueries({
                queryKey:
                    milestoneKeys.detail(
                        variables.projectAddress,
                        variables.index,
                    ),
            });
        },
    });
}


// ============================================================
// APPROVE MILESTONE
// ============================================================

export type MilestoneActionVariables = {
    projectAddress: Address;
    index: bigint;
};

export function useApproveMilestone(): UseMutationResult<
    Hash,
    Error,
    MilestoneActionVariables
> {
    const queryClient =
        useQueryClient();

    return useMutation({
        mutationFn: ({
            projectAddress,
            index,
        }) =>
            getMilestoneService(
                projectAddress,
            ).approve(index),

        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey:
                    milestoneKeys.list(
                        variables.projectAddress,
                    ),
            });

            queryClient.invalidateQueries({
                queryKey:
                    milestoneKeys.detail(
                        variables.projectAddress,
                        variables.index,
                    ),
            });
        },
    });
}


// ============================================================
// AUTO APPROVE MILESTONE
// ============================================================

export function useAutoApproveMilestone(): UseMutationResult<
    Hash,
    Error,
    MilestoneActionVariables
> {
    const queryClient =
        useQueryClient();

    return useMutation({
        mutationFn: ({
            projectAddress,
            index,
        }) =>
            getMilestoneService(
                projectAddress,
            ).autoApprove(index),

        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey:
                    milestoneKeys.list(
                        variables.projectAddress,
                    ),
            });

            queryClient.invalidateQueries({
                queryKey:
                    milestoneKeys.detail(
                        variables.projectAddress,
                        variables.index,
                    ),
            });
        },
    });
}


// ============================================================
// REJECT MILESTONE
// ============================================================

export function useRejectMilestone(): UseMutationResult<
    Hash,
    Error,
    MilestoneActionVariables
> {
    const queryClient =
        useQueryClient();

    return useMutation({
        mutationFn: ({
            projectAddress,
            index,
        }) =>
            getMilestoneService(
                projectAddress,
            ).reject(index),

        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey:
                    milestoneKeys.list(
                        variables.projectAddress,
                    ),
            });

            queryClient.invalidateQueries({
                queryKey:
                    milestoneKeys.detail(
                        variables.projectAddress,
                        variables.index,
                    ),
            });
        },
    });
}


// ============================================================
// RAISE DISPUTE
// ============================================================

export function useRaiseDispute(): UseMutationResult<
    Hash,
    Error,
    MilestoneActionVariables
> {
    const queryClient =
        useQueryClient();

    return useMutation({
        mutationFn: ({
            projectAddress,
            index,
        }) =>
            getMilestoneService(
                projectAddress,
            ).raiseDispute(index),

        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey:
                    milestoneKeys.list(
                        variables.projectAddress,
                    ),
            });

            queryClient.invalidateQueries({
                queryKey:
                    milestoneKeys.detail(
                        variables.projectAddress,
                        variables.index,
                    ),
            });
        },
    });
}


// ============================================================
// WITHDRAW REJECTION
// ============================================================

export function useWithdrawRejection(): UseMutationResult<
    Hash,
    Error,
    MilestoneActionVariables
> {
    const queryClient =
        useQueryClient();

    return useMutation({
        mutationFn: ({
            projectAddress,
            index,
        }) =>
            getMilestoneService(
                projectAddress,
            ).withdrawRejection(index),

        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey:
                    milestoneKeys.list(
                        variables.projectAddress,
                    ),
            });

            queryClient.invalidateQueries({
                queryKey:
                    milestoneKeys.detail(
                        variables.projectAddress,
                        variables.index,
                    ),
            });
        },
    });
}


// ============================================================
// ACCEPT REJECTION
// ============================================================

export function useAcceptRejection(): UseMutationResult<
    Hash,
    Error,
    MilestoneActionVariables
> {
    const queryClient =
        useQueryClient();

    return useMutation({
        mutationFn: ({
            projectAddress,
            index,
        }) =>
            getMilestoneService(
                projectAddress,
            ).acceptRejection(index),

        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey:
                    milestoneKeys.list(
                        variables.projectAddress,
                    ),
            });

            queryClient.invalidateQueries({
                queryKey:
                    milestoneKeys.detail(
                        variables.projectAddress,
                        variables.index,
                    ),
            });
        },
    });
}


// ============================================================
// AUTO RESOLVE DISPUTE
// ============================================================

export function useAutoResolveDispute(): UseMutationResult<
    Hash,
    Error,
    MilestoneActionVariables
> {
    const queryClient =
        useQueryClient();

    return useMutation({
        mutationFn: ({
            projectAddress,
            index,
        }) =>
            getMilestoneService(
                projectAddress,
            ).autoResolveDispute(index),

        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey:
                    milestoneKeys.list(
                        variables.projectAddress,
                    ),
            });

            queryClient.invalidateQueries({
                queryKey:
                    milestoneKeys.detail(
                        variables.projectAddress,
                        variables.index,
                    ),
            });
        },
    });
}