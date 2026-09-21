import { createFileRoute } from "@tanstack/react-router";
import { useFreelancerProfile } from "../../hooks/profile.hooks";
import { useAuth } from "../../hooks/provider/AuthProvider";
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

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error.message}</div>;
  if (!profile) return <div>Profile not found.</div>;

  return (
    <div>
      <h1>{profile.display_name}</h1>

      <p>{profile.bio}</p>
    </div>
  );
}