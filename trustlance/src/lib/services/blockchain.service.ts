// src/services/blockchain.service.ts

import type {
    Address,
    Hash,
} from "viem";

import {
    decodeEventLog,
} from "viem";

import {
    getWalletClient,
} from "wagmi/actions";

import {
    config,
    publicClient,
} from "../blockchain/wagmi";

import {
    FACTORY_ADDRESS,
} from "../blockchain/constants";

import {
    TrustLanceFactoryABI,
} from "../blockchain/abis/TrustLanceFactory";

import {
    TrustLanceEscrowABI,
} from "../blockchain/abis/TrustLanceEscrow";


export class BlockchainService {

    // ============================================================
    // WALLET
    // ============================================================

    private async getWalletClient() {
        const walletClient = await getWalletClient(config);

        if (!walletClient) {
            throw new Error("Wallet is not connected");
        }

        if (!walletClient.account) {
            throw new Error("No wallet account is connected");
        }

        return walletClient;
    }

    async getConnectedAddress(): Promise<Address> {
        const walletClient = await this.getWalletClient();

        return walletClient.account.address;
    }


    // ============================================================
    // TRANSACTION
    // ============================================================

    async waitForTransaction(
        hash: Hash,
    ) {
        return publicClient.waitForTransactionReceipt({
            hash,
        });
    }


    // ============================================================
    // FACTORY
    // ============================================================

    async createEscrow(): Promise<Address> {

        const walletClient = await this.getWalletClient();

        const hash = await walletClient.writeContract({
            address: FACTORY_ADDRESS,
            abi: TrustLanceFactoryABI,
            functionName: "createEscrow",
        });

        const receipt =
            await this.waitForTransaction(hash);

        for (const log of receipt.logs) {
            try {

                const parsed = decodeEventLog({
                    abi: TrustLanceFactoryABI,
                    data: log.data,
                    topics: log.topics,
                });

                if (parsed.eventName === "EscrowCreated") {
                    return parsed.args.escrow;
                }

            } catch {
                // Ignore logs belonging to other contracts/events.
            }
        }

        throw new Error(
            "EscrowCreated event not found in transaction receipt",
        );
    }


    async getEscrowCount(): Promise<bigint> {

        return publicClient.readContract({
            address: FACTORY_ADDRESS,
            abi: TrustLanceFactoryABI,
            functionName: "getEscrowCount",
        });
    }


    async getEscrow(
        index: bigint,
    ): Promise<Address> {

        return publicClient.readContract({
            address: FACTORY_ADDRESS,
            abi: TrustLanceFactoryABI,
            functionName: "getEscrow",
            args: [index],
        });
    }


    async getAllEscrows(): Promise<Address[]> {

        return [...(await publicClient.readContract({
            address: FACTORY_ADDRESS,
            abi: TrustLanceFactoryABI,
            functionName: "getAllEscrows",
        }))];
    }


    async getClientEscrows(
        client: Address,
    ): Promise<Address[]> {

        return [...(await publicClient.readContract({
            address: FACTORY_ADDRESS,
            abi: TrustLanceFactoryABI,
            functionName: "getClientEscrows",
            args: [client],
        }))];
    }


    async getMyEscrows(): Promise<Address[]> {

        const client =
            await this.getConnectedAddress();

        return this.getClientEscrows(client);
    }


    async getClientEscrowCount(
        client: Address,
    ): Promise<bigint> {

        return publicClient.readContract({
            address: FACTORY_ADDRESS,
            abi: TrustLanceFactoryABI,
            functionName: "getClientEscrowCount",
            args: [client],
        });
    }


    async getClientEscrow(
        client: Address,
        index: bigint,
    ): Promise<Address> {

        return publicClient.readContract({
            address: FACTORY_ADDRESS,
            abi: TrustLanceFactoryABI,
            functionName: "getClientEscrow",
            args: [client, index],
        });
    }


    async isEscrow(
        address: Address,
    ): Promise<boolean> {

        return publicClient.readContract({
            address: FACTORY_ADDRESS,
            abi: TrustLanceFactoryABI,
            functionName: "isEscrow",
            args: [address],
        });
    }


    // ============================================================
    // ESCROW — FUNDING
    // ============================================================

    async fundEscrow(
        escrowAddress: Address,
        amounts: bigint[],
        descriptions: string[],
        totalValue: bigint,
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

        const calculatedTotal =
            amounts.reduce(
                (sum, amount) => sum + amount,
                0n,
            );

        if (calculatedTotal !== totalValue) {
            throw new Error(
                "Total value does not equal milestone amounts",
            );
        }

        const walletClient =
            await this.getWalletClient();

        return walletClient.writeContract({
            address: escrowAddress,
            abi: TrustLanceEscrowABI,
            functionName: "fundEscrow",
            args: [
                amounts,
                descriptions,
            ],
            value: totalValue,
        });
    }


    // ============================================================
    // ESCROW — FREELANCER
    // ============================================================

    async awardFreelancer(
        escrowAddress: Address,
        freelancer: Address,
    ): Promise<Hash> {

        const walletClient =
            await this.getWalletClient();

        return walletClient.writeContract({
            address: escrowAddress,
            abi: TrustLanceEscrowABI,
            functionName: "awardFreelancer",
            args: [freelancer],
        });
    }


    // ============================================================
    // ESCROW — MILESTONE SUBMISSION
    // ============================================================

    async submitMilestone(
        escrowAddress: Address,
        index: bigint,
        cid: string,
    ): Promise<Hash> {

        if (!cid.trim()) {
            throw new Error("Deliverable CID cannot be empty");
        }

        const walletClient =
            await this.getWalletClient();

        return walletClient.writeContract({
            address: escrowAddress,
            abi: TrustLanceEscrowABI,
            functionName: "submitMilestone",
            args: [index, cid],
        });
    }


    // ============================================================
    // ESCROW — MILESTONE APPROVAL
    // ============================================================

    async approveMilestone(
        escrowAddress: Address,
        index: bigint,
    ): Promise<Hash> {

        const walletClient =
            await this.getWalletClient();

        return walletClient.writeContract({
            address: escrowAddress,
            abi: TrustLanceEscrowABI,
            functionName: "approveMilestone",
            args: [index],
        });
    }


    async autoApproveMilestone(
        escrowAddress: Address,
        index: bigint,
    ): Promise<Hash> {

        const walletClient =
            await this.getWalletClient();

        return walletClient.writeContract({
            address: escrowAddress,
            abi: TrustLanceEscrowABI,
            functionName: "autoApproveMilestone",
            args: [index],
        });
    }


    // ============================================================
    // ESCROW — MILESTONE REJECTION
    // ============================================================

    async rejectMilestone(
        escrowAddress: Address,
        index: bigint,
    ): Promise<Hash> {

        const walletClient =
            await this.getWalletClient();

        return walletClient.writeContract({
            address: escrowAddress,
            abi: TrustLanceEscrowABI,
            functionName: "rejectMilestone",
            args: [index],
        });
    }


    // ============================================================
    // ESCROW — DISPUTES
    // ============================================================

    async raiseDispute(
        escrowAddress: Address,
        index: bigint,
    ): Promise<Hash> {

        const walletClient =
            await this.getWalletClient();

        return walletClient.writeContract({
            address: escrowAddress,
            abi: TrustLanceEscrowABI,
            functionName: "raiseDispute",
            args: [index],
        });
    }


    async withdrawRejection(
        escrowAddress: Address,
        index: bigint,
    ): Promise<Hash> {

        const walletClient =
            await this.getWalletClient();

        return walletClient.writeContract({
            address: escrowAddress,
            abi: TrustLanceEscrowABI,
            functionName: "withdrawRejection",
            args: [index],
        });
    }


    async acceptRejection(
        escrowAddress: Address,
        index: bigint,
    ): Promise<Hash> {

        const walletClient =
            await this.getWalletClient();

        return walletClient.writeContract({
            address: escrowAddress,
            abi: TrustLanceEscrowABI,
            functionName: "acceptRejection",
            args: [index],
        });
    }


    async autoResolveDispute(
        escrowAddress: Address,
        index: bigint,
    ): Promise<Hash> {

        const walletClient =
            await this.getWalletClient();

        return walletClient.writeContract({
            address: escrowAddress,
            abi: TrustLanceEscrowABI,
            functionName: "autoResolveDispute",
            args: [index],
        });
    }


    // ============================================================
    // ESCROW — CANCELLATION
    // ============================================================

    async requestCancellation(
        escrowAddress: Address,
    ): Promise<Hash> {

        const walletClient =
            await this.getWalletClient();

        return walletClient.writeContract({
            address: escrowAddress,
            abi: TrustLanceEscrowABI,
            functionName: "requestCancellation",
        });
    }


    async cancelProjectBeforeAward(
        escrowAddress: Address,
    ): Promise<Hash> {

        const walletClient =
            await this.getWalletClient();

        return walletClient.writeContract({
            address: escrowAddress,
            abi: TrustLanceEscrowABI,
            functionName: "cancelProjectBeforeAward",
        });
    }


    // ============================================================
    // ESCROW — READS
    // ============================================================

    async getMilestoneCount(
        escrowAddress: Address,
    ): Promise<bigint> {

        return publicClient.readContract({
            address: escrowAddress,
            abi: TrustLanceEscrowABI,
            functionName: "getMilestoneCount",
        });
    }


    async getMilestone(
        escrowAddress: Address,
        index: bigint,
    ) {

        return publicClient.readContract({
            address: escrowAddress,
            abi: TrustLanceEscrowABI,
            functionName: "getMilestone",
            args: [index],
        });
    }


    async getEscrowBalance(
        escrowAddress: Address,
    ): Promise<bigint> {

        return publicClient.readContract({
            address: escrowAddress,
            abi: TrustLanceEscrowABI,
            functionName: "getEscrowBalance",
        });
    }


    async getEscrowStatus(
        escrowAddress: Address,
    ) {

        const [
            client,
            freelancer,
            totalEscrowed,
            funded,
            cancelled,
            clientCancellationRequested,
            freelancerCancellationRequested,
        ] = await Promise.all([

            publicClient.readContract({
                address: escrowAddress,
                abi: TrustLanceEscrowABI,
                functionName: "client",
            }),

            publicClient.readContract({
                address: escrowAddress,
                abi: TrustLanceEscrowABI,
                functionName: "freelancer",
            }),

            publicClient.readContract({
                address: escrowAddress,
                abi: TrustLanceEscrowABI,
                functionName: "totalEscrowed",
            }),

            publicClient.readContract({
                address: escrowAddress,
                abi: TrustLanceEscrowABI,
                functionName: "funded",
            }),

            publicClient.readContract({
                address: escrowAddress,
                abi: TrustLanceEscrowABI,
                functionName: "cancelled",
            }),

            publicClient.readContract({
                address: escrowAddress,
                abi: TrustLanceEscrowABI,
                functionName: "clientCancellationRequested",
            }),

            publicClient.readContract({
                address: escrowAddress,
                abi: TrustLanceEscrowABI,
                functionName: "freelancerCancellationRequested",
            }),
        ]);

        return {
            client,
            freelancer,
            totalEscrowed,
            funded,
            cancelled,
            clientCancellationRequested,
            freelancerCancellationRequested,
        };
    }
}


export const blockchainService =
    new BlockchainService();