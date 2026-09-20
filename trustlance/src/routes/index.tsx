import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto text-center space-y-8 py-20">
      <h1 className="text-5xl font-bold">TrustLance</h1>
      <p className="text-xl text-gray-600">Decentralized freelancing with secure escrow contracts.</p>
      <div className="flex justify-center gap-4">
        <Link to="/login" className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
          Login
        </Link>
        <Link to="/signup" className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50">
          Sign Up
        </Link>
      </div>
    </div>
  );
}
