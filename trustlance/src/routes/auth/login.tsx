
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../../hooks/provider/AuthProvider";

// import { useAuth } from "../../contexts/AuthContext";

export const Route = createFileRoute("/auth/login")({
    component: LoginPage,
});

function LoginPage() {
    const { signIn } = useAuth();
    const navigate = useNavigate();

    const [accountType, setAccountType] = useState<
        "freelancer" | "company"
    >("freelancer");

    const signInMutation = useMutation({
        mutationFn: () => signIn(accountType),

        onSuccess: async () => {
            await navigate({
                to:
                    accountType === "freelancer"
                        ? "/freelancer/dashboard"
                        : "/company/dashboard",
            });
        },
    });

    return (
        <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
            <div className="w-full max-w-md">
                {/* Logo / Heading */}
                <div className="mb-10 text-center">
                    <Link
                        to="/"
                        className="text-xl font-bold tracking-tight text-zinc-950"
                    >
                        TrustLance
                    </Link>

                    <h1 className="mt-8 text-3xl font-bold tracking-tight text-zinc-950">
                        Welcome to TrustLance
                    </h1>

                    <p className="mt-2 text-sm leading-6 text-zinc-500">
                        Connect your wallet to continue.
                    </p>
                </div>

                {/* Authentication Card */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                    {/* Account Type */}
                    <div>
                        <h2 className="text-sm font-semibold text-zinc-900">
                            Continue as
                        </h2>

                        <div className="mt-3 grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setAccountType("freelancer")}
                                disabled={signInMutation.isPending}
                                className={`rounded-xl border px-4 py-4 text-left transition ${accountType === "freelancer"
                                        ? "border-zinc-950 bg-zinc-950 text-white"
                                        : "border-zinc-200 bg-white text-zinc-900 hover:border-zinc-400"
                                    }`}
                            >
                                <div className="text-sm font-semibold">
                                    Freelancer
                                </div>

                                <div
                                    className={`mt-1 text-xs ${accountType === "freelancer"
                                            ? "text-zinc-300"
                                            : "text-zinc-500"
                                        }`}
                                >
                                    Find and work on projects
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setAccountType("company")}
                                disabled={signInMutation.isPending}
                                className={`rounded-xl border px-4 py-4 text-left transition ${accountType === "company"
                                        ? "border-zinc-950 bg-zinc-950 text-white"
                                        : "border-zinc-200 bg-white text-zinc-900 hover:border-zinc-400"
                                    }`}
                            >
                                <div className="text-sm font-semibold">
                                    Company
                                </div>

                                <div
                                    className={`mt-1 text-xs ${accountType === "company"
                                            ? "text-zinc-300"
                                            : "text-zinc-500"
                                        }`}
                                >
                                    Hire trusted freelancers
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Connect Wallet */}
                    <button
                        type="button"
                        onClick={() => signInMutation.mutate()}
                        disabled={signInMutation.isPending}
                        className="mt-6 w-full rounded-xl bg-zinc-950 px-4 py-3.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {signInMutation.isPending
                            ? "Connecting..."
                            : "Connect Wallet"}
                    </button>

                    {/* Error */}
                    {signInMutation.isError && (
                        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                            {signInMutation.error instanceof Error
                                ? signInMutation.error.message
                                : "Failed to connect wallet."}
                        </div>
                    )}

                    <p className="mt-5 text-center text-xs leading-5 text-zinc-400">
                        By connecting your wallet, you agree to use TrustLance
                        according to its platform rules.
                    </p>
                </div>

                {/* Back */}
                <div className="mt-6 text-center">
                    <Link
                        to="/"
                        className="text-sm text-zinc-500 transition hover:text-zinc-950"
                    >
                        ← Back to home
                    </Link>
                </div>
            </div>
        </main>
    );
}

