"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useConnection, useSignMessage, useSwitchChain } from "wagmi";

import {
  ConnectWalletButton,
} from "@/components/wallet/ConnectWalletButton";
import { hardhatLocal } from "@/lib/blockchain/config";
import { createClient } from "@/lib/supabase/client";
import {
  createSiweMessage,
  requestNonce,
  submitVerification,
} from "@/lib/siwe";

type Phase = "idle" | "signing" | "verifying" | "complete" | "error";

const ROLE_HOME: Record<string, string> = {
  client: "/dashboard/client",
  freelancer: "/dashboard/freelancer",
  admin: "/dashboard/admin",
};

const PHASE_LABEL: Record<Phase, string> = {
  idle: "Sign in with Ethereum",
  signing: "Awaiting signature\u2026",
  verifying: "Verifying signature\u2026",
  complete: "Signed in",
  error: "Try again",
};

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { address, chainId, isConnected } = useConnection();
  const { signMessageAsync } = useSignMessage();
  const { switchChain } = useSwitchChain();

  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);

  const redirectToHome = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    const role = data?.role ?? "client";
    router.push(ROLE_HOME[role] ?? ROLE_HOME.client);
    router.refresh();
  };

  // Snapshot any existing session on first load.
  useEffect(() => {
    let cancelled = false;

    supabase.auth.getUser().then(({ data }) => {
      if (cancelled || !data.user) return;
      setPhase("complete");
      void redirectToHome(data.user.id);
    });

    return () => {
      cancelled = true;
    };
  }, [supabase]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSignIn = async () => {
    if (!address || !isConnected) return;

    setError(null);
    setPhase("signing");

    try {
      if (chainId !== hardhatLocal.id) {
        await switchChain({ chainId: hardhatLocal.id });
      }
    } catch {
      setPhase("error");
      setError(
        "Your wallet is on the wrong network. Add and switch to the Hardhat Local network (chain 31337).",
      );
      return;
    }

    try {
      const nonce = await requestNonce(address);

      const message = createSiweMessage({
        address,
        chainId: hardhatLocal.id,
        nonce,
        domain: window.location.host,
        uri: window.location.origin,
      });

      const signature = await signMessageAsync({ message });

      setPhase("verifying");
      const { tokenHash } = await submitVerification(message, signature);

      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        type: "magiclink",
        token_hash: tokenHash,
      });
      if (verifyError) throw verifyError;
      if (!data.user) throw new Error("Sign-in did not produce a session.");

      setPhase("complete");
      await redirectToHome(data.user.id);
    } catch (e) {
      setPhase("error");
      setError(
        e instanceof Error && e.message
          ? e.message
          : "Sign-in failed. Please try again.",
      );
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setPhase("idle");
    setError(null);
    router.refresh();
  };

  const onWrongChain = isConnected && chainId !== hardhatLocal.id;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-4 dark:bg-black">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">TrustLance</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Sign in with your Ethereum wallet
          </p>
        </div>

        <div className="flex flex-col items-center gap-6">
          <ConnectWalletButton />

          {isConnected && (
            <button
              type="button"
              disabled={phase === "signing" || phase === "verifying"}
              onClick={handleSignIn}
              className="w-full rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {PHASE_LABEL[phase]}
            </button>
          )}

          {onWrongChain && (
            <p className="text-center text-sm text-amber-600 dark:text-amber-400">
              Connect to the Hardhat Local network (chain 31337), then sign in.
            </p>
          )}

          {error && (
            <p className="text-center text-sm text-red-500">{error}</p>
          )}

          {phase === "complete" && (
            <p className="text-center text-sm text-emerald-600 dark:text-emerald-400">
              Signed in as {address}
            </p>
          )}

          {phase !== "idle" && phase !== "error" && (
            <button
              type="button"
              onClick={handleSignOut}
              className="text-sm text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400"
            >
              Sign out
            </button>
          )}
        </div>
      </div>
    </div>
  );
}