import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";
import { parseEventLogs } from "viem";


const { viem } = await network.getOrCreate();

describe("TrustLanceFactory", () => {
    async function deployFactory() {
        const { viem } = await network.getOrCreate();

        const [client, other] = await viem.getWalletClients();

        const REVIEW_PERIOD = 7n * 24n * 60n * 60n;
        const DISPUTE_PERIOD = 3n * 24n * 60n * 60n;

        const factory = await viem.deployContract("TrustLanceFactory", [
            REVIEW_PERIOD,
            DISPUTE_PERIOD,
        ]);

        return {
            viem,
            factory,
            client,
            other,
            REVIEW_PERIOD,
            DISPUTE_PERIOD,
        };
    }

    // =============================================================
    // Constructor
    // =============================================================

    describe("Deployment", () => {
        it("stores the configured periods", async () => {
            const {
                factory,
                REVIEW_PERIOD,
                DISPUTE_PERIOD,
            } = await deployFactory();

            assert.equal(
                await factory.read.clientReviewPeriod(),
                REVIEW_PERIOD
            );

            assert.equal(
                await factory.read.disputePeriod(),
                DISPUTE_PERIOD
            );
        });

        it("rejects a zero review period", async () => {
            const { viem } = await network.getOrCreate();

            await assert.rejects(
                viem.deployContract("TrustLanceFactory", [
                    0n,
                    3n * 24n * 60n * 60n,
                ]),
                /invalid review period/i
            );
        });

        it("rejects a zero dispute period", async () => {
            const { viem } = await network.getOrCreate();

            await assert.rejects(
                viem.deployContract("TrustLanceFactory", [
                    7n * 24n * 60n * 60n,
                    0n,
                ]),
                /invalid dispute period/i
            );
        });
    });

    // =============================================================
    // createEscrow
    // =============================================================

    describe("createEscrow", () => {
        it("creates an escrow with the caller as client", async () => {
            const {
                factory,
                client,
            } = await deployFactory();

            const hash = await factory.write.createEscrow({
                account: client.account,
            });

            const publicClient = await viem.getPublicClient();

            const receipt = await publicClient.waitForTransactionReceipt({
                hash,
            });

            const logs = parseEventLogs({
                abi: factory.abi,
                logs: receipt.logs,
                eventName: "EscrowCreated",
            });

            assert.equal(logs.length, 1);
            assert.equal(
                logs[0].args.client.toLowerCase(),
                client.account.address.toLowerCase()
            );
        });

        it("registers the created escrow globally", async () => {
            const {
                factory,
                client,
            } = await deployFactory();

            await factory.write.createEscrow({
                account: client.account,
            });

            assert.equal(
                await factory.read.getEscrowCount(),
                1n
            );

            const escrow = await factory.read.getEscrow([0n]);

            assert.notEqual(
                escrow,
                "0x0000000000000000000000000000000000000000"
            );
        });

        it("marks the created address as an escrow", async () => {
            const {
                factory,
                client,
            } = await deployFactory();

            await factory.write.createEscrow({
                account: client.account,
            });

            const escrow = await factory.read.getEscrow([0n]);

            assert.equal(
                await factory.read.isEscrow([escrow]),
                true
            );
        });

        it("registers the escrow under the client", async () => {
            const {
                factory,
                client,
            } = await deployFactory();

            await factory.write.createEscrow({
                account: client.account,
            });

            assert.equal(
                await factory.read.getClientEscrowCount([
                    client.account.address,
                ]),
                1n
            );

            const escrow = await factory.read.getEscrow([0n]);

            assert.equal(
                await factory.read.getClientEscrow([
                    client.account.address,
                    0n,
                ]),
                escrow
            );
        });

        it("emits EscrowCreated with the correct index", async () => {
            const {
                factory,
                client,
            } = await deployFactory();

            const hash = await factory.write.createEscrow({
                account: client.account,
            });

            const publicClient = await viem.getPublicClient();

            const receipt = await publicClient.waitForTransactionReceipt({
                hash,
            });

            const logs = parseEventLogs({
                abi: factory.abi,
                logs: receipt.logs,
                eventName: "EscrowCreated",
            });

            assert.equal(logs[0].args.escrowIndex, 0n);
            assert.equal(
                logs[0].args.client.toLowerCase(),
                client.account.address.toLowerCase()
            );
            assert.notEqual(logs[0].args.escrow, undefined);
        });
    });

    // =============================================================
    // Multiple escrows
    // =============================================================

    describe("Multiple escrows", () => {
        it("creates independent escrows", async () => {
            const {
                factory,
                client,
            } = await deployFactory();

            await factory.write.createEscrow({
                account: client.account,
            });

            await factory.write.createEscrow({
                account: client.account,
            });

            assert.equal(
                await factory.read.getEscrowCount(),
                2n
            );

            const escrow0 = await factory.read.getEscrow([0n]);
            const escrow1 = await factory.read.getEscrow([1n]);

            assert.notEqual(escrow0, escrow1);
        });

        it("tracks escrows separately for different clients", async () => {
            const {
                factory,
                client,
                other,
            } = await deployFactory();

            await factory.write.createEscrow({
                account: client.account,
            });

            await factory.write.createEscrow({
                account: other.account,
            });

            assert.equal(
                await factory.read.getClientEscrowCount([
                    client.account.address,
                ]),
                1n
            );

            assert.equal(
                await factory.read.getClientEscrowCount([
                    other.account.address,
                ]),
                1n
            );
        });
    });

    // =============================================================
    // Getter bounds
    // =============================================================

    describe("Getter bounds", () => {
        it("rejects an invalid global escrow index", async () => {
            const {
                factory,
            } = await deployFactory();

            await assert.rejects(
                factory.read.getEscrow([0n]),
                /invalid index/i
            );
        });

        it("rejects an invalid client escrow index", async () => {
            const {
                factory,
                client,
            } = await deployFactory();

            await assert.rejects(
                factory.read.getClientEscrow([
                    client.account.address,
                    0n,
                ]),
                /invalid client index/i
            );
        });
    });
});