import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useCompanyProfile, useUpdateCompanyProfile } from "../../hooks/profile.hooks";
import { useAuth } from "../../hooks/provider/AuthProvider";
import { Button, ErrorMessage, Field, Shell, Textarea } from "../-components";
// import { useAuth } from "../../contexts/auth.context";

export const Route = createFileRoute("/company/profile")({
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
  const update = useUpdateCompanyProfile();
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");

  if (isLoading) return <Shell title="Company profile" role="company"><p>Loading...</p></Shell>;
  if (!profile) return <Shell title="Company profile" role="company"><ErrorMessage error={error} /><p>Profile not found.</p></Shell>;

  return (
    <Shell title="Company profile" role="company">
      <ErrorMessage error={error ?? update.error} />
      <form className="grid max-w-xl gap-4" onSubmit={(event) => { event.preventDefault(); update.mutate({ profileId, updates: { company_name: companyName || profile.company_name, description: description || profile.description, industry: industry || profile.industry, website: website || profile.website } }); }}>
        <Field label="Company name" defaultValue={profile.company_name} onChange={(event) => setCompanyName(event.target.value)} required />
        <Textarea label="Description" defaultValue={profile.description ?? ""} onChange={(event) => setDescription(event.target.value)} />
        <Field label="Industry" defaultValue={profile.industry ?? ""} onChange={(event) => setIndustry(event.target.value)} />
        <Field label="Website" defaultValue={profile.website ?? ""} onChange={(event) => setWebsite(event.target.value)} />
        <Button type="submit" disabled={update.isPending}>{update.isPending ? "Saving..." : "Save profile"}</Button>
      </form>
    </Shell>
  );
}