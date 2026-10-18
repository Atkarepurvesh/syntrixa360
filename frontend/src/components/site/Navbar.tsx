import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";

import { Logo } from "@/components/site/Logo";
import { navLinks } from "@/data/site";

function Wordmark() {
  return (
    <Link
      to="/"
      className="flex items-center gap-2"
      aria-label="Syntrixa360 home"
    >
      <Logo />
    </Link>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  // Close the mobile menu whenever the route changes (e.g. browser back/forward).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Escape closes the mobile menu; body scroll is not locked so the page never traps the user.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-4 lg:h-[74px]">
        <Wordmark />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {navLinks.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="rounded-lg px-2.5 py-2 text-sm font-semibold text-navy transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand xl:px-3.5"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            to="/book-demo"
            className="rounded-xl bg-brand px-4 py-2.5 text-sm font-bold whitespace-nowrap xl:px-5 text-brand-foreground transition-colors hover:bg-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Book a Demo
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-border text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand lg:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open ? (
        <div
          id="mobile-menu"
          className="max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-t border-border bg-background lg:hidden"
        >
          <div className="container-page space-y-1 py-4">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                onClick={() => setOpen(false)}
                className="block rounded-xl px-3 py-3 text-base font-semibold text-navy hover:bg-secondary"
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/book-demo"
              onClick={() => setOpen(false)}
              className="mt-2 block rounded-xl bg-brand px-4 py-3.5 text-center text-sm font-bold text-brand-foreground"
            >
              Book a Demo
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}

export { X as MenuClose };
