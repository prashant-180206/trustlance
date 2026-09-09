import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { hardhatLocal } from "./config";

export const wagmiConfig = createConfig({
  chains: [hardhatLocal],

  connectors: [
    injected(),
  ],

  transports: {
    [hardhatLocal.id]: http(
      process.env.NEXT_PUBLIC_RPC_URL,
    ),
  },
});