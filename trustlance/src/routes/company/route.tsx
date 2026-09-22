import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/provider/AuthProvider";

export const Route = createFileRoute("/company")({
  component: CompanyLayout,
});

function CompanyLayout() {
  const { accountType } = useAuth();
  const navigate = useNavigate();

  if (accountType !== "company") {
    navigate({ to: "/freelancer", replace: true });
    return null;
  }

  return <Outlet />;
}