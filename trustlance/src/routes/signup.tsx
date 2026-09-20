import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useAuth } from "../hooks/provider/AuthProvider";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSignup = async (type: "freelancer" | "company") => {
    try {
      await signIn(type);
      navigate({ to: "/dashboard" });
    } catch (error) {
      alert("Signup failed: " + error);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto text-center space-y-6 py-20">
      <h1 className="text-2xl font-bold">Create Account</h1>
      <p className="text-gray-600">Choose your role to get started</p>
      <div className="space-y-3">
        <button onClick={() => handleSignup("freelancer")} className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700">
          Join as Freelancer
        </button>
        <button onClick={() => handleSignup("company")} className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700">
          Join as Company
        </button>
      </div>
      <p className="text-sm text-gray-500">
        Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
      </p>
    </div>
  );
}
