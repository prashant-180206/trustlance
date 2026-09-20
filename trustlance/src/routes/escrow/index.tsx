import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/escrow/")({
  component: EscrowIndexPage,
});

function EscrowIndexPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Escrow Contracts</h1>
      <p className="text-gray-600 mb-6">Manage milestone escrows, fund releases, and deposits.</p>

      <div className="border rounded p-6 bg-white shadow-sm text-center">
        <p className="text-gray-500">No active escrow contracts found.</p>
      </div>
    </div>
  );
}
