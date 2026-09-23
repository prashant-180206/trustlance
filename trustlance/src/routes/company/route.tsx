import { Outlet, createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";

export const Route = createFileRoute("/company")({
  component: CompanyLayout,
});

function CompanyLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar role="company" />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}