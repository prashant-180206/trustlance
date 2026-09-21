import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";
import { Link } from "@tanstack/react-router";

export function Shell({
  title,
  role,
  children,
}: {
  title: string;
  role: "company" | "freelancer";
  children: ReactNode;
}) {
  const base = role === "company" ? "/company" : "/freelancer";
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <Link to={role === "company" ? "/company/dashboard" : "/freelancer/dashboard"} className="font-bold">TrustLance</Link>
          <nav className="flex gap-4 text-sm text-zinc-600">
            <a href={`${base}/dashboard`}>Dashboard</a>
            <a href={`${base}/projects`}>Projects</a>
            <a href={`${base}/applications`}>Applications</a>
            <a href={`${base}/profile`}>Profile</a>
          </nav>
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="mb-6 text-2xl font-bold">{title}</h1>
        {children}
      </section>
    </main>
  );
}

export function Field({ label, ...props }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return <label className="grid gap-1 text-sm font-medium">{label}<input {...props} className="rounded border border-zinc-300 bg-white px-3 py-2 font-normal" /></label>;
}

export function Textarea({ label, ...props }: { label: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <label className="grid gap-1 text-sm font-medium">{label}<textarea {...props} className="rounded border border-zinc-300 bg-white px-3 py-2 font-normal" /></label>;
}

export function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className="rounded bg-zinc-950 px-3 py-2 text-sm font-medium text-white disabled:opacity-50" />;
}

export function ErrorMessage({ error }: { error: Error | null | undefined }) {
  return error ? <p className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{error.message}</p> : null;
}