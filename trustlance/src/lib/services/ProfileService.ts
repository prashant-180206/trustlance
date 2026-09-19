import { supabase } from "../supabase/client";
import type { Database } from "../supabase/types";

type FreelancerProfileUpdate =
    Database["public"]["Tables"]["freelancer_profiles"]["Update"];

type CompanyProfileUpdate =
    Database["public"]["Tables"]["company_profiles"]["Update"];

type ProfileUpdate =
    Database["public"]["Tables"]["profiles"]["Update"];

export class ProfileService {
    private async getAuthenticatedUser() {
        const {
            data: { user },
            error,
        } = await supabase.auth.getUser();

        if (error) {
            throw error;
        }

        if (!user) {
            throw new Error("User is not authenticated");
        }

        return user;
    }

    async getProfile() {
        const user = await this.getAuthenticatedUser();

        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

        if (error) {
            throw error;
        }

        return data;
    }

    async getFreelancerProfile() {
        const user = await this.getAuthenticatedUser();

        const { data, error } = await supabase
            .from("freelancer_profiles")
            .select("*")
            .eq("profile_id", user.id)
            .single();

        if (error) {
            throw error;
        }

        return data;
    }

    async getCompanyProfile() {
        const user = await this.getAuthenticatedUser();

        const { data, error } = await supabase
            .from("company_profiles")
            .select("*")
            .eq("profile_id", user.id)
            .single();

        if (error) {
            throw error;
        }

        return data;
    }

    async updateProfile(input: ProfileUpdate) {
        const user = await this.getAuthenticatedUser();

        const { data, error } = await supabase
            .from("profiles")
            .update(input)
            .eq("id", user.id)
            .select()
            .single();

        if (error) {
            throw error;
        }

        return data;
    }

    async updateFreelancerProfile(
        input: FreelancerProfileUpdate,
    ) {
        const user = await this.getAuthenticatedUser();

        const { data, error } = await supabase
            .from("freelancer_profiles")
            .update(input)
            .eq("profile_id", user.id)
            .select()
            .single();

        if (error) {
            throw error;
        }

        return data;
    }

    async updateCompanyProfile(
        input: CompanyProfileUpdate,
    ) {
        const user = await this.getAuthenticatedUser();

        const { data, error } = await supabase
            .from("company_profiles")
            .update(input)
            .eq("profile_id", user.id)
            .select()
            .single();

        if (error) {
            throw error;
        }

        return data;
    }
}

export const profileService = new ProfileService();