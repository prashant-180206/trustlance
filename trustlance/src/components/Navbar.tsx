import { Link } from "@tanstack/react-router"

type NavbarProps = {
  role: "company" | "freelancer"
}

export function Navbar({ role }: NavbarProps) {
  const base = role === "company" ? "/company" : "/freelancer"

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link
          to={`${base}/dashboard`}
          className="text-lg font-bold text-zinc-950"
        >
          TrustLance
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-6 text-sm">
          <Link
            to={`${base}/dashboard`}
            className="text-zinc-600 transition-colors hover:text-zinc-950"
          >
            Dashboard
          </Link>

          <Link
            to={`${base}/projects`}
            className="text-zinc-600 transition-colors hover:text-zinc-950"
          >
            Projects
          </Link>

          <Link
            to={`${base}/applications`}
            className="text-zinc-600 transition-colors hover:text-zinc-950"
          >
            Applications
          </Link>

          <Link
            to={`${base}/profile`}
            className="text-zinc-600 transition-colors hover:text-zinc-950"
          >
            Profile
          </Link>
        </nav>
      </div>
    </header>
  )
}