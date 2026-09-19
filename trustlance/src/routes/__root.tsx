import { createRootRoute, Outlet } from "@tanstack/react-router";
import { AuthProvider } from "../hooks/provider/AuthProvider";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <AuthProvider>

      <h1>My App</h1>
      <Outlet />

    </AuthProvider>
  );
}