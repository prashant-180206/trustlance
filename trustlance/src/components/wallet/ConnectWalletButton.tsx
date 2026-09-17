"use client";

import { useEffect } from "react";
import { useConnection, useConnect, useDisconnect } from "wagmi";

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}\u2026${address.slice(-4)}`;
}

export interface ConnectWalletButtonProps {
  onConnectionChange?: (address: string | undefined) => void;
}

export function ConnectWalletButton({
  onConnectionChange,
}: ConnectWalletButtonProps) {
  const { address, isConnected } = useConnection();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    if (onConnectionChange) {
      onConnectionChange(isConnected ? address : undefined);
    }
  }, [isConnected, address, onConnectionChange]);

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-zinc-300 px-4 py-2">
        <span className="inline-block size-2 rounded-full bg-emerald-500" />
        <span className="font-mono text-sm">{truncateAddress(address)}</span>
        <button
          type="button"
          onClick={() => disconnect()}
          className="text-sm text-zinc-500 underline-offset-2 hover:underline"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        disabled={isPending || connectors.length === 0}
        onClick={() => connect({ connector: connectors[0] })}
        className="rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Connecting\u2026" : "Connect Wallet"}
      </button>
      {error && (
        <p className="text-sm text-red-500">
          {error.name === "ConnectorAlreadyConnectedError"
            ? "This wallet is already connected."
            : error.shortMessage ?? error.message}
        </p>
      )}
    </div>
  );
}