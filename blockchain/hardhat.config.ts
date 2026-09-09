import { defineConfig } from "hardhat/config";
import hardhatToolboxViem from "@nomicfoundation/hardhat-toolbox-viem";

export default defineConfig({
  plugins: [hardhatToolboxViem],

  solidity: {
    version: "0.8.24",
  },

  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
  },
});