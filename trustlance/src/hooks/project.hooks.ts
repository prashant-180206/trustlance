import {
    useMutation,
    useQuery,
    useQueryClient,
    type UseMutationResult,
    type UseQueryResult,
} from "@tanstack/react-query";

import type { Address, Hash } from "viem";

import {
    projectService,
    type CreateProjectData,
    type FundProjectData,
} from "../lib/services/project.service";

import type { Tables } from "../lib/supabase/types";

type Project = Tables<"projects">;


// ============================================================
// QUERY KEYS
// ============================================================

export const projectKeys = {
    all: ["projects"] as const,
    
    lists: () =>
        [...projectKeys.all, "list"] as const,

    list: () =>
        [...projectKeys.lists()] as const,

    detail: (projectId: string) =>
        [...projectKeys.all, "detail", projectId] as const,

    company: (companyId: string) =>
        [...projectKeys.all, "company", companyId] as const,

    escrow: (projectId: string) =>
        [...projectKeys.all, "escrow", projectId] as const,

    blockchainStatus: (projectId: string) =>
        [
            ...projectKeys.all,
            "blockchain-status",
            projectId,
        ] as const,
};


// ============================================================
// PROJECT QUERIES
// ============================================================

export function useProjects(): UseQueryResult<
    Project[],
    Error
> {
    return useQuery({
        queryKey: projectKeys.list(),

        queryFn: () =>
            projectService.getAllProjects(),
    });
}


export function useProject(
    projectId: string,
): UseQueryResult<Project, Error> {
    return useQuery({
        queryKey: projectKeys.detail(projectId),

        queryFn: () =>
            projectService.getProjectById(
                projectId,
            ),

        enabled: !!projectId,
    });
}


export function useCompanyProjects(
    companyId: string,
): UseQueryResult<Project[], Error> {
    return useQuery({
        queryKey: projectKeys.company(companyId),

        queryFn: () =>
            projectService.getCompanyProjects(
                companyId,
            ),

        enabled: !!companyId,
    });
}


export function useProjectEscrow(
    projectId: string,
): UseQueryResult<Address, Error> {
    return useQuery({
        queryKey: projectKeys.escrow(projectId),

        queryFn: () =>
            projectService.getProjectEscrow(
                projectId,
            ),

        enabled: !!projectId,
    });
}


export function useProjectBlockchainStatus(
    projectId: string,
): UseQueryResult<
    Awaited<
        ReturnType<
            typeof projectService.getProjectBlockchainStatus
        >
    >,
    Error
> {
    return useQuery({
        queryKey:
            projectKeys.blockchainStatus(projectId),

        queryFn: () =>
            projectService.getProjectBlockchainStatus(
                projectId,
            ),

        enabled: !!projectId,
    });
}


// ============================================================
// CREATE PROJECT
// ============================================================

export type CreateProjectVariables = {
    companyId: string;
    projectData: CreateProjectData;
};


export function useCreateProject(): UseMutationResult<
    Project,
    Error,
    CreateProjectVariables
> {
    const queryClient =
        useQueryClient();

    return useMutation({
        mutationFn: ({
            companyId,
            projectData,
        }) =>
            projectService.createProject(
                companyId,
                projectData,
            ),

        onSuccess: (project) => {
            queryClient.invalidateQueries({
                queryKey: projectKeys.lists(),
            });

            queryClient.invalidateQueries({
                queryKey: projectKeys.company(
                    project.company_id,
                ),
            });

            queryClient.setQueryData(
                projectKeys.detail(project.id),
                project,
            );
        },
    });
}


// ============================================================
// FUND PROJECT
// ============================================================

export type FundProjectVariables = {
    projectId: string;
    freelancerWallet: Address;
    milestoneData: FundProjectData;
};


export type FundProjectResult =
    Awaited<
        ReturnType<
            typeof projectService.fundProject
        >
    >;


export function useFundProject(): UseMutationResult<
    FundProjectResult,
    Error,
    FundProjectVariables
> {
    const queryClient =
        useQueryClient();

    return useMutation({
        mutationFn: ({
            projectId,
            freelancerWallet,
            milestoneData,
        }) =>
            projectService.fundProject(
                projectId,
                freelancerWallet,
                milestoneData,
            ),

        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: projectKeys.detail(
                    variables.projectId,
                ),
            });

            queryClient.invalidateQueries({
                queryKey: projectKeys.escrow(
                    variables.projectId,
                ),
            });

            queryClient.invalidateQueries({
                queryKey:
                    projectKeys.blockchainStatus(
                        variables.projectId,
                    ),
            });
        },
    });
}


// ============================================================
// REQUEST CANCELLATION
// ============================================================

export type RequestCancellationVariables = {
    projectId: string;
};


export function useRequestCancellation(): UseMutationResult<
    Hash,
    Error,
    RequestCancellationVariables
> {
    const queryClient =
        useQueryClient();

    return useMutation({
        mutationFn: ({
            projectId,
        }) =>
            projectService.requestCancellation(
                projectId,
            ),

        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey:
                    projectKeys.blockchainStatus(
                        variables.projectId,
                    ),
            });
        },
    });
}


// ============================================================
// CANCEL PROJECT BEFORE AWARD
// ============================================================

export type CancelProjectBeforeAwardVariables = {
    projectId: string;
};


export function useCancelProjectBeforeAward(): UseMutationResult<
    Hash,
    Error,
    CancelProjectBeforeAwardVariables
> {
    const queryClient =
        useQueryClient();

    return useMutation({
        mutationFn: ({
            projectId,
        }) =>
            projectService.cancelProjectBeforeAward(
                projectId,
            ),

        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: projectKeys.detail(
                    variables.projectId,
                ),
            });

            queryClient.invalidateQueries({
                queryKey: projectKeys.lists(),
            });

            queryClient.invalidateQueries({
                queryKey:
                    projectKeys.blockchainStatus(
                        variables.projectId,
                    ),
            });
        },
    });
}