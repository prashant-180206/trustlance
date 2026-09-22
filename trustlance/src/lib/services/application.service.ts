import type { FreelancerApplication } from "@/hooks/application.hooks";
import { supabase } from "../supabase/client";
import type { Tables } from "../supabase/types";

type Application = Tables<"applications">;

export type CreateApplicationData = {
    projectId: string;
    freelancerId: string;
    proposal: string;
    proposedAmount: number;
};

export class ApplicationService {

    // ============================================================
    // APPLICATION CREATION
    // ============================================================

    async applyToProject(
        projectId: string,
        freelancerId: string,
        proposal: string,
        proposedAmount: number,
    ): Promise<Application> {

        const {
            data,
            error,
        } = await supabase
            .from("applications")
            .insert({
                project_id: projectId,
                freelancer_id: freelancerId,
                proposal,
                proposed_amount: proposedAmount,
                status: "pending",
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        return data;
    }


    // ============================================================
    // FREELANCER APPLICATIONS
    // ============================================================

    async getFreelancerApplications(
        freelancerId: string,
    ): Promise<FreelancerApplication[]> {
        const { data, error } = await supabase
            .from("applications")
            .select("*, projects(title, budget)")
            .eq("freelancer_id", freelancerId)
            .order("created_at", {
                ascending: false,
            });

        if (error) {
            throw error;
        }

        return data || [];
    }


    // ============================================================
    // PROJECT APPLICATIONS
    // ============================================================

    async getProjectApplications(
        projectId: string,
    ): Promise<Application[]> {

        const {
            data,
            error,
        } = await supabase
            .from("applications")
            .select(
                "*, freelancer_profiles(headline, bio)",
            )
            .eq("project_id", projectId)
            .order("created_at", {
                ascending: false,
            });

        if (error) {
            throw error;
        }

        return data || [];
    }


    // ============================================================
    // COMPANY APPLICATIONS
    // ============================================================

    async getApplicationsForCompany(
        companyId: string,
    ): Promise<Application[]> {

        const {
            data,
            error,
        } = await supabase
            .from("applications")

            .select(
                "*, projects!inner(company_id, title, budget), freelancer_profiles(headline)"
            )

            .eq("projects.company_id", companyId)
            .order("created_at", {
                ascending: false,
            });

        if (error) {
            throw error;
        }

        return data || [];
    }


    // ============================================================
    // APPLICATION STATUS
    // ============================================================

    async updateApplicationStatus(
        applicationId: string,
        status: Application["status"],
    ): Promise<Application> {
        if (status === "accepted") {
            const { data, error } = await supabase.rpc(
                "accept_application",
                {
                    p_application_id: applicationId,
                },
            );

            if (error) {
                throw error;
            }

            return data;
        }

        const {
            data,
            error,
        } = await supabase
            .from("applications")
            .update({
                status,
                updated_at: new Date().toISOString(),
            })
            .eq("id", applicationId)
            .select()
            .single();

        if (error) {
            throw error;
        }

        return data;
    }
}

export const applicationService =
    new ApplicationService();