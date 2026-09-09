"use client";

import {
    useAccount,
    useConnect,
    useDisconnect,
    useChainId,
} from "wagmi";

export function WalletTest() {
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