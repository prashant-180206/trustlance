import { supabase } from "../supabase/client";
import type { Tables } from "../supabase/types";

type Profile = Tables<"profiles">;
type FreelancerProfile = Tables<"freelancer_profiles">;
type CompanyProfile = Tables<"company_profiles">;

export type FreelancerProfileResult = Profile & FreelancerProfile;
export type CompanyProfileResult = Profile & CompanyProfile;

export class ProfileService {
  // ============================================================
  // FREELANCER
  // ============================================================

  async getFreelancerProfile(
    profileId: string,
  ): Promise<FreelancerProfileResult> {
    const { data, error } = await supabase
      .from("freelancer_profiles")
      .select(`
        *,
        profiles!inner(*)
      `)
      .eq("profile_id", profileId)
      .single();

    if (error) throw error;

    const { profiles, ...freelancer } = data;

    return {
      ...profiles,
      ...freelancer,
    };
  }

  async updateFreelancerProfile(
    profileId: string,
    updates: Partial<FreelancerProfile>,
  ): Promise<FreelancerProfileResult> {
    const { data, error } = await supabase
      .from("freelancer_profiles")
      .upsert({
        profile_id: profileId,
        ...updates,
      })
      .select(`
        *,
        profiles!inner(*)
      `)
      .single();

    if (error) throw error;

    const { profiles, ...freelancer } = data;

    return {
      ...profiles,
      ...freelancer,
    };
  }

  // ============================================================
  // COMPANY
  // ============================================================

  async getCompanyProfile(
    profileId: string,
  ): Promise<CompanyProfileResult> {
    const { data, error } = await supabase
      .from("company_profiles")
      .select(`
        *,
        profiles!inner(*)
      `)
      .eq("profile_id", profileId)
      .single();

    if (error) throw error;

    const { profiles, ...company } = data;

    return {
      ...profiles,
      ...company,
    };
  }

  async updateCompanyProfile(
    profileId: string,
    updates: Pick<
      CompanyProfile,
      "company_name"
    > &
      Partial<Omit<CompanyProfile, "company_name">>,
  ): Promise<CompanyProfileResult> {
    const { data, error } = await supabase
      .from("company_profiles")
      .upsert({
        profile_id: profileId,
        ...updates,
      })
      .select(`
        *,
        profiles!inner(*)
      `)
      .single();

    if (error) throw error;

    const { profiles, ...company } = data;

    return {
      ...profiles,
      ...company,
    };
  }
}

export const profileService = new ProfileService();