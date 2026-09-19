import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TrustLanceFactoryModule = buildModule(
  "TrustLanceFactoryModule",
  (m) => {
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

    const factory = m.contract("TrustLanceFactory", [
      clientReviewPeriod,
      disputePeriod,
    ]);

    return {
      factory,
    };
  }
);

export default TrustLanceFactoryModule;