"use client";

import {
  useAccount,
  useConnect,
  useDisconnect,
  useChainId,
} from "wagmi";

function WalletTest() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();

  if (!isConnected) {
    return (
      <button
        onClick={() => connect({ connector: connectors[0] })}
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <div>
      <p>Connected: {address}</p>
      <p>Chain ID: {chainId}</p>

      <button onClick={() => disconnect()}>
        Disconnect
      </button>
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <WalletTest />
    </div>
  );
}
