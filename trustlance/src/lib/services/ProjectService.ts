import { supabase } from "../supabase/client";
import type { Tables } from "../supabase/types";

type Project = Tables<"projects">;
type Application = Tables<"applications">;

export class ProjectService {
  async createProject(companyId: string, projectData: {
    title: string;
    description: string;
    budget: number;
    deadline?: string;
  }): Promise<Project> {
    const { data, error } = await supabase
      .from("projects")
      .insert({
        company_id: companyId,
        ...projectData,
        status: "open",
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getAllProjects(): Promise<Project[]> {
    const { data, error } = await supabase
      .from("projects")
      .select("*, company_profiles(company_name)")
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getProjectById(projectId: string): Promise<Project> {
    const { data, error } = await supabase
      .from("projects")
      .select("*, company_profiles(company_name)")
      .eq("id", projectId)
      .single();

    if (error) throw error;
    return data;
  }

  async getCompanyProjects(companyId: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getFreelancerApplications(freelancerId: string): Promise<Application[]> {
    const { data, error } = await supabase
      .from("applications")
      .select("*, projects(title, budget)")
      .eq("freelancer_id", freelancerId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getProjectApplications(projectId: string): Promise<Application[]> {
    const { data, error } = await supabase
      .from("applications")
      .select("*, freelancer_profiles(headline, bio)")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getApplicationsForCompany(companyId: string): Promise<Application[]> {
    const { data, error } = await supabase
      .from("applications")
      .select("*, projects!inner(company_id, title), freelancer_profiles(headline)")
      .eq("projects.company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async applyToProject(projectId: string, freelancerId: string, proposal: string, proposedAmount: number): Promise<Application> {
    const { data, error } = await supabase
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

    if (error) throw error;
    return data;
  }

  async updateApplicationStatus(applicationId: string, status: Application["status"]): Promise<Application> {
    const { data, error } = await supabase
      .from("applications")
      .update({ status })
      .eq("id", applicationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export const projectService = new ProjectService();
