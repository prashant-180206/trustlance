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
        // 1. Create project in Supabase
        // --------------------------------------------------------

        const {
            data: project,
            error,
        } = await supabase
            .from("projects")
            .insert({
                company_id: companyId,
                ...projectData,
                status: "open",
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        // --------------------------------------------------------
        // 2. Create blockchain escrow
        // --------------------------------------------------------

        try {

            const escrowAddress =
                await blockchainService.createEscrow();

            // ----------------------------------------------------
            // 3. Save escrow address
            // ----------------------------------------------------

            const {
                data: updatedProject,
                error: updateError,
            } = await supabase
                .from("projects")
                .update({
                    escrow_address: escrowAddress,
                })
                .eq("id", project.id)
                .select()
                .single();

            if (updateError) {
                throw updateError;
            }

            return updatedProject;

        } catch (error) {

            // ----------------------------------------------------
            // Blockchain creation failed.
            //
            // The Supabase project already exists, so don't delete
            // it silently. Mark it so the UI can handle recovery.
            // ----------------------------------------------------

            await supabase
                .from("projects")
                .update({
                    status: "cancelled",
                })
                .eq("id", project.id);

            throw error;
        }
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


    async getProjectById(
        projectId: string,
    ): Promise<Project> {

        const {
            data,
            error,
        } = await supabase
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