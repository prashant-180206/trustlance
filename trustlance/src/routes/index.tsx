import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "../hooks/provider/AuthProvider";
import { authService } from "../lib/services/AuthService";

export const Route = createFileRoute("/")({
  component: LoginPage,
});

function LoginPage() {
  const { signIn } = useAuth();

  const handleShowUser = async () => {
    const user = await authService.getSession();
    console.log("Current user:", user);
  }

  return (
    <div>
      <h1>TrustLance</h1>

      <p>
        Connect your Ethereum wallet to continue.
      </p>

      <button onClick={signIn}>
        Sign in with Wallet
      </button>

      <button
        onClick={handleShowUser}
      >
        showuser
      </button >
    </div >
  );
}