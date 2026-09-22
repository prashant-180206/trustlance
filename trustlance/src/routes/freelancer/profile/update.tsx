import {
  createFileRoute,
  Link,
  useNavigate,
} from "@tanstack/react-router";

import { useEffect, useState } from "react";

import {
  useFreelancerProfile,
  useUpdateFreelancerProfile,
} from "../../../hooks/profile.hooks";

import { useAuth } from "../../../hooks/provider/AuthProvider";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute(
  "/freelancer/profile/update",
)({
  component: FreelancerProfileNew,
});

function FreelancerProfileNew() {
  const navigate = useNavigate();

  const { user } = useAuth();
  const profileId = user?.id ?? "";

  const {
    data: profile,
    isLoading,
    error: profileError,
  } = useFreelancerProfile(profileId);

  const update = useUpdateFreelancerProfile();

  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [experience, setExperience] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");

  /*
   * Populate the form once the profile is loaded.
   */
  useEffect(() => {
    if (!profile) return;

    setHeadline(profile.headline ?? "");
    setBio(profile.bio ?? "");
    setExperience(profile.experience ?? "");

    setHourlyRate(
      profile.hourly_rate !== null
        ? String(profile.hourly_rate)
        : "",
    );
  }, [profile]);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-8">
        <div className="space-y-2">
          <div className="h-8 w-52 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-80 animate-pulse rounded-md bg-muted" />
        </div>

        <div className="mt-8 h-125 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!profileId) return;

    const parsedHourlyRate =
      hourlyRate.trim() === ""
        ? null
        : Number(hourlyRate);

    update.mutate(
      {
        profileId,

        updates: {
          headline: headline.trim() || null,

          bio: bio.trim() || null,

          experience:
            experience.trim() || null,

          hourly_rate:
            parsedHourlyRate,
        },
      },
      {
        onSuccess: () => {
          navigate({
            to: "/freelancer/profile",
          });
        },
      },
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          {profile
            ? "Edit freelancer profile"
            : "Create freelancer profile"}
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Update the information clients see on your
          TrustLance profile.
        </p>
      </div>

      {/* Errors */}
      {(profileError || update.error) && (
        <Alert
          variant="destructive"
          className="mb-6"
        >
          <AlertDescription>
            {update.error?.message ??
              profileError?.message ??
              "Something went wrong."}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Professional information</CardTitle>

          <CardDescription>
            Give clients a clear picture of your skills,
            experience, and pricing.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Headline */}
            <div className="space-y-2">
              <Label htmlFor="headline">
                Headline
              </Label>

              <Input
                id="headline"
                value={headline}
                onChange={(event) =>
                  setHeadline(
                    event.target.value,
                  )
                }
                placeholder="Full-stack developer specializing in React and Solidity"
              />

              <p className="text-xs text-muted-foreground">
                A short professional description
                shown below your name.
              </p>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">
                Bio
              </Label>

              <Textarea
                id="bio"
                value={bio}
                onChange={(event) =>
                  setBio(
                    event.target.value,
                  )
                }
                placeholder="Tell clients about yourself, your skills, and the type of work you enjoy..."
                className="min-h-36 resize-y"
              />
            </div>

            {/* Experience */}
            <div className="space-y-2">
              <Label htmlFor="experience">
                Experience
              </Label>

              <Textarea
                id="experience"
                value={experience}
                onChange={(event) =>
                  setExperience(
                    event.target.value,
                  )
                }
                placeholder="Describe your professional experience..."
                className="min-h-28 resize-y"
              />
            </div>

            {/* Hourly rate */}
            <div className="space-y-2">
              <Label htmlFor="hourly-rate">
                Hourly rate
              </Label>

              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>

                <Input
                  id="hourly-rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={hourlyRate}
                  onChange={(event) =>
                    setHourlyRate(
                      event.target.value,
                    )
                  }
                  placeholder="50"
                  className="pl-7"
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Your expected hourly rate in USD.
              </p>
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <Button
                type="button"
                variant="ghost"

              >
                <Link to="/freelancer/profile">
                  Cancel
                </Link>
              </Button>

              <Button
                type="submit"
                disabled={update.isPending}
              >
                {update.isPending
                  ? "Saving..."
                  : "Save changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}