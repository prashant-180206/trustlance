import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";

import { profileService } from "../lib/services/profile.service";

import type {
  FreelancerProfileResult,
  CompanyProfileResult,
} from "../lib/services/profile.service";

import type { Tables } from "../lib/supabase/types";

type FreelancerProfile =
  Tables<"freelancer_profiles">;

type CompanyProfile =
  Tables<"company_profiles">;


// ============================================================
// TYPES
// ============================================================

export type UpdateFreelancerProfileVariables = {
  profileId: string;
  updates: Partial<FreelancerProfile>;
};

export type UpdateCompanyProfileVariables = {
  profileId: string;
  updates:
    Pick<CompanyProfile, "company_name"> &
    Partial<
      Omit<CompanyProfile, "company_name">
    >;
};


// ============================================================
// FREELANCER — GET
// ============================================================

export function useFreelancerProfile(
  profileId: string,
): UseQueryResult<FreelancerProfileResult, Error> {
  return useQuery({
    queryKey: ["freelancer-profile", profileId],

    queryFn: () =>
      profileService.getFreelancerProfile(
        profileId,
      ),

    enabled: !!profileId,
  });
}


// ============================================================
// COMPANY — GET
// ============================================================

export function useCompanyProfile(
  profileId: string,
): UseQueryResult<CompanyProfileResult, Error> {
  return useQuery({
    queryKey: ["company-profile", profileId],

    queryFn: () =>
      profileService.getCompanyProfile(
        profileId,
      ),

    enabled: !!profileId,
  });
}


// ============================================================
// FREELANCER — UPDATE
// ============================================================

export function useUpdateFreelancerProfile(): UseMutationResult<
  FreelancerProfileResult,
  Error,
  UpdateFreelancerProfileVariables
> {
  return useMutation({
    mutationFn: ({
      profileId,
      updates,
    }) =>
      profileService.updateFreelancerProfile(
        profileId,
        updates,
      ),
  });
}


// ============================================================
// COMPANY — UPDATE
// ============================================================

export function useUpdateCompanyProfile(): UseMutationResult<
  CompanyProfileResult,
  Error,
  UpdateCompanyProfileVariables
> {
  return useMutation({
    mutationFn: ({
      profileId,
      updates,
    }) =>
      profileService.updateCompanyProfile(
        profileId,
        updates,
      ),
  });
}