// src/lib/wagmi.ts

import {
    createConfig,
    http,
} from "wagmi";

import {
    createPublicClient,
    defineChain,
} from "viem";


export const hardhatLocal =
    defineChain({
        id: 31337,
        name: "Hardhat Local",

        nativeCurrency: {
            name: "Ether",
            symbol: "ETH",
            decimals: 18,
        },

        rpcUrls: {
            default: {
                http: [
                    "http://127.0.0.1:8545",
                ],
            },
        },
    });


export const config =
    createConfig({
        chains: [
            hardhatLocal,
        ],

        transports: {
            [hardhatLocal.id]:
                http("http://127.0.0.1:8545"),
        },
    });

export const publicClient =
    createPublicClient({
        chain: hardhatLocal,
        transport: http(
            "http://127.0.0.1:8545",
        ),
    });