import { Navbar } from "@/components/Navbar";
import type {
  ReactNode,
} from "react";
// import { Link } from "@tanstack/react-router";


export function Shell({
  title,
  role,
  children,
}: {
  title: string
  role: "company" | "freelancer"
  children: ReactNode
}) {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <Navbar role={role} />

      <section className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="mb-6 text-2xl font-bold">{title}</h1>
        {children}
      </section>
    </main>
  )
}

