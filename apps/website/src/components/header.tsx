import { buttonVariants } from "@sycom/ui/components/button-variants";
import { cn } from "@sycom/ui/lib/utils";
import { Link } from "@tanstack/react-router";

const SIGN_IN_HREF = "#";
const SIGN_UP_HREF = "#";

export default function Header() {
  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#how", label: "How it works" },
    { href: "#pricing", label: "Pricing" },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-3.5">
        <Link
          to="/"
          className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground"
        >
          <span aria-hidden="true" className="inline-block size-3 bg-primary" />
          Sycom
        </Link>
        <nav className="hidden items-center gap-7 text-sm md:flex">
          {navLinks.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a
            href={SIGN_IN_HREF}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "hidden h-9 px-3 text-sm md:inline-flex",
            )}
          >
            Sign In
          </a>
          <a
            href={SIGN_UP_HREF}
            className={cn(buttonVariants({ variant: "default" }), "h-9 px-4 text-sm")}
          >
            Get Started
          </a>
        </div>
      </div>
    </header>
  );
}
