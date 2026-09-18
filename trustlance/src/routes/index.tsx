import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <h2 className="bg-red-400 underline">Home page andage again</h2>;
}