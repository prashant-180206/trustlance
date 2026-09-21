import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useFreelancerProfile, useUpdateFreelancerProfile } from "../../hooks/profile.hooks";
import { useAuth } from "../../hooks/provider/AuthProvider";
import { Button, ErrorMessage, Field, Shell, Textarea } from "../-components";
// import { useAuth } from "../../contexts/auth.context";

export const Route = createFileRoute("/freelancer/profile")({
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
  const update = useUpdateFreelancerProfile();
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [experience, setExperience] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");

  if (isLoading) return <Shell title="Freelancer profile" role="freelancer"><p>Loading...</p></Shell>;
  if (!profile) return <Shell title="Freelancer profile" role="freelancer"><ErrorMessage error={error} /><p>Profile not found.</p></Shell>;

  return (
    <Shell title="Freelancer profile" role="freelancer">
      <ErrorMessage error={error ?? update.error} />
      <form className="grid max-w-xl gap-4" onSubmit={(event) => { event.preventDefault(); update.mutate({ profileId, updates: { headline: headline || profile.headline, bio: bio || profile.bio, experience: experience || profile.experience, hourly_rate: hourlyRate ? Number(hourlyRate) : profile.hourly_rate } }); }}>
        <p className="text-zinc-600">{profile.display_name}</p>
        <Field label="Headline" defaultValue={profile.headline ?? ""} onChange={(event) => setHeadline(event.target.value)} />
        <Textarea label="Bio" defaultValue={profile.bio ?? ""} onChange={(event) => setBio(event.target.value)} />
        <Field label="Experience" defaultValue={profile.experience ?? ""} onChange={(event) => setExperience(event.target.value)} />
        <Field label="Hourly rate" type="number" min="0" defaultValue={profile.hourly_rate ?? ""} onChange={(event) => setHourlyRate(event.target.value)} />
        <Button type="submit" disabled={update.isPending}>{update.isPending ? "Saving..." : "Save profile"}</Button>
      </form>
    </Shell>
  );
}