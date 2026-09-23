import { Outlet, createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/provider/AuthProvider";
import { useFreelancerProfile } from "@/hooks/profile.hooks";
// import { useEffect } from "react";

export const Route = createFileRoute("/freelancer")({
  component: FreelancerLayout,
});

function FreelancerLayout() {
  const { user, loading: authLoading } = useAuth();
  if (!user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        You are not logged in.
      </div>
    );
  }

  const {
    data: profile,
    isLoading: profileLoading,
  } = useFreelancerProfile(user?.id);

  if (authLoading || profileLoading) {
    return <div>Loading...</div>;
  }

  if (profile?.account_type !== "freelancer") {
    return (
      <div>
        You are not a freelancer.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="freelancer" />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}