
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
    ArrowLeft,
    ArrowRight,
    BriefcaseBusiness,
    Building2,
    Check,
    Loader2,
    Wallet,
} from "lucide-react";

import { useAuth } from "../../hooks/provider/AuthProvider";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

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

    const isPending = signInMutation.isPending;

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-muted/30 px-6 py-12">
            {/* Background */}
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-size-[4rem_4rem] opacity-30 mask-[radial-gradient(ellipse_at_center,black_20%,transparent_75%)]" />

            <div className="w-full max-w-md">
                {/* Header */}
                <div className="mb-8 text-center">
                    <Link
                        to="/"
                        className="inline-block text-xl font-semibold tracking-tight"
                    >
                        TrustLance
                    </Link>

                    <div className="mt-8">
                        <Badge variant="secondary" className="mb-4">
                            <Wallet className="mr-2 h-3.5 w-3.5" />
                            Wallet authentication
                        </Badge>

                        <h1 className="text-3xl font-bold tracking-tight">
                            Welcome to TrustLance
                        </h1>

                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            Connect your wallet to access your account.
                        </p>
                    </div>
                </div>

                {/* Authentication Card */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>Choose your account</CardTitle>
                        <CardDescription>
                            Select how you want to use TrustLance.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {/* Account Type */}
                        <div className="grid grid-cols-2 gap-3">
                            <AccountTypeButton
                                selected={accountType === "freelancer"}
                                disabled={isPending}
                                icon={<BriefcaseBusiness className="h-5 w-5" />}
                                title="Freelancer"
                                description="Find and work on projects"
                                onClick={() => setAccountType("freelancer")}
                            />

                            <AccountTypeButton
                                selected={accountType === "company"}
                                disabled={isPending}
                                icon={<Building2 className="h-5 w-5" />}
                                title="Company"
                                description="Hire trusted freelancers"
                                onClick={() => setAccountType("company")}
                            />
                        </div>

                        {/* Connect Wallet */}
                        <Button
                            type="button"
                            size="lg"
                            className="w-full"
                            disabled={isPending}
                            onClick={() => signInMutation.mutate()}
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Connecting...
                                </>
                            ) : (
                                <>
                                    <Wallet className="mr-2 h-4 w-4" />
                                    Connect Wallet
                                    <ArrowRight className="ml-auto h-4 w-4" />
                                </>
                            )}
                        </Button>

                        {/* Error */}
                        {signInMutation.isError && (
                            <Alert variant="destructive">
                                <AlertDescription>
                                    {signInMutation.error instanceof Error
                                        ? signInMutation.error.message
                                        : "Failed to connect wallet."}
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Terms */}
                        <p className="text-center text-xs leading-5 text-muted-foreground">
                            By connecting your wallet, you agree to use TrustLance
                            according to its platform rules.
                        </p>
                    </CardContent>
                </Card>

                {/* Back */}
                <div className="mt-6 text-center">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        <Link to="/">
                            Back to home
                        </Link>
                    </Button>
                </div>
            </div>
        </main>
    );
}

type AccountTypeButtonProps = {
    selected: boolean;
    disabled: boolean;
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
};

function AccountTypeButton({
    selected,
    disabled,
    icon,
    title,
    description,
    onClick,
}: AccountTypeButtonProps) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={[
                "relative flex min-h-32 flex-col rounded-lg border p-4 text-left",
                "transition-all duration-200",
                "disabled:cursor-not-allowed disabled:opacity-50",
                selected
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "bg-background hover:border-primary/50 hover:bg-muted/50",
            ].join(" ")}
        >
            {/* Selected indicator */}
            {selected && (
                <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground text-primary">
                    <Check className="h-3.5 w-3.5" />
                </div>
            )}

            <div
                className={[
                    "mb-4 flex h-9 w-9 items-center justify-center rounded-md",
                    selected
                        ? "bg-primary-foreground/10"
                        : "bg-muted",
                ].join(" ")}
            >
                {icon}
            </div>

            <span className="text-sm font-semibold">{title}</span>

            <span
                className={[
                    "mt-1 text-xs leading-5",
                    selected
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground",
                ].join(" ")}
            >
                {description}
            </span>
        </button>
    );
}

