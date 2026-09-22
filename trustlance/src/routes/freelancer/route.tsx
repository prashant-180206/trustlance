import { Outlet, createFileRoute,  } from "@tanstack/react-router";
import { useAuth } from "@/hooks/provider/AuthProvider";
// import { useEffect } from "react";

export const Route = createFileRoute("/freelancer")({
  component: FreelancerLayout,
});

function FreelancerLayout() {
  const { accountType } = useAuth();
  // const navigate = useNavigate();

  // useEffect(() => {
  //   if (accountType !== "freelancer") {
  //     navigate({
  //       to: "/company",
  //       replace: true,
  //     });
  //   }
  // }, [accountType, navigate]);

  if (accountType !== "freelancer") {
    return null;
  }

  return <Outlet />;
}