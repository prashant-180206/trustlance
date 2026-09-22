import { createFileRoute, Link } from "@tanstack/react-router";

import { useCompanyProfile } from "../../../hooks/profile.hooks";
import { useAuth } from "../../../hooks/provider/AuthProvider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
// import { Button } from "../-components";



export const Route = createFileRoute("/company/profile/")({
    component: CompanyProfile,
});

function CompanyProfile() {
    const { user } = useAuth();
    const profileId = user?.id ?? "";

    const {
        data: profile,
        isLoading,
        error,
    } = useCompanyProfile(profileId);

    if (isLoading) {
        return <ProfileSkeleton />;
    }

    if (error || !profile) {
        return (
            <div className="mx-auto w-full max-w-5xl px-6 py-8">
                <Alert variant="destructive">
                    <AlertDescription>
                        {error?.message ??
                            "Company profile not found."}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    const initials = profile.company_name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0])
        .join("")
        .toUpperCase();

    return (
        <div className="mx-auto w-full max-w-5xl px-6 py-8">
            {/* Header */}
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <Avatar className="size-20 rounded-xl">
                        <AvatarFallback className="rounded-xl text-xl font-semibold">
                            {initials}
                        </AvatarFallback>
                    </Avatar>

                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-2xl font-semibold tracking-tight">
                                {profile.company_name}
                            </h1>

                            <Badge variant="secondary">
                                Company
                            </Badge>
                        </div>

                        {profile.industry && (
                            <p className="text-sm text-muted-foreground">
                                {profile.industry}
                            </p>
                        )}
                    </div>
                </div>

                <Button >
                    <Link to="/company/profile/update">
                        Edit Profile
                    </Link>
                </Button>
            </div>

            <Separator className="my-8" />

            {/* Main profile */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* About */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>About</CardTitle>

                        <CardDescription>
                            Information about your company.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        {profile.description ? (
                            <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                                {profile.description}
                            </p>
                        ) : (
                            <p className="text-sm italic text-muted-foreground">
                                No company description added yet.
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Company details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Company Details</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-5">
                        <ProfileField
                            label="Industry"
                            value={profile.industry}
                        />

                        <ProfileField
                            label="Website"
                            value={profile.website}
                            link
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Account information */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Account</CardTitle>

                    <CardDescription>
                        Information associated with your TrustLance
                        company profile.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <div className="grid gap-6 sm:grid-cols-2">
                        <ProfileField
                            label="Profile ID"
                            value={profile.profile_id}
                        />

                        <ProfileField
                            label="Created"
                            value={formatDate(profile.created_at)}
                        />

                        <ProfileField
                            label="Last updated"
                            value={formatDate(profile.updated_at)}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function ProfileField({
    label,
    value,
    link = false,
}: {
    label: string;
    value: string | null;
    link?: boolean;
}) {
    return (
        <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
            </p>

            {!value ? (
                <p className="text-sm text-muted-foreground">
                    Not provided
                </p>
            ) : link ? (
                <a
                    href={
                        value.startsWith("http")
                            ? value
                            : `https://${value}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="block break-all text-sm font-medium underline underline-offset-4"
                >
                    {value}
                </a>
            ) : (
                <p className="break-all text-sm font-medium">
                    {value}
                </p>
            )}
        </div>
    );
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
    }).format(new Date(value));
}

function ProfileSkeleton() {
    return (
        <div className="mx-auto w-full max-w-5xl px-6 py-8">
            <div className="flex items-center gap-4">
                <Skeleton className="size-20 rounded-xl" />

                <div className="space-y-2">
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-3">
                <Skeleton className="h-56 lg:col-span-2" />
                <Skeleton className="h-56" />
            </div>

            <Skeleton className="mt-6 h-40 w-full" />
        </div>
    );
}