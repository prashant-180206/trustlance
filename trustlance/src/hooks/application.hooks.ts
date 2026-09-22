import {
    useMutation,
    useQuery,
    useQueryClient,
    type UseMutationResult,
    type UseQueryResult,
} from "@tanstack/react-query";

import {
    applicationService,
} from "../lib/services/application.service";

import type { Tables } from "../lib/supabase/types";

type Application = Tables<"applications">;

export type FreelancerApplication = Application & {
    projects: {
        title: string;
        budget: number | null;
    } | null;
};

// ============================================================
// QUERY KEYS
// ============================================================

export const applicationKeys = {
    all: ["applications"] as const,

    freelancer: (freelancerId: string) =>
        [...applicationKeys.all, "freelancer", freelancerId] as const,

    project: (projectId: string) =>
        [...applicationKeys.all, "project", projectId] as const,

    company: (companyId: string) =>
        [...applicationKeys.all, "company", companyId] as const,
};


// ============================================================
// GET FREELANCER APPLICATIONS
// ============================================================

export function useFreelancerApplications(
    freelancerId: string,
): UseQueryResult<FreelancerApplication[], Error> {
    return useQuery({
        queryKey: applicationKeys.freelancer(freelancerId),

        queryFn: () =>
            applicationService.getFreelancerApplications(freelancerId),

        enabled: !!freelancerId,
    });
}


// ============================================================
// GET PROJECT APPLICATIONS
// ============================================================

export function useProjectApplications(
    projectId: string,
): UseQueryResult<Application[], Error> {
    return useQuery({
        queryKey:
            applicationKeys.project(
                projectId,
            ),

        queryFn: () =>
            applicationService
                .getProjectApplications(
                    projectId,
                ),

        enabled: !!projectId,
    });
}


// ============================================================
// GET COMPANY APPLICATIONS
// ============================================================

export type CompanyApplication = Application & {
    projects: {
        company_id: string;
        title: string;
        budget: number | null;
    } | null;

    freelancer_profiles: {
        headline: string | null;
    } | null;
};

export function useCompanyApplications(
    companyId: string,
): UseQueryResult<CompanyApplication[], Error> {
    return useQuery({
        queryKey: applicationKeys.company(companyId),

        queryFn: () =>
            applicationService.getApplicationsForCompany(
                companyId,
            ),

        enabled: !!companyId,
    });
}

// ============================================================
// APPLY TO PROJECT
// ============================================================

export type ApplyToProjectVariables = {
    projectId: string;
    freelancerId: string;
    proposal: string;
    proposedAmount: number;
};


export function useApplyToProject(): UseMutationResult<
    Application,
    Error,
    ApplyToProjectVariables
> {
    const queryClient =
        useQueryClient();

    return useMutation({
        mutationFn: ({
            projectId,
            freelancerId,
            proposal,
            proposedAmount,
        }) =>
            applicationService.applyToProject(
                projectId,
                freelancerId,
                proposal,
                proposedAmount,
            ),

        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey:
                    applicationKeys.freelancer(
                        variables.freelancerId,
                    ),
            });

            queryClient.invalidateQueries({
                queryKey:
                    applicationKeys.project(
                        variables.projectId,
                    ),
            });
        },
    });
}


// ============================================================
// UPDATE APPLICATION STATUS
// ============================================================

export type UpdateApplicationStatusVariables = {
    applicationId: string;
    status: Application["status"];

    // These are used to invalidate the relevant
    // application queries after the update.
    projectId?: string;
    freelancerId?: string;
    companyId?: string;
};


export function useUpdateApplicationStatus(): UseMutationResult<
    Application,
    Error,
    UpdateApplicationStatusVariables
> {
    const queryClient =
        useQueryClient();

    return useMutation({
        mutationFn: ({
            applicationId,
            status,
        }) =>
            applicationService
                .updateApplicationStatus(
                    applicationId,
                    status,
                ),

        onSuccess: (_, variables) => {
            if (variables.projectId) {
                queryClient.invalidateQueries({
                    queryKey:
                        applicationKeys.project(
                            variables.projectId,
                        ),
                });
            }

            if (variables.freelancerId) {
                queryClient.invalidateQueries({
                    queryKey:
                        applicationKeys.freelancer(
                            variables.freelancerId,
                        ),
                });
            }

            if (variables.companyId) {
                queryClient.invalidateQueries({
                    queryKey:
                        applicationKeys.company(
                            variables.companyId,
                        ),
                });
            }
        },
    });
}