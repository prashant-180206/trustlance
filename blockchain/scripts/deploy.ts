import { network } from "hardhat";

async function main() {
  const { viem } = await network.getOrCreate();

  const [deployer] = await viem.getWalletClients();

  console.log("Deploying with:");
  console.log("Deployer:", deployer.account.address);

  // For local development, use the second account as the resolver.
  const walletClients = await viem.getWalletClients();
  const resolver = walletClients[1];

  console.log("Resolver:", resolver.account.address);

  const factory = await viem.deployContract(
    "TrustLanceFactory",
    [resolver.account.address]
  );

  console.log("\nDeployment complete");
  console.log("-------------------");
  console.log("TrustLanceFactory:", factory.address);
  console.log("Dispute Resolver:", resolver.account.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});