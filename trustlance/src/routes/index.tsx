import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="text-xl font-bold tracking-tight">
          TrustLance
        </Link>

        <Link
          to="/auth/login"
          className="rounded-lg bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
        >
          Get Started
        </Link>
      </nav>

      <section className="mx-auto flex min-h-[calc(100vh-88px)] max-w-6xl items-center px-6 py-20">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-zinc-500">
            Decentralized freelancing
          </p>

          <h1 className="text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
            Freelance work,
            <br />
            built on trust.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600">
            TrustLance connects companies and freelancers through transparent
            projects, milestone-based payments, and blockchain-secured
            transactions.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/auth/login"
              className="rounded-lg bg-zinc-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              Get Started
            </Link>

            <Link
              to="/projects"
              className="rounded-lg border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50"
            >
              Explore Projects
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}