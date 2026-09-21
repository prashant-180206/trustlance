// src/services/milestone.service.ts

import type { Address, Hash } from "viem";

import { blockchainService } from "./blockchain.service";

export class MilestoneService {

    private readonly projectAddress: Address;

    constructor(projectAddress: Address) {
        this.projectAddress = projectAddress;
    }

    // ============================================================
    // PROJECT / ESCROW
    // ============================================================

    getProjectAddress(): Address {
        return this.projectAddress;
    }


    // ============================================================
    // MILESTONE READS
    // ============================================================

    async getCount(): Promise<bigint> {
        return blockchainService.getMilestoneCount(
            this.projectAddress,
        );
    }


    async get(index: bigint) {
        return blockchainService.getMilestone(
            this.projectAddress,
            index,
        );
    }


    async getAll() {
        const count = await this.getCount();

        const milestones = [];

        for (let index = 0n; index < count; index++) {
            milestones.push(
                await this.get(index),
            );
        }

        return milestones;
    }


    // ============================================================
    // MILESTONE CREATION / FUNDING
    // ============================================================

    /**
     * Creates all milestones and funds the escrow.
     *
     * The escrow contract creates milestones inside fundEscrow().
     */
    async createAndFund(
        amounts: bigint[],
        descriptions: string[],
    ): Promise<Hash> {

        if (amounts.length === 0) {
            throw new Error(
                "At least one milestone is required",
            );
        }

        if (amounts.length !== descriptions.length) {
            throw new Error(
                "Amounts and descriptions must have the same length",
            );
        }

        const totalValue = amounts.reduce(
            (total, amount) => total + amount,
            0n,
        );

        if (totalValue <= 0n) {
            throw new Error(
                "Total milestone amount must be greater than zero",
            );
        }

        return blockchainService.fundEscrow(
            this.projectAddress,
            amounts,
            descriptions,
            totalValue,
        );
    }


    // ============================================================
    // SUBMISSION
    // ============================================================

    async submit(
        index: bigint,
        cid: string,
    ): Promise<Hash> {

        return blockchainService.submitMilestone(
            this.projectAddress,
            index,
            cid,
        );
    }


    // ============================================================
    // APPROVAL
    // ============================================================

    async approve(
        index: bigint,
    ): Promise<Hash> {

        return blockchainService.approveMilestone(
            this.projectAddress,
            index,
        );
    }


    async autoApprove(
        index: bigint,
    ): Promise<Hash> {

        return blockchainService.autoApproveMilestone(
            this.projectAddress,
            index,
        );
    }


    // ============================================================
    // REJECTION
    // ============================================================

    async reject(
        index: bigint,
    ): Promise<Hash> {

        return blockchainService.rejectMilestone(
            this.projectAddress,
            index,
        );
    }


    // ============================================================
    // DISPUTE
    // ============================================================

    async raiseDispute(
        index: bigint,
    ): Promise<Hash> {

        return blockchainService.raiseDispute(
            this.projectAddress,
            index,
        );
    }


    async withdrawRejection(
        index: bigint,
    ): Promise<Hash> {

        return blockchainService.withdrawRejection(
            this.projectAddress,
            index,
        );
    }


    async acceptRejection(
        index: bigint,
    ): Promise<Hash> {

        return blockchainService.acceptRejection(
            this.projectAddress,
            index,
        );
    }


    async autoResolveDispute(
        index: bigint,
    ): Promise<Hash> {

        return blockchainService.autoResolveDispute(
            this.projectAddress,
            index,
        );
    }
}