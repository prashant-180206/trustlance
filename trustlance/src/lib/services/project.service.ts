// src/services/project.service.ts

import type { Address, Hash } from "viem";

import { supabase } from "../supabase/client";
import type { Tables } from "../supabase/types";

import { blockchainService } from "./blockchain.service";

type Project = Tables<"projects">;

export type CreateProjectData = {
    title: string;
    description: string;
    budget: number;
    deadline?: string;
};

export type FundProjectData = {
    amounts: bigint[];
    descriptions: string[];
};

export class ProjectService {

    // ============================================================
    // PROJECTS
    // ============================================================

    async createProject(
        companyId: string,
        projectData: CreateProjectData,
    ): Promise<Project> {
        // --------------------------------------------------------
        // 1. Create blockchain escrow FIRST
        // --------------------------------------------------------
        let escrowAddress: Address;

        try {
            escrowAddress = await blockchainService.createEscrow();
        } catch (error) {
            // Blockchain failed → don't touch the database
            throw error;
        }

        // --------------------------------------------------------
        // 2. Blockchain succeeded → create project in Supabase
        // --------------------------------------------------------
        const {
            data: project,
            error,
        } = await supabase
            .from("projects")
            .insert({
                company_id: companyId,
                ...projectData,
                escrow_address: escrowAddress,
                status: "open",
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        return project;
    }


    async getAllProjects(): Promise<Project[]> {

        const {
            data,
            error,
        } = await supabase
            .from("projects")
            .select("*, company_profiles(company_name)")
            .eq("status", "open")
            .order("created_at", {
                ascending: false,
            });

        if (error) {
            throw error;
        }

        return data || [];
    }


    async getProjectById(projectId: string): Promise<Project> {
        const { data, error } = await supabase
            .from("projects")
            .select("*, company_profiles(company_name)")
            .eq("id", projectId)
            .single();

        if (error) {
            throw error;
        }

        return data;
    }


    async getCompanyProjects(
        companyId: string,
    ): Promise<Project[]> {

        const {
            data,
            error,
        } = await supabase
            .from("projects")
            .select("*")
            .eq("company_id", companyId)
            .order("created_at", {
                ascending: false,
            });

        if (error) {
            throw error;
        }

        return data || [];
    }

    // GET PROJECT FREELANCER
    async getProjectFreelancer(projectId: string) {
        const { data, error } = await supabase
            .from("applications")
            .select(`
            freelancer_id,
            freelancer_profiles!inner(
                profile_id,
                headline,
                profiles!inner(
                    wallet_address,
                    display_name,
                    avatar_url
                )
            )
        `)
            .eq("project_id", projectId)
            .eq("status", "accepted")
            .maybeSingle();

        if (error) {
            throw error;
        }

        return data;
    }


    // ============================================================
    // BLOCKCHAIN PROJECT
    // ============================================================

    async getProjectEscrow(
        projectId: string,
    ): Promise<Address> {

        const project =
            await this.getProjectById(projectId);

        if (!project.escrow_address) {
            throw new Error(
                "Project does not have a blockchain escrow",
            );
        }

        return project.escrow_address as Address;
    }


    async getProjectBlockchainStatus(
        projectId: string,
    ) {

        const escrowAddress =
            await this.getProjectEscrow(projectId);

        return blockchainService.getEscrowStatus(
            escrowAddress,
        );
    }


    // ============================================================
    // FUND PROJECT
    // ============================================================

    async fundProject(
        projectId: string,
        freelancerWallet: Address,
        milestoneData: FundProjectData,
    ): Promise<{
        fundTransaction: Hash;
        awardTransaction: Hash;
    }> {

        const escrowAddress =
            await this.getProjectEscrow(projectId);

        // --------------------------------------------------------
        // Verify the connected wallet is the escrow client
        // --------------------------------------------------------

        const connectedAddress =
            await blockchainService.getConnectedAddress();

        const escrowStatus =
            await blockchainService.getEscrowStatus(
                escrowAddress,
            );

        if (
            connectedAddress.toLowerCase() !==
            escrowStatus.client.toLowerCase()
        ) {
            throw new Error(
                "Connected wallet is not the escrow client",
            );
        }

        if (escrowStatus.funded) {
            throw new Error(
                "Escrow has already been funded",
            );
        }

        // --------------------------------------------------------
        // Calculate total ETH
        // --------------------------------------------------------

        const totalValue =
            milestoneData.amounts.reduce(
                (total, amount) => total + amount,
                0n,
            );

        if (totalValue <= 0n) {
            throw new Error(
                "Project funding amount must be greater than zero",
            );
        }

        // --------------------------------------------------------
        // 1. Fund escrow
        // --------------------------------------------------------

        const fundTransaction =
            await blockchainService.fundEscrow(
                escrowAddress,
                milestoneData.amounts,
                milestoneData.descriptions,
                totalValue,
            );

        // Wait until funding is confirmed before awarding.
        await blockchainService.waitForTransaction(
            fundTransaction,
        );

        // --------------------------------------------------------
        // 2. Award freelancer
        // --------------------------------------------------------

        const awardTransaction =
            await blockchainService.awardFreelancer(
                escrowAddress,
                freelancerWallet,
            );

        return {
            fundTransaction,
            awardTransaction,
        };
    }





    // ============================================================
    // CANCELLATION
    // ============================================================

    async requestCancellation(
        projectId: string,
    ): Promise<Hash> {

        const escrowAddress =
            await this.getProjectEscrow(projectId);

        return blockchainService.requestCancellation(
            escrowAddress,
        );
    }


    async cancelProjectBeforeAward(
        projectId: string,
    ): Promise<Hash> {

        const escrowAddress =
            await this.getProjectEscrow(projectId);

        return blockchainService.cancelProjectBeforeAward(
            escrowAddress,
        );
    }
}


export const projectService =
    new ProjectService();