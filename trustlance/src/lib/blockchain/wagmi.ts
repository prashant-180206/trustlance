// src/lib/wagmi.ts

import { createConfig, http } from "wagmi";
import { hardhat } from "wagmi/chains";
import { createPublicClient } from "viem";

export const config = createConfig({
    chains: [hardhat],

    transports: {
        [hardhat.id]: http("http://127.0.0.1:8545"),
    },
});

export const publicClient = createPublicClient({
    chain: hardhat,
    transport: http("http://127.0.0.1:8545"),
});