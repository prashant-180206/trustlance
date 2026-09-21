import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/freelancer")({
  component: FreelancerLayout,
});

function FreelancerLayout() {
  return <Outlet />;
}