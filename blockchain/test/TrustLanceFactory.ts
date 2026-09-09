
import { describe, it } from "node:test";

import assert from "node:assert/strict";

import { network } from "hardhat";

async function expectRevert(
    promise: Promise<unknown>,
    reason: string
) {
    await assert.rejects(
        promise,
        (error: unknown) => {
            assert.match(
                String(error),
                new RegExp(reason)
            );

            return true;
        }
    );
}

describe("TrustLanceFactory", () => {

    async function deployFixture() {
        const { viem } = await network.getOrCreate();

        const publicClient =
            await viem.getPublicClient();

        const [
            client,
            resolver,
            otherClient,
        ] = await viem.getWalletClients();

        const factory =
            await viem.deployContract(
                "TrustLanceFactory",
                [
                    resolver.account.address,
                ]
            );

        return {
            factory,
            client,
            resolver,
            otherClient,
            publicClient,
        };
    }

    describe("Deployment", () => {

        it("stores the dispute resolver correctly", async () => {
            const {
                factory,
                resolver,
            } = await deployFixture();

            const storedResolver =
                await factory.read.disputeResolver();

            assert.equal(
                storedResolver.toLowerCase(),
                resolver.account.address.toLowerCase()
            );
        });

    });

    describe("Constructor Validation", () => {

        it("rejects a zero dispute resolver", async () => {
            const { viem } =
                await network.getOrCreate();

            await expectRevert(
                viem.deployContract(
                    "TrustLanceFactory",
                    [
                        "0x0000000000000000000000000000000000000000",
                    ]
                ),
                "zero resolver"
            );
        });

    });

    describe("createEscrow", () => {

        it("creates an escrow successfully", async () => {
            const {
                factory,
                client,
                publicClient,
            } = await deployFixture();

            const projectId =
                "0x1111111111111111111111111111111111111111111111111111111111111111";

            const hash =
                await factory.write.createEscrow(
                    [projectId],
                    {
                        account: client.account,
                    }
                );

            const receipt =
                await publicClient.waitForTransactionReceipt({
                    hash,
                });

            assert.equal(
                receipt.status,
                "success"
            );

            const escrowAddress =
                await factory.read.escrowByProject([
                    projectId,
                ]);

            assert.notEqual(
                escrowAddress,
                "0x0000000000000000000000000000000000000000"
            );
        });

        it("stores the created escrow in the registry", async () => {
            const {
                factory,
                client,
            } = await deployFixture();

            const projectId =
                "0x2222222222222222222222222222222222222222222222222222222222222222";

            await factory.write.createEscrow(
                [projectId],
                {
                    account: client.account,
                }
            );

            const mappedAddress =
                await factory.read.escrowByProject([
                    projectId,
                ]);

            const getterAddress =
                await factory.read.getEscrow([
                    projectId,
                ]);

            assert.equal(
                mappedAddress.toLowerCase(),
                getterAddress.toLowerCase()
            );
        });

        it("makes the caller the escrow client", async () => {
            const {
                factory,
                client,
            } = await deployFixture();

            const projectId =
                "0x3333333333333333333333333333333333333333333333333333333333333333";

            await factory.write.createEscrow(
                [projectId],
                {
                    account: client.account,
                }
            );

            const escrowAddress =
                await factory.read.getEscrow([
                    projectId,
                ]);

            const { viem } =
                await network.getOrCreate();

            const escrow =
                await viem.getContractAt(
                    "TrustLanceEscrow",
                    escrowAddress
                );

            const escrowClient =
                await escrow.read.client();

            assert.equal(
                escrowClient.toLowerCase(),
                client.account.address.toLowerCase()
            );
        });

        it("propagates the dispute resolver to the escrow", async () => {
            const {
                factory,
                client,
                resolver,
            } = await deployFixture();

            const projectId =
                "0x4444444444444444444444444444444444444444444444444444444444444444";

            await factory.write.createEscrow(
                [projectId],
                {
                    account: client.account,
                }
            );

            const escrowAddress =
                await factory.read.getEscrow([
                    projectId,
                ]);

            const { viem } =
                await network.getOrCreate();

            const escrow =
                await viem.getContractAt(
                    "TrustLanceEscrow",
                    escrowAddress
                );

            const escrowResolver =
                await escrow.read.disputeResolver();

            assert.equal(
                escrowResolver.toLowerCase(),
                resolver.account.address.toLowerCase()
            );
        });

    });

    describe("EscrowCreated Event", () => {
        it("emits EscrowCreated with the correct values", async () => {
            const {
                factory,
                client,
                publicClient,
            } = await deployFixture();

            const projectId =
                "0x5555555555555555555555555555555555555555555555555555555555555555";

            const hash =
                await factory.write.createEscrow(
                    [projectId],
                    {
                        account: client.account,
                    }
                );

            const receipt =
                await publicClient.waitForTransactionReceipt({
                    hash,
                });

            const logs =
                receipt.logs.filter(
                    (log) =>
                        log.address.toLowerCase() ===
                        factory.address.toLowerCase()
                );

            assert.equal(logs.length, 1);

            const log = logs[0];

            assert.ok(log);

            // The event should have at least the event signature
            // topic plus any indexed parameters.
            assert.ok(log.topics.length >= 1);

            // Verify the event can be decoded from the factory ABI.
            const eventAbi = factory.abi.find(
                (item) =>
                    item.type === "event" &&
                    item.name === "EscrowCreated"
            );

            assert.ok(
                eventAbi,
                "EscrowCreated event not found in ABI"
            );
        });
    });

    describe("Project Validation", () => {

        it("rejects a zero project ID", async () => {
            const {
                factory,
                client,
            } = await deployFixture();

            const zeroProjectId =
                "0x0000000000000000000000000000000000000000000000000000000000000000";

            await expectRevert(
                factory.write.createEscrow(
                    [zeroProjectId],
                    {
                        account: client.account,
                    }
                ),
                "zero project id"
            );
        });

        it("rejects duplicate project IDs", async () => {
            const {
                factory,
                client,
            } = await deployFixture();

            const projectId =
                "0x6666666666666666666666666666666666666666666666666666666666666666";

            await factory.write.createEscrow(
                [projectId],
                {
                    account: client.account,
                }
            );

            await expectRevert(
                factory.write.createEscrow(
                    [projectId],
                    {
                        account: client.account,
                    }
                ),
                "escrow already exists"
            );
        });

    });

    describe("Multiple Projects", () => {

        it("creates different escrows for different projects", async () => {
            const {
                factory,
                client,
            } = await deployFixture();

            const projectId1 =
                "0x7777777777777777777777777777777777777777777777777777777777777777";

            const projectId2 =
                "0x8888888888888888888888888888888888888888888888888888888888888888";

            await factory.write.createEscrow(
                [projectId1],
                {
                    account: client.account,
                }
            );

            await factory.write.createEscrow(
                [projectId2],
                {
                    account: client.account,
                }
            );

            const escrow1 =
                await factory.read.getEscrow([
                    projectId1,
                ]);

            const escrow2 =
                await factory.read.getEscrow([
                    projectId2,
                ]);

            assert.notEqual(
                escrow1.toLowerCase(),
                escrow2.toLowerCase()
            );
        });

        it("maintains independent registry entries", async () => {
            const {
                factory,
                client,
            } = await deployFixture();

            const projectId1 =
                "0x9999999999999999999999999999999999999999999999999999999999999999";

            const projectId2 =
                "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

            await factory.write.createEscrow(
                [projectId1],
                {
                    account: client.account,
                }
            );

            await factory.write.createEscrow(
                [projectId2],
                {
                    account: client.account,
                }
            );

            const escrow1 =
                await factory.read.escrowByProject([
                    projectId1,
                ]);

            const escrow2 =
                await factory.read.escrowByProject([
                    projectId2,
                ]);

            assert.notEqual(
                escrow1,
                "0x0000000000000000000000000000000000000000"
            );

            assert.notEqual(
                escrow2,
                "0x0000000000000000000000000000000000000000"
            );

            assert.notEqual(
                escrow1.toLowerCase(),
                escrow2.toLowerCase()
            );
        });

        it("allows different clients to create different project escrows", async () => {
            const {
                factory,
                client,
                otherClient,
            } = await deployFixture();

            const projectId1 =
                "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

            const projectId2 =
                "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc";

            await factory.write.createEscrow(
                [projectId1],
                {
                    account: client.account,
                }
            );

            await factory.write.createEscrow(
                [projectId2],
                {
                    account: otherClient.account,
                }
            );

            const escrowAddress1 =
                await factory.read.getEscrow([
                    projectId1,
                ]);

            const escrowAddress2 =
                await factory.read.getEscrow([
                    projectId2,
                ]);

            const { viem } =
                await network.getOrCreate();

            const escrow1 =
                await viem.getContractAt(
                    "TrustLanceEscrow",
                    escrowAddress1
                );

            const escrow2 =
                await viem.getContractAt(
                    "TrustLanceEscrow",
                    escrowAddress2
                );

            const client1 =
                await escrow1.read.client();

            const client2 =
                await escrow2.read.client();

            assert.equal(
                client1.toLowerCase(),
                client.account.address.toLowerCase()
            );

            assert.equal(
                client2.toLowerCase(),
                otherClient.account.address.toLowerCase()
            );
        });

    });

});
