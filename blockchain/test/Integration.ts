import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";

describe("TrustLanceFactory → Escrow", () => {
  it("creates a usable escrow for a project", async () => {
    const { viem } = await network.getOrCreate();

    const [client, freelancer, resolver] =
      await viem.getWalletClients();

    const factory = await viem.deployContract(
      "TrustLanceFactory",
      [resolver.account.address]
    );

    const projectId =
      "0x1111111111111111111111111111111111111111111111111111111111111111";

    await factory.write.createEscrow(
      [projectId],
      {
        account: client.account,
      }
    );

    const escrowAddress =
      await factory.read.getEscrow([projectId]);

    assert.notEqual(
      escrowAddress,
      "0x0000000000000000000000000000000000000000"
    );

    const escrow = await viem.getContractAt(
      "TrustLanceEscrow",
      escrowAddress
    );

    assert.equal(
      (await escrow.read.client()).toLowerCase(),
      client.account.address.toLowerCase()
    );

    assert.equal(
      (await escrow.read.disputeResolver()).toLowerCase(),
      resolver.account.address.toLowerCase()
    );

    assert.equal(
      await escrow.read.funded(),
      false
    );

    assert.equal(
      await escrow.read.cancelled(),
      false
    );

    assert.equal(
      await escrow.read.getMilestoneCount(),
      0n
    );
  });
});