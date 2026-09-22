import { createFileRoute, Link } from "@tanstack/react-router";

import { useFreelancerProfile } from "../../../hooks/profile.hooks";
import { useAuth } from "../../../hooks/provider/AuthProvider";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/freelancer/profile/")({
  component: FreelancerProfile,
});

function FreelancerProfile() {
  const { user } = useAuth();
  const profileId = user?.id ?? "";

  const {
    data: profile,
    isLoading,
    error,
  } = useFreelancerProfile(profileId);

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (error || !profile) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-8">
        <Alert variant="destructive">
          <AlertDescription>
            {error?.message ??
              "Freelancer profile not found."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const displayName =
    user?.user_metadata?.display_name as string ??
    "Freelancer" as string;

  const initials = displayName
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
                {displayName}
              </h1>

              <Badge variant="secondary">
                Freelancer
              </Badge>
            </div>

            {profile.headline && (
              <p className="text-sm text-muted-foreground">
                {profile.headline}
              </p>
            )}
          </div>
        </div>

        <Button >
          <Link to="/freelancer/profile/update">
            Edit Profile
          </Link>
        </Button>
      </div>

      <Separator className="my-8" />

      {/* Profile content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* About */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>About</CardTitle>

            <CardDescription>
              Tell clients about yourself and your
              experience.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {profile.bio ? (
              <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                {profile.bio}
              </p>
            ) : (
              <p className="text-sm italic text-muted-foreground">
                No bio added yet.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Professional details */}
        <Card>
          <CardHeader>
            <CardTitle>Professional Details</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            <ProfileField
              label="Experience"
              value={profile.experience}
            />

            <ProfileField
              label="Hourly rate"
              value={
                profile.hourly_rate !== null
                  ? `$${profile.hourly_rate}/hr`
                  : null
              }
            />

            <div className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Availability
              </p>

              <Badge
                variant={
                  profile.availability
                    ? "default"
                    : "secondary"
                }
              >
                {profile.availability
                  ? "Available"
                  : "Unavailable"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile information */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>

          <CardDescription>
            Information associated with your TrustLance
            freelancer profile.
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
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      {value ? (
        <p className="wrap-break-word text-sm font-medium">
          {value}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Not provided
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
          <Skeleton className="h-4 w-56" />
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