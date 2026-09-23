import { Link } from "@tanstack/react-router"
import {
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  LayoutDashboard,
  UserRound,
} from "lucide-react"

type NavbarProps = {
  role: "company" | "freelancer"
}

export function Navbar({ role }: NavbarProps) {
  const base = role === "company" ? "/company" : "/freelancer"
  const isCompany = role === "company"

  const links = [
    { label: "Dashboard", to: `${base}/dashboard`, icon: LayoutDashboard },
    {
      label: "Projects",
      to: `${base}/projects`,
      icon: isCompany ? Building2 : BriefcaseBusiness,
    },
    { label: "Applications", to: `${base}/applications`, icon: ClipboardList },
    { label: "Profile", to: `${base}/profile`, icon: UserRound },
  ] as const

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-3 sm:px-6">
        <Link
          to={`${base}/dashboard`}
          className="group flex min-w-0 items-center gap-3"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:-rotate-3">
            <BriefcaseBusiness className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-heading text-base font-bold tracking-tight text-foreground">
              TrustLance
            </span>
            <span className="hidden text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground sm:block">
              {isCompany ? "Company workspace" : "Freelancer workspace"}
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 overflow-x-auto text-sm" aria-label={`${role} navigation`}>
          {links.map(({ label, to, icon: Icon }) => (
            <Link
              key={label}
              to={to}
              activeProps={{ className: "bg-primary/10 text-primary" }}
              className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Icon className="size-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground md:flex">
          <span className="size-2 rounded-full bg-emerald-500" />
          {isCompany ? "Company name" : "Your name"}
        </div>
      </div>
    </header>
  )
}