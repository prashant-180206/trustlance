
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";

const REVIEW_PERIOD = 7n * 24n * 60n * 60n;
const DISPUTE_PERIOD = 3n * 24n * 60n * 60n;

const MILESTONE_AMOUNT = 1n * 10n ** 18n;

async function deployEscrow() {
  const { viem } = await network.getOrCreate();

  const [client, freelancer, other] =
    await viem.getWalletClients();

  const escrow = await viem.deployContract(
    "TrustLanceEscrow",
    [
      client.account.address,
      REVIEW_PERIOD,
      DISPUTE_PERIOD,
    ],
  );

  return {
    viem,
    escrow,
    client,
    freelancer,
    other,
  };
}

async function fundAndAward(
  escrow: any,
  client: any,
  freelancer: any,
  amount = MILESTONE_AMOUNT,
) {
  await escrow.write.fundEscrow(
    [
      [amount],
      ["Build website"],
    ],
    {
      account: client.account,
      value: amount,
    },
  );

  await escrow.write.awardFreelancer(
    [freelancer.account.address],
    {
      account: client.account,
    },
  );
}

async function submitMilestone(
  escrow: any,
  freelancer: any,
  index = 0,
) {
  await escrow.write.submitMilestone(
    [
      index,
      "QmTestDeliverableCID",
    ],
    {
      account: freelancer.account,
    },
  );
}

async function increaseTime(seconds: bigint) {
  const { networkHelpers } = await network.getOrCreate();

  await networkHelpers.time.increase(Number(seconds));
}

// =============================================================
// DEPLOYMENT
// =============================================================

describe("TrustLanceEscrow - Deployment", () => {

  it("sets client and dispute rules correctly", async () => {
    const {
      escrow,
      client,
    } = await deployEscrow();

    assert.equal(
      (await escrow.read.client()).toLowerCase(),
      client.account.address.toLowerCase(),
    );

    assert.equal(
      await escrow.read.clientReviewPeriod(),
      REVIEW_PERIOD,
    );

    assert.equal(
      await escrow.read.disputePeriod(),
      DISPUTE_PERIOD,
    );

    assert.equal(
      await escrow.read.funded(),
      false,
    );

    assert.equal(
      await escrow.read.cancelled(),
      false,
    );
  });
});

// =============================================================
// FUNDING
// =============================================================

describe("TrustLanceEscrow - Funding", () => {

  it("funds escrow and creates milestones", async () => {
    const {
      escrow,
      client,
    } = await deployEscrow();

    await escrow.write.fundEscrow(
      [
        [1n, 2n],
        ["Design", "Development"],
      ],
      {
        account: client.account,
        value: 3n,
      },
    );

    assert.equal(
      await escrow.read.funded(),
      true,
    );

    assert.equal(
      await escrow.read.totalEscrowed(),
      3n,
    );

    assert.equal(
      await escrow.read.getMilestoneCount(),
      2n,
    );
  });

  it("rejects incorrect ETH amount", async () => {
    const {
      escrow,
      client,
    } = await deployEscrow();

    await assert.rejects(
      escrow.write.fundEscrow(
        [
          [1n],
          ["Design"],
        ],
        {
          account: client.account,
          value: 2n,
        },
      ),
    );
  });

  it("cannot be funded twice", async () => {
    const {
      escrow,
      client,
    } = await deployEscrow();

    await escrow.write.fundEscrow(
      [
        [1n],
        ["Design"],
      ],
      {
        account: client.account,
        value: 1n,
      },
    );

    await assert.rejects(
      escrow.write.fundEscrow(
        [
          [1n],
          ["Another milestone"],
        ],
        {
          account: client.account,
          value: 1n,
        },
      ),
    );
  });
});

// =============================================================
// FREELANCER
// =============================================================

describe("TrustLanceEscrow - Freelancer", () => {

  it("allows client to award freelancer", async () => {
    const {
      escrow,
      client,
      freelancer,
    } = await deployEscrow();

    await fundAndAward(
      escrow,
      client,
      freelancer,
    );

    assert.equal(
      (await escrow.read.freelancer()).toLowerCase(),
      freelancer.account.address.toLowerCase(),
    );
  });

  it("prevents non-client from awarding freelancer", async () => {
    const {
      escrow,
      client,
      freelancer,
      other,
    } = await deployEscrow();

    await escrow.write.fundEscrow(
      [
        [MILESTONE_AMOUNT],
        ["Build website"],
      ],
      {
        account: client.account,
        value: MILESTONE_AMOUNT,
      },
    );

    await assert.rejects(
      escrow.write.awardFreelancer(
        [freelancer.account.address],
        {
          account: other.account,
        },
      ),
    );
  });
});

// =============================================================
// SUBMISSION
// =============================================================

describe("TrustLanceEscrow - Milestone Submission", () => {

  it("allows freelancer to submit milestone", async () => {
    const {
      escrow,
      client,
      freelancer,
    } = await deployEscrow();

    await fundAndAward(
      escrow,
      client,
      freelancer,
    );

    await submitMilestone(
      escrow,
      freelancer,
    );

    const milestone =
      await escrow.read.getMilestone([0n]);

    assert.equal(
      milestone[2],
      1, // Submitted
    );

    assert.equal(
      milestone[3],
      "QmTestDeliverableCID",
    );

    assert.ok(
      milestone[4] > 0n,
    );

    assert.ok(
      milestone[5] > milestone[4],
    );
  });

  it("prevents client from submitting milestone", async () => {
    const {
      escrow,
      client,
      freelancer,
    } = await deployEscrow();

    await fundAndAward(
      escrow,
      client,
      freelancer,
    );

    await assert.rejects(
      escrow.write.submitMilestone(
        [
          0n,
          "QmTestCID",
        ],
        {
          account: client.account,
        },
      ),
    );
  });
});

// =============================================================
// MANUAL APPROVAL
// =============================================================

describe("TrustLanceEscrow - Approval", () => {

  it("pays freelancer when client approves", async () => {
    const {
      escrow,
      client,
      freelancer,
    } = await deployEscrow();

    await fundAndAward(
      escrow,
      client,
      freelancer,
    );

    await submitMilestone(
      escrow,
      freelancer,
    );

    const before =
      await escrow.read.getEscrowBalance();

    await escrow.write.approveMilestone(
      [0n],
      {
        account: client.account,
      },
    );

    const after =
      await escrow.read.getEscrowBalance();

    assert.equal(
      before - after,
      MILESTONE_AMOUNT,
    );

    const milestone =
      await escrow.read.getMilestone([0n]);

    assert.equal(
      milestone[2],
      5, // Paid
    );

    assert.equal(
      await escrow.read.totalEscrowed(),
      0n,
    );
  });
});

// =============================================================
// AUTOMATIC APPROVAL
// =============================================================

describe("TrustLanceEscrow - Automatic Approval", () => {

  it("automatically pays freelancer after review deadline", async () => {
    const {
      escrow,
      client,
      freelancer,
    } = await deployEscrow();

    await fundAndAward(
      escrow,
      client,
      freelancer,
    );

    await submitMilestone(
      escrow,
      freelancer,
    );

    await increaseTime(
      REVIEW_PERIOD + 1n,
    );

    await escrow.write.autoApproveMilestone(
      [0n],
      {
        account: client.account,
      },
    );

    const milestone =
      await escrow.read.getMilestone([0n]);

    assert.equal(
      milestone[2],
      5, // Paid
    );

    assert.equal(
      await escrow.read.totalEscrowed(),
      0n,
    );
  });

  it("cannot auto-approve before deadline", async () => {
    const {
      escrow,
      client,
      freelancer,
    } = await deployEscrow();

    await fundAndAward(
      escrow,
      client,
      freelancer,
    );

    await submitMilestone(
      escrow,
      freelancer,
    );

    await assert.rejects(
      escrow.write.autoApproveMilestone(
        [0n],
        {
          account: client.account,
        },
      ),
    );
  });
});

// =============================================================
// REJECTION
// =============================================================

describe("TrustLanceEscrow - Rejection", () => {

  it("allows client to reject submitted milestone", async () => {
    const {
      escrow,
      client,
      freelancer,
    } = await deployEscrow();

    await fundAndAward(
      escrow,
      client,
      freelancer,
    );

    await submitMilestone(
      escrow,
      freelancer,
    );

    await escrow.write.rejectMilestone(
      [0n],
      {
        account: client.account,
      },
    );

    const milestone =
      await escrow.read.getMilestone([0n]);

    assert.equal(
      milestone[2],
      3, // Rejected
    );

    assert.equal(
      await escrow.read.totalEscrowed(),
      MILESTONE_AMOUNT,
    );
  });
});

// =============================================================
// DISPUTE
// =============================================================

describe("TrustLanceEscrow - Disputes", () => {

  it("allows freelancer to dispute rejection", async () => {
    const {
      escrow,
      client,
      freelancer,
    } = await deployEscrow();

    await fundAndAward(
      escrow,
      client,
      freelancer,
    );

    await submitMilestone(
      escrow,
      freelancer,
    );

    await escrow.write.rejectMilestone(
      [0n],
      {
        account: client.account,
      },
    );

    await escrow.write.raiseDispute(
      [0n],
      {
        account: freelancer.account,
      },
    );

    const milestone =
      await escrow.read.getMilestone([0n]);

    assert.equal(
      milestone[2],
      4, // Disputed
    );

    assert.ok(
      milestone[6] > 0n,
    );
  });

  it("client can withdraw rejection and pay freelancer", async () => {
    const {
      escrow,
      client,
      freelancer,
    } = await deployEscrow();

    await fundAndAward(
      escrow,
      client,
      freelancer,
    );

    await submitMilestone(
      escrow,
      freelancer,
    );

    await escrow.write.rejectMilestone(
      [0n],
      {
        account: client.account,
      },
    );

    await escrow.write.raiseDispute(
      [0n],
      {
        account: freelancer.account,
      },
    );

    await escrow.write.withdrawRejection(
      [0n],
      {
        account: client.account,
      },
    );

    const milestone =
      await escrow.read.getMilestone([0n]);

    assert.equal(
      milestone[2],
      5, // Paid
    );

    assert.equal(
      await escrow.read.totalEscrowed(),
      0n,
    );
  });

  it("freelancer can accept rejection and refund client", async () => {
    const {
      escrow,
      client,
      freelancer,
    } = await deployEscrow();

    await fundAndAward(
      escrow,
      client,
      freelancer,
    );

    await submitMilestone(
      escrow,
      freelancer,
    );

    await escrow.write.rejectMilestone(
      [0n],
      {
        account: client.account,
      },
    );

    await escrow.write.raiseDispute(
      [0n],
      {
        account: freelancer.account,
      },
    );

    await escrow.write.acceptRejection(
      [0n],
      {
        account: freelancer.account,
      },
    );

    const milestone =
      await escrow.read.getMilestone([0n]);

    assert.equal(
      milestone[2],
      6, // Refunded
    );

    assert.equal(
      await escrow.read.totalEscrowed(),
      0n,
    );
  });

  it("automatically pays freelancer after dispute deadline", async () => {
    const {
      escrow,
      client,
      freelancer,
    } = await deployEscrow();

    await fundAndAward(
      escrow,
      client,
      freelancer,
    );

    await submitMilestone(
      escrow,
      freelancer,
    );

    await escrow.write.rejectMilestone(
      [0n],
      {
        account: client.account,
      },
    );

    await escrow.write.raiseDispute(
      [0n],
      {
        account: freelancer.account,
      },
    );

    await increaseTime(
      DISPUTE_PERIOD + 1n,
    );

    await escrow.write.autoResolveDispute(
      [0n],
      {
        account: client.account,
      },
    );

    const milestone =
      await escrow.read.getMilestone([0n]);

    assert.equal(
      milestone[2],
      5, // Paid
    );

    assert.equal(
      await escrow.read.totalEscrowed(),
      0n,
    );
  });

  it("cannot automatically resolve dispute before deadline", async () => {
    const {
      escrow,
      client,
      freelancer,
    } = await deployEscrow();

    await fundAndAward(
      escrow,
      client,
      freelancer,
    );

    await submitMilestone(
      escrow,
      freelancer,
    );

    await escrow.write.rejectMilestone(
      [0n],
      {
        account: client.account,
      },
    );

    await escrow.write.raiseDispute(
      [0n],
      {
        account: freelancer.account,
      },
    );

    await assert.rejects(
      escrow.write.autoResolveDispute(
        [0n],
        {
          account: client.account,
        },
      ),
    );
  });
});

// =============================================================
// MUTUAL CANCELLATION
// =============================================================

describe("TrustLanceEscrow - Mutual Cancellation", () => {

  it("cancels project when both parties agree", async () => {
    const {
      escrow,
      client,
      freelancer,
    } = await deployEscrow();

    await fundAndAward(
      escrow,
      client,
      freelancer,
    );

    await escrow.write.requestCancellation(

      {
        account: client.account,
      },
    );

    assert.equal(
      await escrow.read.clientCancellationRequested(),
      true,
    );

    assert.equal(
      await escrow.read.cancelled(),
      false,
    );

    await escrow.write.requestCancellation(

      {
        account: freelancer.account,
      },
    );

    assert.equal(
      await escrow.read.freelancerCancellationRequested(),
      true,
    );

    assert.equal(
      await escrow.read.cancelled(),
      true,
    );

    assert.equal(
      await escrow.read.totalEscrowed(),
      0n,
    );
  });

  it("does not cancel when only one party agrees", async () => {
    const {
      escrow,
      client,
      freelancer,
    } = await deployEscrow();

    await fundAndAward(
      escrow,
      client,
      freelancer,
    );

    await escrow.write.requestCancellation(

      {
        account: client.account,
      },
    );

    assert.equal(
      await escrow.read.cancelled(),
      false,
    );

    assert.equal(
      await escrow.read.totalEscrowed(),
      MILESTONE_AMOUNT,
    );
  });
});

// =============================================================
// CANCEL BEFORE AWARD
// =============================================================

describe("TrustLanceEscrow - Cancellation Before Award", () => {

  it("allows client to cancel before freelancer is assigned", async () => {
    const {
      escrow,
      client,
    } = await deployEscrow();

    await escrow.write.fundEscrow(
      [
        [MILESTONE_AMOUNT],
        ["Build website"],
      ],
      {
        account: client.account,
        value: MILESTONE_AMOUNT,
      },
    );

    await escrow.write.cancelProjectBeforeAward(

      {
        account: client.account,
      },
    );

    assert.equal(
      await escrow.read.cancelled(),
      true,
    );

    assert.equal(
      await escrow.read.totalEscrowed(),
      0n,
    );
  });

  it("cannot use pre-award cancellation after freelancer is assigned", async () => {
    const {
      escrow,
      client,
      freelancer,
    } = await deployEscrow();

    await fundAndAward(
      escrow,
      client,
      freelancer,
    );

    await assert.rejects(
      escrow.write.cancelProjectBeforeAward(

        {
          account: client.account,
        },
      ),
    );
  });
});

// =============================================================
// AUTHORIZATION / INVALID STATES
// =============================================================

describe("TrustLanceEscrow - Security Rules", () => {

  it("prevents non-client from approving", async () => {
    const {
      escrow,
      client,
      freelancer,
    } = await deployEscrow();

    await fundAndAward(
      escrow,
      client,
      freelancer,
    );

    await submitMilestone(
      escrow,
      freelancer,
    );

    await assert.rejects(
      escrow.write.approveMilestone(
        [0n],
        {
          account: freelancer.account,
        },
      ),
    );
  });

  it("prevents non-client from rejecting", async () => {
    const {
      escrow,
      client,
      freelancer,
    } = await deployEscrow();

    await fundAndAward(
      escrow,
      client,
      freelancer,
    );

    await submitMilestone(
      escrow,
      freelancer,
    );

    await assert.rejects(
      escrow.write.rejectMilestone(
        [0n],
        {
          account: freelancer.account,
        },
      ),
    );
  });

  it("prevents non-freelancer from raising dispute", async () => {
    const {
      escrow,
      client,
      freelancer,
      other,
    } = await deployEscrow();

    await fundAndAward(
      escrow,
      client,
      freelancer,
    );

    await submitMilestone(
      escrow,
      freelancer,
    );

    await escrow.write.rejectMilestone(
      [0n],
      {
        account: client.account,
      },
    );

    await assert.rejects(
      escrow.write.raiseDispute(
        [0n],
        {
          account: other.account,
        },
      ),
    );
  });

  it("prevents dispute from being raised on a non-rejected milestone", async () => {
    const {
      escrow,
      client,
      freelancer,
    } = await deployEscrow();

    await fundAndAward(
      escrow,
      client,
      freelancer,
    );

    await submitMilestone(
      escrow,
      freelancer,
    );

    await assert.rejects(
      escrow.write.raiseDispute(
        [0n],
        {
          account: freelancer.account,
        },
      ),
    );
  });
});
