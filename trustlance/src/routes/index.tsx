
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Blocks,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link
            to="/"
            className="text-lg font-semibold tracking-tight"
          >
            TrustLance
          </Link>

          <div className="flex items-center gap-3">
            <Button  variant="ghost">
              <Link to="/projects">Explore Projects</Link>
            </Button>

            <Button >
              <Link to="/auth/login">
                Get Started
              </Link>
                <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-size-[4rem_4rem] opacity-30 mask-[radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />

        <div className="mx-auto flex min-h-[calc(100vh-65px)] max-w-6xl flex-col justify-center px-6 py-24">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-6">
              <Blocks className="mr-2 h-3.5 w-3.5" />
              Decentralized freelancing
            </Badge>

            <h1 className="text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Freelance work,
              <br />
              <span className="text-muted-foreground">
                built on trust.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
              TrustLance connects companies and freelancers through
              transparent projects, milestone-based payments, and
              blockchain-secured transactions.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Button  size="lg">
                <Link to="/auth/login">
                  Get Started
                </Link>
                  <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <Button  size="lg" variant="outline">
                <Link to="/projects">Explore Projects</Link>
              </Button>
            </div>
          </div>

          {/* Trust points */}
          <div className="mt-20 grid max-w-4xl gap-4 sm:grid-cols-3">
            <FeatureCard
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Secure Payments"
              description="Funds are secured through blockchain-based escrow."
            />

            <FeatureCard
              icon={<CheckCircle2 className="h-5 w-5" />}
              title="Milestone Based"
              description="Break projects into clear milestones and payments."
            />

            <FeatureCard
              icon={<Blocks className="h-5 w-5" />}
              title="On-Chain Trust"
              description="Transactions are transparent and verifiable."
            />
          </div>

          <Separator className="mt-16" />

          <div className="mt-6 flex flex-col justify-between gap-2 text-sm text-muted-foreground sm:flex-row">
            <p>
              Transparent work. Verifiable payments.
            </p>

            <p>
              Powered by blockchain technology.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

type FeatureCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

function FeatureCard({
  icon,
  title,
  description,
}: FeatureCardProps) {
  return (
    <Card className="bg-background/80 backdrop-blur-sm">
      <CardHeader>
        <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-md border bg-muted">
          {icon}
        </div>

        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>

      <CardContent>
        <p className="text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
