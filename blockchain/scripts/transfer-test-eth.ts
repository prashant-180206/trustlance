// scripts/fund-account.ts

import {
  createWalletClient,
  createPublicClient,
  http,
  parseEther,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

// Sample Hardhat private key.
// Replace this with one of your local Hardhat accounts.
const PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" as `0x${string}`;

// Account that should RECEIVE the test ETH
const RECIPIENT =
  "0xBa1C77D6DF4749Ee47ae92C9850aC4915443Fa5c" as `0x${string}`;


const localhost = {
  id: 31337,
  name: "Hardhat Local",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["http://127.0.0.1:8545"],
    },
  },
} as const;

// const PRIVATE_KEY =
//   "0xYOUR_TEST_PRIVATE_KEY" as `0x${string}`;

// const RECIPIENT =
//   "0xA88e2AB8883Ec40cB730fBCFC0d8d88b22811794" as `0x${string}`;

const account = privateKeyToAccount(PRIVATE_KEY);

const publicClient = createPublicClient({
  chain: localhost,
  transport: http("http://127.0.0.1:8545"),
});

const walletClient = createWalletClient({
  account,
  chain: localhost,
  transport: http("http://127.0.0.1:8545"),
});

async function main() {
  console.log("Sender:", account.address);
  console.log("Recipient:", RECIPIENT);

  const balance = await publicClient.getBalance({
    address: account.address,
  });

  console.log("Sender balance:", Number(balance) / 1e18, "ETH");

  const hash = await walletClient.sendTransaction({
    to: RECIPIENT,
    value: 10n * 10n ** 18n,
  });

  console.log("Transaction:", hash);

  const receipt = await publicClient.waitForTransactionReceipt({
    hash,
  });

  console.log("Confirmed in block:", receipt.blockNumber);

  const recipientBalance = await publicClient.getBalance({
    address: RECIPIENT,
  });

  console.log(
    "Recipient balance:",
    Number(recipientBalance) / 1e18,
    "ETH",
  );
}

main().catch(console.error);