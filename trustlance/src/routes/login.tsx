import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useAuth } from "../hooks/provider/AuthProvider";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (type: "freelancer" | "company") => {
    try {
      await signIn(type);
      navigate({ to: "/dashboard" });
    } catch (error) {
      alert("Login failed: " + error);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto text-center space-y-6 py-20">
      <h1 className="text-2xl font-bold">Login to TrustLance</h1>
      <div className="space-y-3">
        <button onClick={() => handleLogin("freelancer")} className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Login as Freelancer
        </button>
        <button onClick={() => handleLogin("company")} className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Login as Company
        </button>
      </div>
      <p className="text-sm text-gray-500">
        Don't have an account? <Link to="/signup" className="text-blue-600 hover:underline">Sign Up</Link>
      </p>
    </div>
  );
}
