import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/disputes/")({
  component: DisputesIndexPage,
});

function DisputesIndexPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Disputes & DAO Resolution</h1>
      <p className="text-gray-600 mb-6">Review active dispute resolutions and governance voting.</p>

      <div className="border rounded p-6 bg-white shadow-sm text-center">
        <p className="text-gray-500">No active disputes.</p>
      </div>
    </div>
  );
}
