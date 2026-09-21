import { createFileRoute } from "@tanstack/react-router";
import { useCompanyProfile } from "../../hooks/profile.hooks";
import { useAuth } from "../../hooks/provider/AuthProvider";
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

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error.message}</div>;
  if (!profile) return <div>Profile not found.</div>;

  return (
    <div>
      <h1>{profile.company_name}</h1>
    </div>
  );
}