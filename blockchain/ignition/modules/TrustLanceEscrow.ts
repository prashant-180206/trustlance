import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TrustLanceEscrowModule = buildModule(
  "TrustLanceEscrowModule",
  (m) => {
    const client = m.getParameter(
      "client",
      "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
    );

    // 7 days
    const clientReviewPeriod = m.getParameter(
      "clientReviewPeriod",
      7n * 24n * 60n * 60n
    );

    // 3 days
    const disputePeriod = m.getParameter(
      "disputePeriod",
      3n * 24n * 60n * 60n
    );

    const escrow = m.contract("TrustLanceEscrow", [
      client,
      clientReviewPeriod,
      disputePeriod,
    ]);

    return {
      escrow,
    };
  }
);

export default TrustLanceEscrowModule;