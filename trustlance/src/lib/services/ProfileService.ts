import { supabase } from "../supabase/client";
import type { Database, Tables } from "../supabase/types";

type Profile = Tables<"profiles">;
type FreelancerProfile = Tables<"freelancer_profiles">;
type CompanyProfile = Tables<"company_profiles">;

export class ProfileService {
  async getProfile(): Promise<Profile> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) throw error;
    return data;
  }

  async getFreelancerProfile(profileId: string): Promise<FreelancerProfile> {
    const { data, error } = await supabase
      .from("freelancer_profiles")
      .select("*")
      .eq("profile_id", profileId)
      .single();

    if (error) throw error;
    return data;
  }

  async updateFreelancerProfile(profileId: string, updates: Partial<FreelancerProfile>): Promise<FreelancerProfile> {
    const { data, error } = await supabase
      .from("freelancer_profiles")
      .upsert({ profile_id: profileId, ...updates })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getCompanyProfile(profileId: string): Promise<CompanyProfile> {
    const { data, error } = await supabase
      .from("company_profiles")
      .select("*")
      .eq("profile_id", profileId)
      .single();

    if (error) throw error;
    return data;
  }

  async updateCompanyProfile(
    profileId: string,
    updates: Pick<CompanyProfile, "company_name"> & Partial<Omit<CompanyProfile, "company_name" >>,
  ): Promise<CompanyProfile> {
    const { data, error } = await supabase
      .from("company_profiles")
      .upsert({ profile_id: profileId, ...updates })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export const profileService = new ProfileService();
