import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";

// import {getBalance} from "viem";

async function expectRevert(
  promise: Promise<unknown>,
  reason: string
) {
  await assert.rejects(
    promise,
    (error: unknown) => {
      assert.match(String(error), new RegExp(reason));
      return true;
    }
  );
}

describe("TrustLanceEscrow", () => {
  async function deployFixture() {
    const { viem } = await network.getOrCreate();

    const publicClient = await viem.getPublicClient();

    const [client, freelancer, resolver, attacker] =
      await viem.getWalletClients();

    const escrow = await viem.deployContract(
      "TrustLanceEscrow",
      [
        client.account.address,
        resolver.account.address,
      ]
    );

    return {
      escrow,
      client,
      freelancer,
      resolver,
      attacker,
      publicClient,
    };
  }

  describe("Deployment", () => {
    it("sets the client correctly", async () => {
      const { escrow, client } =
        await deployFixture();

      const actual =
        await escrow.read.client();

      assert.equal(
        actual.toLowerCase(),
        client.account.address.toLowerCase()
      );
    });

    it("sets the dispute resolver correctly", async () => {
      const { escrow, resolver } =
        await deployFixture();

      const actual =
        await escrow.read.disputeResolver();

      assert.equal(
        actual.toLowerCase(),
        resolver.account.address.toLowerCase()
      );
    });

    it("starts without a freelancer", async () => {
      const { escrow } =
        await deployFixture();

      const actual =
        await escrow.read.freelancer();

      assert.equal(
        actual,
        "0x0000000000000000000000000000000000000000"
      );
    });

    it("starts with zero escrow", async () => {
      const { escrow } =
        await deployFixture();

      assert.equal(
        await escrow.read.totalEscrowed(),
        0n
      );
    });

    it("starts unfunded", async () => {
      const { escrow } =
        await deployFixture();

      assert.equal(
        await escrow.read.funded(),
        false
      );
    });

    it("starts uncancelled", async () => {
      const { escrow } =
        await deployFixture();

      assert.equal(
        await escrow.read.cancelled(),
        false
      );
    });

    it("starts with zero milestones", async () => {
      const { escrow } =
        await deployFixture();

      assert.equal(
        await escrow.read.getMilestoneCount(),
        0n
      );
    });
  });

  describe("Constructor Validation", () => {
    it("rejects a zero client address", async () => {
      const { viem } = await network.getOrCreate();

      const [, , resolver] =
        await viem.getWalletClients();

      await expectRevert(
        viem.deployContract(
          "TrustLanceEscrow",
          [
            "0x0000000000000000000000000000000000000000",
            resolver.account.address,
          ]
        ),
        "TrustLance: invalid client"
      );
    });

    it("rejects a zero dispute resolver address", async () => {
      const { viem } = await network.getOrCreate();

      const [client] =
        await viem.getWalletClients();

      await expectRevert(
        viem.deployContract(
          "TrustLanceEscrow",
          [
            client.account.address,
            "0x0000000000000000000000000000000000000000",
          ]
        ),
        "TrustLance: invalid resolver"
      );
    });
  });

  describe("Funding", () => {
    const M1 = 1n * 10n ** 18n;
    const M2 = 2n * 10n ** 18n;
    const M3 = 3n * 10n ** 18n;

    it("allows the client to fund the escrow", async () => {
      const { escrow, client } =
        await deployFixture();

      const total = M1 + M2 + M3;

      await escrow.write.fundEscrow(
        [
          [M1, M2, M3],
          [
            "Design",
            "Development",
            "Deployment",
          ],
        ],
        {
          account: client.account,
          value: total,
        }
      );

      assert.equal(
        await escrow.read.funded(),
        true
      );

      assert.equal(
        await escrow.read.totalEscrowed(),
        total
      );

      assert.equal(
        await escrow.read.getEscrowBalance(),
        total
      );
    });

    it("creates the correct number of milestones", async () => {
      const { escrow, client } =
        await deployFixture();

      const total = M1 + M2;

      await escrow.write.fundEscrow(
        [
          [M1, M2],
          ["Design", "Development"],
        ],
        {
          account: client.account,
          value: total,
        }
      );

      assert.equal(
        await escrow.read.getMilestoneCount(),
        2n
      );
    });

    it("initializes milestones as Pending", async () => {
      const { escrow, client } =
        await deployFixture();

      await escrow.write.fundEscrow(
        [
          [M1, M2],
          ["Design", "Development"],
        ],
        {
          account: client.account,
          value: M1 + M2,
        }
      );

      const milestone0 =
        await escrow.read.getMilestone([0n]);

      const milestone1 =
        await escrow.read.getMilestone([1n]);

      // MilestoneStatus.Pending == 0
      assert.equal(milestone0[2], 0);
      assert.equal(milestone1[2], 0);
    });

    it("stores milestone descriptions and amounts", async () => {
      const { escrow, client } =
        await deployFixture();

      await escrow.write.fundEscrow(
        [
          [M1, M2],
          ["Design", "Development"],
        ],
        {
          account: client.account,
          value: M1 + M2,
        }
      );

      const milestone0 =
        await escrow.read.getMilestone([0n]);

      const milestone1 =
        await escrow.read.getMilestone([1n]);

      assert.equal(
        milestone0[0],
        "Design"
      );

      assert.equal(
        milestone0[1],
        M1
      );

      assert.equal(
        milestone1[0],
        "Development"
      );

      assert.equal(
        milestone1[1],
        M2
      );
    });

    it("rejects funding from a non-client", async () => {
      const {
        escrow,
        attacker,
      } = await deployFixture();

      await assert.rejects(
        escrow.write.fundEscrow(
          [
            [M1],
            ["Design"],
          ],
          {
            account: attacker.account,
            value: M1,
          }
        ),
        /TrustLance: not client/
      );
    });

    it("rejects mismatched arrays", async () => {
      const { escrow, client } =
        await deployFixture();

      await assert.rejects(
        escrow.write.fundEscrow(
          [
            [M1, M2],
            ["Design"],
          ],
          {
            account: client.account,
            value: M1 + M2,
          }
        ),
        /TrustLance: length mismatch/
      );
    });

    it("rejects zero-value milestones", async () => {
      const { escrow, client } =
        await deployFixture();

      await assert.rejects(
        escrow.write.fundEscrow(
          [
            [0n],
            ["Design"],
          ],
          {
            account: client.account,
            value: 0n,
          }
        ),
        /TrustLance: zero milestone amount/
      );
    });

    it("rejects incorrect ETH amount", async () => {
      const { escrow, client } =
        await deployFixture();

      await assert.rejects(
        escrow.write.fundEscrow(
          [
            [M1, M2],
            ["Design", "Development"],
          ],
          {
            account: client.account,
            value: M1,
          }
        ),
        /TrustLance: incorrect ETH amount/
      );
    });

    it("cannot be funded twice", async () => {
      const { escrow, client } =
        await deployFixture();

      await escrow.write.fundEscrow(
        [
          [M1],
          ["Design"],
        ],
        {
          account: client.account,
          value: M1,
        }
      );

      await assert.rejects(
        escrow.write.fundEscrow(
          [
            [M2],
            ["Development"],
          ],
          {
            account: client.account,
            value: M2,
          }
        ),
        /TrustLance: already funded/
      );
    });
  });

  describe("Freelancer", () => {
    it("allows the client to award a freelancer", async () => {
      const { escrow, client, freelancer } = await deployFixture();

      await escrow.write.fundEscrow(
        [
          [1n * 10n ** 18n],
          ["Build website"],
        ],
        {
          account: client.account,
          value: 1n * 10n ** 18n,
        }
      );

      await escrow.write.awardFreelancer(
        [freelancer.account.address],
        {
          account: client.account,
        }
      );

      const assigned = await escrow.read.freelancer();

      assert.equal(
        assigned.toLowerCase(),
        freelancer.account.address.toLowerCase()
      );
    });

    it("rejects awarding a freelancer before funding", async () => {
      const { escrow, client, freelancer } = await deployFixture();

      await expectRevert(
        escrow.write.awardFreelancer(
          [freelancer.account.address],
          {
            account: client.account,
          }
        ),
        "TrustLance: escrow not funded"
      );
    });

    it("rejects a non-client from awarding a freelancer", async () => {
      const { escrow, attacker, freelancer } = await deployFixture();

      await assert.rejects(
        escrow.write.awardFreelancer(
          [freelancer.account.address],
          {
            account: attacker.account,
          }
        ),
        /TrustLance: not client/
      );
    });

    it("rejects awarding the zero address", async () => {
      const { escrow, client } = await deployFixture();

      await escrow.write.fundEscrow(
        [
          [1n * 10n ** 18n],
          ["Build website"],
        ],
        {
          account: client.account,
          value: 1n * 10n ** 18n,
        }
      );

      await assert.rejects(
        escrow.write.awardFreelancer(
          ["0x0000000000000000000000000000000000000000"],
          {
            account: client.account,
          }
        ),
        /TrustLance: invalid freelancer/
      );
    });

    it("rejects assigning a freelancer twice", async () => {
      const { escrow, client, freelancer, attacker } = await deployFixture();

      await escrow.write.fundEscrow(
        [
          [1n * 10n ** 18n],
          ["Build website"],
        ],
        {
          account: client.account,
          value: 1n * 10n ** 18n,
        }
      );

      await escrow.write.awardFreelancer(
        [freelancer.account.address],
        {
          account: client.account,
        }
      );

      await expectRevert(
        escrow.write.awardFreelancer(
          [attacker.account.address],
          {
            account: client.account,
          }
        ),
        "TrustLance: freelancer already assigned"
      );
    });
  });

  describe("Milestone Submission", () => {
    async function fundedAssignedEscrow() {
      const { viem } = await network.getOrCreate();
      const publicClient = await viem.getPublicClient();

      const [client, freelancer, resolver, attacker] =
        await viem.getWalletClients();

      const escrow = await viem.deployContract(
        "TrustLanceEscrow",
        [
          client.account.address,
          resolver.account.address,
        ]
      );

      const amount = 1n * 10n ** 18n;

      await escrow.write.fundEscrow(
        [
          [amount],
          ["Build website"],
        ],
        {
          account: client.account,
          value: amount,
        }
      );

      await escrow.write.awardFreelancer(
        [freelancer.account.address],
        {
          account: client.account,
        }
      );

      return {
        escrow,
        client,
        freelancer,
        resolver,
        attacker,
        amount,
        publicClient,
      };
    }

    it("allows the assigned freelancer to submit a milestone", async () => {
      const { escrow, freelancer } =
        await fundedAssignedEscrow();

      await escrow.write.submitMilestone(
        [0n, "QmWebsiteCID"],
        {
          account: freelancer.account,
        }
      );

      const milestone =
        await escrow.read.getMilestone([0n]);

      // Submitted = 1
      assert.equal(milestone[2], 1);
    });

    it("stores the submission CID", async () => {
      const { escrow, freelancer } =
        await fundedAssignedEscrow();

      const cid = "QmWebsiteCID";

      await escrow.write.submitMilestone(
        [0n, cid],
        {
          account: freelancer.account,
        }
      );

      const milestone =
        await escrow.read.getMilestone([0n]);

      assert.equal(milestone[3], cid);
    });

    it("rejects submission from the client", async () => {
      const { escrow, client } =
        await fundedAssignedEscrow();

      await expectRevert(
        escrow.write.submitMilestone(
          [0n, "QmWebsiteCID"],
          {
            account: client.account,
          }
        ),
        "TrustLance: not freelancer"
      );
    });

    it("rejects submission from an attacker", async () => {
      const { escrow, attacker } =
        await fundedAssignedEscrow();

      await expectRevert(
        escrow.write.submitMilestone(
          [0n, "QmWebsiteCID"],
          {
            account: attacker.account,
          }
        ),
        "TrustLance: not freelancer"
      );
    });

    it("rejects submission for an invalid milestone", async () => {
      const { escrow, freelancer } =
        await fundedAssignedEscrow();

      await expectRevert(
        escrow.write.submitMilestone(
          [99n, "QmWebsiteCID"],
          {
            account: freelancer.account,
          }
        ),
        "TrustLance: invalid milestone"
      );
    });

    it("rejects submitting the same milestone twice", async () => {
      const { escrow, freelancer } =
        await fundedAssignedEscrow();

      await escrow.write.submitMilestone(
        [0n, "QmWebsiteCID"],
        {
          account: freelancer.account,
        }
      );

      await expectRevert(
        escrow.write.submitMilestone(
          [0n, "QmWebsiteCID-2"],
          {
            account: freelancer.account,
          }
        ),
        "TrustLance: invalid milestone state"
      );
    });

    it("stores the latest submission only when submission is allowed", async () => {
      const { escrow, freelancer } =
        await fundedAssignedEscrow();

      await escrow.write.submitMilestone(
        [0n, "QmWebsiteCID"],
        {
          account: freelancer.account,
        }
      );

      const milestone =
        await escrow.read.getMilestone([0n]);

      assert.equal(milestone[3], "QmWebsiteCID");
    });
    it("rejects an empty CID", async () => {
      const { escrow, freelancer } =
        await fundedAssignedEscrow();

      await expectRevert(
        escrow.write.submitMilestone(
          [0n, ""],
          {
            account: freelancer.account,
          }
        ),
        "TrustLance: empty CID"
      );
    });
  });

  describe("Milestone Approval & Payment", () => {
    async function submittedEscrow() {
      const { viem } = await network.getOrCreate();
      const publicClient = await viem.getPublicClient();

      const [client, freelancer, resolver] =
        await viem.getWalletClients();

      const escrow = await viem.deployContract(
        "TrustLanceEscrow",
        [
          client.account.address,
          resolver.account.address,
        ]
      );

      const amount = 1n * 10n ** 18n;

      await escrow.write.fundEscrow(
        [
          [amount],
          ["Build website"],
        ],
        {
          account: client.account,
          value: amount,
        }
      );

      await escrow.write.awardFreelancer(
        [freelancer.account.address],
        {
          account: client.account,
        }
      );

      await escrow.write.submitMilestone(
        [0n, "QmWebsiteCID"],
        {
          account: freelancer.account,
        }
      );

      return {
        escrow,
        client,
        freelancer,
        resolver,
        amount,
        publicClient, // ← important
      };
    }
    it("allows the client to approve a submitted milestone", async () => {
      const { escrow, client } = await submittedEscrow();

      await escrow.write.approveMilestone(
        [0n],
        {
          account: client.account,
        }
      );

      const milestone = await escrow.read.getMilestone([0n]);

      // Paid = 5
      assert.equal(milestone[2], 5);
    });

    it("pays the milestone amount to the freelancer", async () => {
      const {
        escrow,
        client,
        freelancer,
        amount,
        publicClient,
      } = await submittedEscrow();

      const before = await publicClient.getBalance({
        address: freelancer.account.address,
      });

      await escrow.write.approveMilestone(
        [0n],
        {
          account: client.account,
        }
      );

      const after = await publicClient.getBalance({
        address: freelancer.account.address,
      });

      assert.equal(after - before, amount);
    });

    it("reduces totalEscrowed after payment", async () => {
      const { escrow, client } = await submittedEscrow();

      assert.equal(
        await escrow.read.totalEscrowed(),
        1n * 10n ** 18n
      );

      await escrow.write.approveMilestone(
        [0n],
        {
          account: client.account,
        }
      );

      assert.equal(
        await escrow.read.totalEscrowed(),
        0n
      );
    });
    it("reduces the contract balance after payment", async () => {
      const { escrow, client } = await submittedEscrow();

      assert.equal(
        await escrow.read.getEscrowBalance(),
        1n * 10n ** 18n
      );

      await escrow.write.approveMilestone(
        [0n],
        {
          account: client.account,
        }
      );

      assert.equal(
        await escrow.read.getEscrowBalance(),
        0n
      );
    });

    it("rejects approval from a non-client", async () => {
      const { escrow, freelancer } = await submittedEscrow();

      await expectRevert(
        escrow.write.approveMilestone(
          [0n],
          {
            account: freelancer.account,
          }
        ),
        "TrustLance: not client"
      );
    });

    it("rejects approval of a pending milestone", async () => {
      const { escrow, client } = await deployFixture();

      const amount = 1n * 10n ** 18n;

      await escrow.write.fundEscrow(
        [
          [amount],
          ["Build website"],
        ],
        {
          account: client.account,
          value: amount,
        }
      );

      await escrow.write.awardFreelancer(
        ["0x70997970c51812dc3a010c7d01b50e0d17dc79c8"],
        {
          account: client.account,
        }
      );

      await expectRevert(
        escrow.write.approveMilestone(
          [0n],
          {
            account: client.account,
          }
        ),
        "TrustLance: milestone not submitted"
      );
    });

    it("rejects approval twice", async () => {
      const { escrow, client } = await submittedEscrow();

      await escrow.write.approveMilestone(
        [0n],
        {
          account: client.account,
        }
      );

      await expectRevert(
        escrow.write.approveMilestone(
          [0n],
          {
            account: client.account,
          }
        ),
        "TrustLance: milestone not submitted"
      );
    });

    it("rejects an invalid milestone index", async () => {
      const { escrow, client } = await submittedEscrow();

      await expectRevert(
        escrow.write.approveMilestone(
          [99n],
          {
            account: client.account,
          }
        ),
        "TrustLance: invalid milestone"
      );
    });
  });

  describe("Multi-Milestone Escrow", () => {
    const M1 = 1n * 10n ** 18n;
    const M2 = 2n * 10n ** 18n;
    const M3 = 3n * 10n ** 18n;

    async function threeMilestoneEscrow() {
      const { viem } = await network.getOrCreate();
      const publicClient = await viem.getPublicClient();

      const [client, freelancer, resolver, attacker] =
        await viem.getWalletClients();

      const escrow = await viem.deployContract(
        "TrustLanceEscrow",
        [
          client.account.address,
          resolver.account.address,
        ]
      );

      const total = M1 + M2 + M3;

      await escrow.write.fundEscrow(
        [
          [M1, M2, M3],
          [
            "Design",
            "Development",
            "Deployment",
          ],
        ],
        {
          account: client.account,
          value: total,
        }
      );

      await escrow.write.awardFreelancer(
        [freelancer.account.address],
        {
          account: client.account,
        }
      );

      return {
        escrow,
        client,
        freelancer,
        resolver,
        attacker,
        publicClient,
        total,
      };
    }

    it("keeps all milestones Pending initially", async () => {
      const { escrow } =
        await threeMilestoneEscrow();

      const milestone0 =
        await escrow.read.getMilestone([0n]);

      const milestone1 =
        await escrow.read.getMilestone([1n]);

      const milestone2 =
        await escrow.read.getMilestone([2n]);

      // Pending = 0
      assert.equal(milestone0[2], 0);
      assert.equal(milestone1[2], 0);
      assert.equal(milestone2[2], 0);
    });

    it("only changes the submitted milestone", async () => {
      const { escrow, freelancer } =
        await threeMilestoneEscrow();

      await escrow.write.submitMilestone(
        [1n, "QmDevelopmentCID"],
        {
          account: freelancer.account,
        }
      );

      const milestone0 =
        await escrow.read.getMilestone([0n]);

      const milestone1 =
        await escrow.read.getMilestone([1n]);

      const milestone2 =
        await escrow.read.getMilestone([2n]);

      // Pending = 0
      assert.equal(milestone0[2], 0);

      // Submitted = 1
      assert.equal(milestone1[2], 1);

      // Pending = 0
      assert.equal(milestone2[2], 0);
    });

    it("only pays the approved milestone", async () => {
      const {
        escrow,
        client,
        freelancer,
        publicClient,
      } = await threeMilestoneEscrow();

      await escrow.write.submitMilestone(
        [1n, "QmDevelopmentCID"],
        {
          account: freelancer.account,
        }
      );

      const before =
        await publicClient.getBalance({
          address: freelancer.account.address,
        });

      await escrow.write.approveMilestone(
        [1n],
        {
          account: client.account,
        }
      );

      const after =
        await publicClient.getBalance({
          address: freelancer.account.address,
        });

      assert.equal(
        after - before,
        M2
      );
    });

    it("reduces escrow by only the approved milestone amount", async () => {
      const { escrow, client, freelancer } =
        await threeMilestoneEscrow();

      assert.equal(
        await escrow.read.totalEscrowed(),
        M1 + M2 + M3
      );

      await escrow.write.submitMilestone(
        [1n, "QmDevelopmentCID"],
        {
          account: freelancer.account,
        }
      );

      await escrow.write.approveMilestone(
        [1n],
        {
          account: client.account,
        }
      );

      assert.equal(
        await escrow.read.totalEscrowed(),
        M1 + M3
      );
    });
    it("leaves the other milestones unpaid", async () => {
      const { escrow, client, freelancer } =
        await threeMilestoneEscrow();

      await escrow.write.submitMilestone(
        [1n, "QmDevelopmentCID"],
        {
          account: freelancer.account,
        }
      );

      await escrow.write.approveMilestone(
        [1n],
        {
          account: client.account,
        }
      );

      const milestone0 =
        await escrow.read.getMilestone([0n]);

      const milestone1 =
        await escrow.read.getMilestone([1n]);

      const milestone2 =
        await escrow.read.getMilestone([2n]);

      // Pending = 0
      assert.equal(milestone0[2], 0);

      // Paid = 5
      assert.equal(milestone1[2], 5);

      // Pending = 0
      assert.equal(milestone2[2], 0);
    });

    it("can pay multiple milestones independently", async () => {
      const { escrow, client, freelancer } =
        await threeMilestoneEscrow();

      await escrow.write.submitMilestone(
        [0n, "QmDesignCID"],
        {
          account: freelancer.account,
        }
      );

      await escrow.write.approveMilestone(
        [0n],
        {
          account: client.account,
        }
      );

      assert.equal(
        await escrow.read.totalEscrowed(),
        M2 + M3
      );

      await escrow.write.submitMilestone(
        [2n, "QmDeploymentCID"],
        {
          account: freelancer.account,
        }
      );

      await escrow.write.approveMilestone(
        [2n],
        {
          account: client.account,
        }
      );

      assert.equal(
        await escrow.read.totalEscrowed(),
        M2
      );
    });
  });

  describe("Escrow State Validation", () => {
    const amount = 1n * 10n ** 18n;

    async function fundedEscrow() {
      const { viem } = await network.getOrCreate();

      const [client, freelancer, resolver, attacker] =
        await viem.getWalletClients();

      const escrow = await viem.deployContract(
        "TrustLanceEscrow",
        [
          client.account.address,
          resolver.account.address,
        ]
      );

      await escrow.write.fundEscrow(
        [
          [amount],
          ["Build website"],
        ],
        {
          account: client.account,
          value: amount,
        }
      );

      return {
        escrow,
        client,
        freelancer,
        resolver,
        attacker,
      };
    }

    it("rejects milestone submission before freelancer assignment", async () => {
      const { escrow, attacker } =
        await fundedEscrow();

      await expectRevert(
        escrow.write.submitMilestone(
          [0n, "QmWebsiteCID"],
          {
            account: attacker.account,
          }
        ),
        "TrustLance: not freelancer"
      );
    });

    it("rejects approval before freelancer assignment", async () => {
      const { escrow, client } =
        await fundedEscrow();

      await expectRevert(
        escrow.write.approveMilestone(
          [0n],
          {
            account: client.account,
          }
        ),
        "TrustLance: freelancer not assigned"
      );
    });

    it("rejects approval before milestone submission", async () => {
      const { escrow, client, freelancer } =
        await fundedEscrow();

      await escrow.write.awardFreelancer(
        [freelancer.account.address],
        {
          account: client.account,
        }
      );

      await expectRevert(
        escrow.write.approveMilestone(
          [0n],
          {
            account: client.account,
          }
        ),
        "TrustLance: milestone not submitted"
      );
    });

    it("rejects submission after milestone has been paid", async () => {
      const { escrow, client, freelancer } =
        await fundedEscrow();

      await escrow.write.awardFreelancer(
        [freelancer.account.address],
        {
          account: client.account,
        }
      );

      await escrow.write.submitMilestone(
        [0n, "QmWebsiteCID"],
        {
          account: freelancer.account,
        }
      );

      await escrow.write.approveMilestone(
        [0n],
        {
          account: client.account,
        }
      );

      await expectRevert(
        escrow.write.submitMilestone(
          [0n, "QmWebsiteCID-2"],
          {
            account: freelancer.account,
          }
        ),
        "TrustLance: invalid milestone state"
      );
    });

    it("rejects approval of an already paid milestone", async () => {
      const { escrow, client, freelancer } =
        await fundedEscrow();

      await escrow.write.awardFreelancer(
        [freelancer.account.address],
        {
          account: client.account,
        }
      );

      await escrow.write.submitMilestone(
        [0n, "QmWebsiteCID"],
        {
          account: freelancer.account,
        }
      );

      await escrow.write.approveMilestone(
        [0n],
        {
          account: client.account,
        }
      );

      await expectRevert(
        escrow.write.approveMilestone(
          [0n],
          {
            account: client.account,
          }
        ),
        "TrustLance: milestone not submitted"
      );
    });
  });

  describe("Milestone Rejection", () => {
    const amount = 1n * 10n ** 18n;

    async function submittedEscrow() {
      const { viem } = await network.getOrCreate();
      const publicClient = await viem.getPublicClient();

      const [client, freelancer, resolver, attacker] =
        await viem.getWalletClients();

      const escrow = await viem.deployContract(
        "TrustLanceEscrow",
        [
          client.account.address,
          resolver.account.address,
        ]
      );

      await escrow.write.fundEscrow(
        [
          [amount],
          ["Build website"],
        ],
        {
          account: client.account,
          value: amount,
        }
      );

      await escrow.write.awardFreelancer(
        [freelancer.account.address],
        {
          account: client.account,
        }
      );

      await escrow.write.submitMilestone(
        [0n, "QmInitialCID"],
        {
          account: freelancer.account,
        }
      );

      return {
        escrow,
        client,
        freelancer,
        resolver,
        attacker,
        publicClient,
      };
    }

    it("allows the client to reject a submitted milestone", async () => {
      const { escrow, client } =
        await submittedEscrow();

      await escrow.write.rejectMilestone(
        [0n],
        {
          account: client.account,
        }
      );

      const milestone =
        await escrow.read.getMilestone([0n]);

      // Rejected = 3
      assert.equal(milestone[2], 3);
    });

    it("rejecting a milestone does not release payment", async () => {
      const {
        escrow,
        client,
        freelancer,
        publicClient,
      } = await submittedEscrow();

      const before =
        await publicClient.getBalance({
          address: freelancer.account.address,
        });

      await escrow.write.rejectMilestone(
        [0n],
        {
          account: client.account,
        }
      );

      const after =
        await publicClient.getBalance({
          address: freelancer.account.address,
        });

      assert.equal(
        after,
        before
      );
    });

    it("rejecting a milestone does not reduce totalEscrowed", async () => {
      const { escrow, client } =
        await submittedEscrow();

      assert.equal(
        await escrow.read.totalEscrowed(),
        amount
      );

      await escrow.write.rejectMilestone(
        [0n],
        {
          account: client.account,
        }
      );

      assert.equal(
        await escrow.read.totalEscrowed(),
        amount
      );
    });

    it("rejecting a milestone does not reduce the contract balance", async () => {
      const { escrow, client } =
        await submittedEscrow();

      assert.equal(
        await escrow.read.getEscrowBalance(),
        amount
      );

      await escrow.write.rejectMilestone(
        [0n],
        {
          account: client.account,
        }
      );

      assert.equal(
        await escrow.read.getEscrowBalance(),
        amount
      );
    });

    it("rejects milestone rejection from a non-client", async () => {
      const { escrow, freelancer } =
        await submittedEscrow();

      await expectRevert(
        escrow.write.rejectMilestone(
          [0n],
          {
            account: freelancer.account,
          }
        ),
        "TrustLance: not client"
      );
    });

    it("rejects an invalid milestone index", async () => {
      const { escrow, client } =
        await submittedEscrow();

      await expectRevert(
        escrow.write.rejectMilestone(
          [99n],
          {
            account: client.account,
          }
        ),
        "TrustLance: invalid milestone"
      );
    });

    it("rejects a pending milestone", async () => {
      const { viem } = await network.getOrCreate();

      const [client, freelancer, resolver] =
        await viem.getWalletClients();

      const escrow = await viem.deployContract(
        "TrustLanceEscrow",
        [
          client.account.address,
          resolver.account.address,
        ]
      );

      await escrow.write.fundEscrow(
        [
          [amount],
          ["Build website"],
        ],
        {
          account: client.account,
          value: amount,
        }
      );

      await escrow.write.awardFreelancer(
        [freelancer.account.address],
        {
          account: client.account,
        }
      );

      await expectRevert(
        escrow.write.rejectMilestone(
          [0n],
          {
            account: client.account,
          }
        ),
        "TrustLance: milestone not submitted"
      );
    });

    it("rejects rejecting an already rejected milestone", async () => {
      const { escrow, client } =
        await submittedEscrow();

      await escrow.write.rejectMilestone(
        [0n],
        {
          account: client.account,
        }
      );

      await expectRevert(
        escrow.write.rejectMilestone(
          [0n],
          {
            account: client.account,
          }
        ),
        "TrustLance: milestone not submitted"
      );
    });
  });

  describe("Milestone Resubmission", () => {
    const amount = 1n * 10n ** 18n;

    async function rejectedEscrow() {
      const { viem } = await network.getOrCreate();

      const [client, freelancer, resolver] =
        await viem.getWalletClients();

      const escrow = await viem.deployContract(
        "TrustLanceEscrow",
        [
          client.account.address,
          resolver.account.address,
        ]
      );

      await escrow.write.fundEscrow(
        [
          [amount],
          ["Build website"],
        ],
        {
          account: client.account,
          value: amount,
        }
      );

      await escrow.write.awardFreelancer(
        [freelancer.account.address],
        {
          account: client.account,
        }
      );

      await escrow.write.submitMilestone(
        [0n, "QmInitialCID"],
        {
          account: freelancer.account,
        }
      );

      await escrow.write.rejectMilestone(
        [0n],
        {
          account: client.account,
        }
      );

      return {
        escrow,
        client,
        freelancer,
        resolver,
      };
    }

    it("allows a rejected milestone to be resubmitted", async () => {
      const { escrow, freelancer } =
        await rejectedEscrow();

      await escrow.write.submitMilestone(
        [0n, "QmResubmittedCID"],
        {
          account: freelancer.account,
        }
      );

      const milestone =
        await escrow.read.getMilestone([0n]);

      // Submitted = 1
      assert.equal(milestone[2], 1);
    });

    it("updates the deliverable CID on resubmission", async () => {
      const { escrow, freelancer } =
        await rejectedEscrow();

      await escrow.write.submitMilestone(
        [0n, "QmResubmittedCID"],
        {
          account: freelancer.account,
        }
      );

      const milestone =
        await escrow.read.getMilestone([0n]);

      assert.equal(
        milestone[3],
        "QmResubmittedCID"
      );
    });

    it("can approve a resubmitted milestone", async () => {
      const { escrow, client, freelancer } =
        await rejectedEscrow();

      await escrow.write.submitMilestone(
        [0n, "QmResubmittedCID"],
        {
          account: freelancer.account,
        }
      );

      await escrow.write.approveMilestone(
        [0n],
        {
          account: client.account,
        }
      );

      const milestone =
        await escrow.read.getMilestone([0n]);

      // Paid = 5
      assert.equal(milestone[2], 5);
    });

    it("pays only once after resubmission", async () => {
      const { escrow, client, freelancer } =
        await rejectedEscrow();

      await escrow.write.submitMilestone(
        [0n, "QmResubmittedCID"],
        {
          account: freelancer.account,
        }
      );

      await escrow.write.approveMilestone(
        [0n],
        {
          account: client.account,
        }
      );

      assert.equal(
        await escrow.read.totalEscrowed(),
        0n
      );

      await expectRevert(
        escrow.write.submitMilestone(
          [0n, "QmThirdAttempt"],
          {
            account: freelancer.account,
          }
        ),
        "TrustLance: invalid milestone state"
      );
    });
  });

  describe("Dispute Raising", () => {
    const amount = 1n * 10n ** 18n;

    async function rejectedEscrow() {
      const { viem } = await network.getOrCreate();

      const [client, freelancer, resolver, attacker] =
        await viem.getWalletClients();

      const escrow = await viem.deployContract(
        "TrustLanceEscrow",
        [
          client.account.address,
          resolver.account.address,
        ]
      );

      await escrow.write.fundEscrow(
        [
          [amount],
          ["Build website"],
        ],
        {
          account: client.account,
          value: amount,
        }
      );

      await escrow.write.awardFreelancer(
        [freelancer.account.address],
        {
          account: client.account,
        }
      );

      await escrow.write.submitMilestone(
        [0n, "QmWebsiteCID"],
        {
          account: freelancer.account,
        }
      );

      await escrow.write.rejectMilestone(
        [0n],
        {
          account: client.account,
        }
      );

      return {
        escrow,
        client,
        freelancer,
        resolver,
        attacker,
      };
    }

    it("allows the client to raise a dispute", async () => {
      const { escrow, client } =
        await rejectedEscrow();

      await escrow.write.raiseDispute(
        [0n],
        {
          account: client.account,
        }
      );

      const milestone =
        await escrow.read.getMilestone([0n]);

      // Disputed = 4
      assert.equal(milestone[2], 4);
    });

    it("allows the freelancer to raise a dispute", async () => {
      const { escrow, freelancer } =
        await rejectedEscrow();

      await escrow.write.raiseDispute(
        [0n],
        {
          account: freelancer.account,
        }
      );

      const milestone =
        await escrow.read.getMilestone([0n]);

      // Disputed = 4
      assert.equal(milestone[2], 4);
    });

    it("rejects a dispute from an unauthorized account", async () => {
      const { escrow, attacker } =
        await rejectedEscrow();

      await expectRevert(
        escrow.write.raiseDispute(
          [0n],
          {
            account: attacker.account,
          }
        ),
        "TrustLance: unauthorized"
      );
    });

    it("rejects a dispute for a pending milestone", async () => {
      const { viem } = await network.getOrCreate();

      const [client, freelancer, resolver] =
        await viem.getWalletClients();

      const escrow = await viem.deployContract(
        "TrustLanceEscrow",
        [
          client.account.address,
          resolver.account.address,
        ]
      );

      await escrow.write.fundEscrow(
        [
          [amount],
          ["Build website"],
        ],
        {
          account: client.account,
          value: amount,
        }
      );

      await escrow.write.awardFreelancer(
        [freelancer.account.address],
        {
          account: client.account,
        }
      );

      await expectRevert(
        escrow.write.raiseDispute(
          [0n],
          {
            account: client.account,
          }
        ),
        "TrustLance: milestone not rejected"
      );
    });

    it("rejects a dispute for a submitted milestone", async () => {
      const { viem } = await network.getOrCreate();

      const [client, freelancer, resolver] =
        await viem.getWalletClients();

      const escrow = await viem.deployContract(
        "TrustLanceEscrow",
        [
          client.account.address,
          resolver.account.address,
        ]
      );

      await escrow.write.fundEscrow(
        [
          [amount],
          ["Build website"],
        ],
        {
          account: client.account,
          value: amount,
        }
      );

      await escrow.write.awardFreelancer(
        [freelancer.account.address],
        {
          account: client.account,
        }
      );

      await escrow.write.submitMilestone(
        [0n, "QmWebsiteCID"],
        {
          account: freelancer.account,
        }
      );

      await expectRevert(
        escrow.write.raiseDispute(
          [0n],
          {
            account: client.account,
          }
        ),
        "TrustLance: milestone not rejected"
      );
    });

    it("rejects a dispute for an invalid milestone", async () => {
      const { escrow, client } =
        await rejectedEscrow();

      await expectRevert(
        escrow.write.raiseDispute(
          [99n],
          {
            account: client.account,
          }
        ),
        "TrustLance: invalid milestone"
      );
    });

    it("rejects raising the same dispute twice", async () => {
      const { escrow, client } =
        await rejectedEscrow();

      await escrow.write.raiseDispute(
        [0n],
        {
          account: client.account,
        }
      );

      await expectRevert(
        escrow.write.raiseDispute(
          [0n],
          {
            account: client.account,
          }
        ),
        "TrustLance: milestone not rejected"
      );
    });

    it("does not move funds when a dispute is raised", async () => {
      const { escrow, client } =
        await rejectedEscrow();

      assert.equal(
        await escrow.read.totalEscrowed(),
        amount
      );

      await escrow.write.raiseDispute(
        [0n],
        {
          account: client.account,
        }
      );

      assert.equal(
        await escrow.read.totalEscrowed(),
        amount
      );

      assert.equal(
        await escrow.read.getEscrowBalance(),
        amount
      );
    });
  });

  describe("Dispute Resolution", () => {
    const amount = 1n * 10n ** 18n;

    async function disputedEscrow() {
      const { viem } = await network.getOrCreate();
      const publicClient = await viem.getPublicClient();

      const [client, freelancer, resolver, attacker] =
        await viem.getWalletClients();

      const escrow = await viem.deployContract(
        "TrustLanceEscrow",
        [
          client.account.address,
          resolver.account.address,
        ]
      );

      await escrow.write.fundEscrow(
        [
          [amount],
          ["Build website"],
        ],
        {
          account: client.account,
          value: amount,
        }
      );

      await escrow.write.awardFreelancer(
        [freelancer.account.address],
        {
          account: client.account,
        }
      );

      await escrow.write.submitMilestone(
        [0n, "QmWebsiteCID"],
        {
          account: freelancer.account,
        }
      );

      await escrow.write.rejectMilestone(
        [0n],
        {
          account: client.account,
        }
      );

      await escrow.write.raiseDispute(
        [0n],
        {
          account: freelancer.account,
        }
      );

      return {
        escrow,
        client,
        freelancer,
        resolver,
        attacker,
        publicClient,
      };
    }

    it("allows the resolver to resolve a dispute in favor of the freelancer", async () => {
      const { escrow, resolver, freelancer } =
        await disputedEscrow();

      await escrow.write.resolveDispute(
        [0n, true],
        {
          account: resolver.account,
        }
      );

      const milestone =
        await escrow.read.getMilestone([0n]);

      // Paid = 5
      assert.equal(milestone[2], 5);

      const balance =
        await escrow.read.getEscrowBalance();

      assert.equal(balance, 0n);
    });

    it("pays the freelancer when the dispute favors the freelancer", async () => {
      const {
        escrow,
        resolver,
        freelancer,
        publicClient,
      } = await disputedEscrow();

      const before =
        await publicClient.getBalance({
          address: freelancer.account.address,
        });

      await escrow.write.resolveDispute(
        [0n, true],
        {
          account: resolver.account,
        }
      );

      const after =
        await publicClient.getBalance({
          address: freelancer.account.address,
        });

      assert.equal(
        after - before,
        amount
      );
    });

    it("allows the resolver to resolve a dispute in favor of the client", async () => {
      const { escrow, resolver } =
        await disputedEscrow();

      await escrow.write.resolveDispute(
        [0n, false],
        {
          account: resolver.account,
        }
      );

      const milestone =
        await escrow.read.getMilestone([0n]);

      // Paid = 5
      assert.equal(milestone[2], 5);

      assert.equal(
        await escrow.read.getEscrowBalance(),
        0n
      );
    });

    it("pays the client when the dispute favors the client", async () => {
      const {
        escrow,
        client,
        resolver,
        publicClient,
      } = await disputedEscrow();

      const before =
        await publicClient.getBalance({
          address: client.account.address,
        });

      await escrow.write.resolveDispute(
        [0n, false],
        {
          account: resolver.account,
        }
      );

      const after =
        await publicClient.getBalance({
          address: client.account.address,
        });

      assert.equal(
        after - before,
        amount
      );
    });

    it("reduces totalEscrowed after resolution", async () => {
      const { escrow, resolver } =
        await disputedEscrow();

      assert.equal(
        await escrow.read.totalEscrowed(),
        amount
      );

      await escrow.write.resolveDispute(
        [0n, true],
        {
          account: resolver.account,
        }
      );

      assert.equal(
        await escrow.read.totalEscrowed(),
        0n
      );
    });

    it("reduces the contract balance after resolution", async () => {
      const { escrow, resolver } =
        await disputedEscrow();

      assert.equal(
        await escrow.read.getEscrowBalance(),
        amount
      );

      await escrow.write.resolveDispute(
        [0n, false],
        {
          account: resolver.account,
        }
      );

      assert.equal(
        await escrow.read.getEscrowBalance(),
        0n
      );
    });

    it("rejects resolution from a non-resolver", async () => {
      const { escrow, attacker } =
        await disputedEscrow();

      await expectRevert(
        escrow.write.resolveDispute(
          [0n, true],
          {
            account: attacker.account,
          }
        ),
        "TrustLance: not resolver"
      );
    });

    it("rejects resolution from the client", async () => {
      const { escrow, client } =
        await disputedEscrow();

      await expectRevert(
        escrow.write.resolveDispute(
          [0n, true],
          {
            account: client.account,
          }
        ),
        "TrustLance: not resolver"
      );
    });

    it("rejects resolution from the freelancer", async () => {
      const { escrow, freelancer } =
        await disputedEscrow();

      await expectRevert(
        escrow.write.resolveDispute(
          [0n, true],
          {
            account: freelancer.account,
          }
        ),
        "TrustLance: not resolver"
      );
    });

    it("rejects resolution of a non-disputed milestone", async () => {
      const { viem } = await network.getOrCreate();

      const [client, freelancer, resolver] =
        await viem.getWalletClients();

      const escrow = await viem.deployContract(
        "TrustLanceEscrow",
        [
          client.account.address,
          resolver.account.address,
        ]
      );

      await escrow.write.fundEscrow(
        [
          [amount],
          ["Build website"],
        ],
        {
          account: client.account,
          value: amount,
        }
      );

      await escrow.write.awardFreelancer(
        [freelancer.account.address],
        {
          account: client.account,
        }
      );

      await expectRevert(
        escrow.write.resolveDispute(
          [0n, true],
          {
            account: resolver.account,
          }
        ),
        "TrustLance: milestone not disputed"
      );
    });

    it("rejects resolution of an invalid milestone", async () => {
      const { escrow, resolver } =
        await disputedEscrow();

      await expectRevert(
        escrow.write.resolveDispute(
          [99n, true],
          {
            account: resolver.account,
          }
        ),
        "TrustLance: invalid milestone"
      );
    });

    it("rejects resolving the same dispute twice", async () => {
      const { escrow, resolver } =
        await disputedEscrow();

      await escrow.write.resolveDispute(
        [0n, true],
        {
          account: resolver.account,
        }
      );

      await expectRevert(
        escrow.write.resolveDispute(
          [0n, false],
          {
            account: resolver.account,
          }
        ),
        "TrustLance: milestone not disputed"
      );
    });
  });

  describe("Project Cancellation", () => {
    const M1 = 1n * 10n ** 18n;
    const M2 = 2n * 10n ** 18n;
    const M3 = 3n * 10n ** 18n;

    async function fundedEscrow() {
      const { viem } = await network.getOrCreate();
      const publicClient = await viem.getPublicClient();

      const [client, freelancer, resolver, attacker] =
        await viem.getWalletClients();

      const escrow = await viem.deployContract(
        "TrustLanceEscrow",
        [
          client.account.address,
          resolver.account.address,
        ]
      );

      const total = M1 + M2 + M3;

      await escrow.write.fundEscrow(
        [
          [M1, M2, M3],
          [
            "Design",
            "Development",
            "Deployment",
          ],
        ],
        {
          account: client.account,
          value: total,
        }
      );

      await escrow.write.awardFreelancer(
        [freelancer.account.address],
        {
          account: client.account,
        }
      );

      return {
        escrow,
        client,
        freelancer,
        resolver,
        attacker,
        publicClient,
        total,
      };
    }

    it("allows the client to cancel the project", async () => {
      const { escrow, client } =
        await fundedEscrow();

      await escrow.write.cancelProject({
        account: client.account,
      });

      assert.equal(
        await escrow.read.cancelled(),
        true
      );
    });

    it("sets totalEscrowed to zero after cancellation", async () => {
      const { escrow, client } =
        await fundedEscrow();

      assert.equal(
        await escrow.read.totalEscrowed(),
        M1 + M2 + M3
      );

      await escrow.write.cancelProject({
        account: client.account,
      });

      assert.equal(
        await escrow.read.totalEscrowed(),
        0n
      );
    });

    it("refunds the remaining escrow to the client", async () => {
      const {
        escrow,
        client,
        publicClient,
        total,
      } = await fundedEscrow();

      const before =
        await publicClient.getBalance({
          address: client.account.address,
        });

      const hash = await escrow.write.cancelProject({
        account: client.account,
      });

      const receipt =
        await publicClient.waitForTransactionReceipt({
          hash,
        });

      const after =
        await publicClient.getBalance({
          address: client.account.address,
        });

      const gasCost =
        receipt.gasUsed * receipt.effectiveGasPrice;

      assert.equal(
        after - before + gasCost,
        total
      );
    });

    it("empties the contract balance after cancellation", async () => {
      const { escrow, client } =
        await fundedEscrow();

      assert.equal(
        await escrow.read.getEscrowBalance(),
        M1 + M2 + M3
      );

      await escrow.write.cancelProject({
        account: client.account,
      });

      assert.equal(
        await escrow.read.getEscrowBalance(),
        0n
      );
    });

    it("rejects cancellation from a non-client", async () => {
      const { escrow, freelancer } =
        await fundedEscrow();

      await expectRevert(
        escrow.write.cancelProject({
          account: freelancer.account,
        }),
        "TrustLance: not client"
      );
    });

    it("rejects cancellation from an attacker", async () => {
      const { escrow, attacker } =
        await fundedEscrow();

      await expectRevert(
        escrow.write.cancelProject({
          account: attacker.account,
        }),
        "TrustLance: not client"
      );
    });

    it("rejects cancellation twice", async () => {
      const { escrow, client } =
        await fundedEscrow();

      await escrow.write.cancelProject({
        account: client.account,
      });

      await expectRevert(
        escrow.write.cancelProject({
          account: client.account,
        }),
        "TrustLance: already cancelled"
      );
    });

    it("does not refund already-paid milestones", async () => {
      const {
        escrow,
        client,
        freelancer,
        publicClient,
      } = await fundedEscrow();

      // Submit and approve M1.
      await escrow.write.submitMilestone(
        [0n, "QmDesignCID"],
        {
          account: freelancer.account,
        }
      );

      await escrow.write.approveMilestone(
        [0n],
        {
          account: client.account,
        }
      );

      // Only M2 + M3 remain locked.
      assert.equal(
        await escrow.read.totalEscrowed(),
        M2 + M3
      );

      const before =
        await publicClient.getBalance({
          address: client.account.address,
        });

      const hash = await escrow.write.cancelProject({
        account: client.account,
      });

      const receipt =
        await publicClient.waitForTransactionReceipt({
          hash,
        });

      const after =
        await publicClient.getBalance({
          address: client.account.address,
        });

      const gasCost =
        receipt.gasUsed * receipt.effectiveGasPrice;

      assert.equal(
        after - before + gasCost,
        M2 + M3
      );

      assert.equal(
        await escrow.read.totalEscrowed(),
        0n
      );

      assert.equal(
        await escrow.read.getEscrowBalance(),
        0n
      );
    });

    it("preserves the Paid status of already-paid milestones", async () => {
      const {
        escrow,
        client,
        freelancer,
      } = await fundedEscrow();

      await escrow.write.submitMilestone(
        [0n, "QmDesignCID"],
        {
          account: freelancer.account,
        }
      );

      await escrow.write.approveMilestone(
        [0n],
        {
          account: client.account,
        }
      );

      await escrow.write.cancelProject({
        account: client.account,
      });

      const milestone =
        await escrow.read.getMilestone([0n]);

      // Paid = 5
      assert.equal(
        milestone[2],
        5
      );
    });

    it("preserves the Paid status of already-paid milestones", async () => {
      const {
        escrow,
        client,
        freelancer,
      } = await fundedEscrow();

      await escrow.write.submitMilestone(
        [0n, "QmDesignCID"],
        {
          account: freelancer.account,
        }
      );

      await escrow.write.approveMilestone(
        [0n],
        {
          account: client.account,
        }
      );

      const beforeCancel =
        await escrow.read.getMilestone([0n]);

      // Paid = 5
      assert.equal(
        beforeCancel[2],
        5
      );

      await escrow.write.cancelProject({
        account: client.account,
      });

      const afterCancel =
        await escrow.read.getMilestone([0n]);

      // Paid = 5
      assert.equal(
        afterCancel[2],
        5
      );
    });
  });

  describe("Post-Cancellation Protection", () => {
    const amount = 1n * 10n ** 18n;

    async function cancelledEscrow() {
      const { viem } = await network.getOrCreate();

      const [client, freelancer, resolver, attacker] =
        await viem.getWalletClients();

      const escrow = await viem.deployContract(
        "TrustLanceEscrow",
        [
          client.account.address,
          resolver.account.address,
        ]
      );

      await escrow.write.fundEscrow(
        [
          [amount],
          ["Build website"],
        ],
        {
          account: client.account,
          value: amount,
        }
      );

      await escrow.write.awardFreelancer(
        [freelancer.account.address],
        {
          account: client.account,
        }
      );

      await escrow.write.cancelProject({
        account: client.account,
      });

      return {
        escrow,
        client,
        freelancer,
        resolver,
        attacker,
      };
    }

    it("sets cancelled to true", async () => {
      const { escrow } = await cancelledEscrow();

      assert.equal(
        await escrow.read.cancelled(),
        true
      );
    });

    it("rejects funding after cancellation", async () => {
      const { escrow, client } =
        await cancelledEscrow();

      await expectRevert(
        escrow.write.fundEscrow(
          [
            [amount],
            ["Another milestone"],
          ],
          {
            account: client.account,
            value: amount,
          }
        ),
        "TrustLance: project cancelled"
      );
    });

    it("rejects awarding a freelancer after cancellation", async () => {
      const { escrow, client, attacker } =
        await cancelledEscrow();

      await expectRevert(
        escrow.write.awardFreelancer(
          [attacker.account.address],
          {
            account: client.account,
          }
        ),
        "TrustLance: project cancelled"
      );
    });

    it("rejects milestone submission after cancellation", async () => {
      const { escrow, freelancer } =
        await cancelledEscrow();

      await expectRevert(
        escrow.write.submitMilestone(
          [0n, "QmAfterCancellation"],
          {
            account: freelancer.account,
          }
        ),
        "TrustLance: project cancelled"
      );
    });

    it("rejects milestone approval after cancellation", async () => {
      const { escrow, client } =
        await cancelledEscrow();

      await expectRevert(
        escrow.write.approveMilestone(
          [0n],
          {
            account: client.account,
          }
        ),
        "TrustLance: project cancelled"
      );
    });

    it("rejects milestone rejection after cancellation", async () => {
      const { escrow, client } =
        await cancelledEscrow();

      await expectRevert(
        escrow.write.rejectMilestone(
          [0n],
          {
            account: client.account,
          }
        ),
        "TrustLance: project cancelled"
      );
    });

    it("rejects raising a dispute after cancellation", async () => {
      const { escrow, client } =
        await cancelledEscrow();

      await expectRevert(
        escrow.write.raiseDispute(
          [0n],
          {
            account: client.account,
          }
        ),
        "TrustLance: project cancelled"
      );
    });

    it("rejects dispute resolution after cancellation", async () => {
      const { escrow, resolver } =
        await cancelledEscrow();

      await expectRevert(
        escrow.write.resolveDispute(
          [0n, true],
          {
            account: resolver.account,
          }
        ),
        "TrustLance: project cancelled"
      );
    });

    it("keeps escrow balance at zero after cancellation", async () => {
      const { escrow } =
        await cancelledEscrow();

      assert.equal(
        await escrow.read.totalEscrowed(),
        0n
      );

      assert.equal(
        await escrow.read.getEscrowBalance(),
        0n
      );
    });

    it("keeps the freelancer assignment unchanged after cancellation", async () => {
      const {
        escrow,
        freelancer,
      } = await cancelledEscrow();

      const assigned =
        await escrow.read.freelancer();

      assert.equal(
        assigned.toLowerCase(),
        freelancer.account.address.toLowerCase()
      );
    });
  });

  describe("Events", () => {
    const amount = 1n * 10n ** 18n;

    it("emits ProjectFunded", async () => {
      const {
        escrow,
        client,
        publicClient,
      } = await deployFixture();

      const hash = await escrow.write.fundEscrow(
        [
          [amount],
          ["Build website"],
        ],
        {
          account: client.account,
          value: amount,
        }
      );

      const receipt =
        await publicClient.waitForTransactionReceipt({
          hash,
        });

      assert.equal(receipt.status, "success");

      const logs = receipt.logs.filter(
        (log) =>
          log.address.toLowerCase() ===
          escrow.address.toLowerCase()
      );

      assert.equal(logs.length, 1);
    });

    it("emits FreelancerAwarded", async () => {
      const {
        escrow,
        client,
        freelancer,
        publicClient,
      } = await deployFixture();

      await escrow.write.fundEscrow(
        [
          [amount],
          ["Build website"],
        ],
        {
          account: client.account,
          value: amount,
        }
      );

      const hash =
        await escrow.write.awardFreelancer(
          [freelancer.account.address],
          {
            account: client.account,
          }
        );

      const receipt =
        await publicClient.waitForTransactionReceipt({
          hash,
        });

      assert.equal(receipt.status, "success");

      const logs = receipt.logs.filter(
        (log) =>
          log.address.toLowerCase() ===
          escrow.address.toLowerCase()
      );

      assert.equal(logs.length, 1);
    });

    it("emits MilestoneSubmitted", async () => {
      const {
        escrow,
        client,
        freelancer,
        publicClient,
      } = await deployFixture();

      await escrow.write.fundEscrow(
        [
          [amount],
          ["Build website"],
        ],
        {
          account: client.account,
          value: amount,
        }
      );

      await escrow.write.awardFreelancer(
        [freelancer.account.address],
        {
          account: client.account,
        }
      );

      const hash =
        await escrow.write.submitMilestone(
          [0n, "QmWebsiteCID"],
          {
            account: freelancer.account,
          }
        );

      const receipt =
        await publicClient.waitForTransactionReceipt({
          hash,
        });

      assert.equal(receipt.status, "success");

      const logs = receipt.logs.filter(
        (log) =>
          log.address.toLowerCase() ===
          escrow.address.toLowerCase()
      );

      assert.equal(logs.length, 1);
    });

    it("emits MilestoneRejected", async () => {
      const {
        escrow,
        client,
        freelancer,
        publicClient,
      } = await deployFixture();

      await escrow.write.fundEscrow(
        [
          [amount],
          ["Build website"],
        ],
        {
          account: client.account,
          value: amount,
        }
      );

      await escrow.write.awardFreelancer(
        [freelancer.account.address],
        {
          account: client.account,
        }
      );

      await escrow.write.submitMilestone(
        [0n, "QmWebsiteCID"],
        {
          account: freelancer.account,
        }
      );

      const hash =
        await escrow.write.rejectMilestone(
          [0n],
          {
            account: client.account,
          }
        );

      const receipt =
        await publicClient.waitForTransactionReceipt({
          hash,
        });

      assert.equal(receipt.status, "success");

      const logs = receipt.logs.filter(
        (log) =>
          log.address.toLowerCase() ===
          escrow.address.toLowerCase()
      );

      assert.equal(logs.length, 1);
    });

    it("emits DisputeRaised", async () => {
      const {
        escrow,
        client,
        freelancer,
        publicClient,
      } = await deployFixture();

      await escrow.write.fundEscrow(
        [
          [amount],
          ["Build website"],
        ],
        {
          account: client.account,
          value: amount,
        }
      );

      await escrow.write.awardFreelancer(
        [freelancer.account.address],
        {
          account: client.account,
        }
      );

      await escrow.write.submitMilestone(
        [0n, "QmWebsiteCID"],
        {
          account: freelancer.account,
        }
      );

      await escrow.write.rejectMilestone(
        [0n],
        {
          account: client.account,
        }
      );

      const hash =
        await escrow.write.raiseDispute(
          [0n],
          {
            account: freelancer.account,
          }
        );

      const receipt =
        await publicClient.waitForTransactionReceipt({
          hash,
        });

      assert.equal(receipt.status, "success");

      const logs = receipt.logs.filter(
        (log) =>
          log.address.toLowerCase() ===
          escrow.address.toLowerCase()
      );

      assert.equal(logs.length, 1);
    });

    it("emits ProjectCancelled", async () => {
      const {
        escrow,
        client,
        publicClient,
      } = await deployFixture();

      await escrow.write.fundEscrow(
        [
          [amount],
          ["Build website"],
        ],
        {
          account: client.account,
          value: amount,
        }
      );

      const hash =
        await escrow.write.cancelProject({
          account: client.account,
        });

      const receipt =
        await publicClient.waitForTransactionReceipt({
          hash,
        });

      assert.equal(receipt.status, "success");

      const logs = receipt.logs.filter(
        (log) =>
          log.address.toLowerCase() ===
          escrow.address.toLowerCase()
      );

      assert.equal(logs.length, 1);
    });
  });



});