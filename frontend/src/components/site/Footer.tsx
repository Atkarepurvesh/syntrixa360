import { Link } from "@tanstack/react-router";

import { Logo } from "@/components/site/Logo";
import { CONTACT } from "@/data/site";

const columns = [
  {
    heading: "Product",
    links: [
      { label: "Features", to: "/features" },
      { label: "Sales Executives", to: "/sales-executives" },
      { label: "Managers & Owners", to: "/managers-owners" },
      { label: "Pricing", to: "/pricing" },
    ],
  },
  {
    heading: "Solutions",
    links: [
      { label: "The Solution", to: "/solutions" },
      { label: "How It Works", to: "/solutions" },
      { label: "Book a Demo", to: "/book-demo" },
    ],
  },
  {
    heading: "Industries",
    links: [
      { label: "Wholesale & Distribution", to: "/industries" },
      { label: "Export & Trade", to: "/industries" },
      { label: "Manufacturing", to: "/industries" },
      { label: "Trading Businesses", to: "/industries" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-navy text-navy-foreground">
      <div className="container-page py-14 lg:py-16">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-[1.6fr_repeat(3,1fr)]">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Logo inverted />
            <p className="mt-4 max-w-xs text-sm text-navy-foreground/70">
              An AI-powered Sales Operating System for B2B businesses. Capture,
              understand, prioritize, follow up and convert — in one flow.
            </p>
            <address className="mt-5 flex flex-col gap-2 text-sm not-italic">
              <a className="break-all text-navy-foreground/80 hover:text-white" href={`mailto:${CONTACT.supportEmail}`}>
                {CONTACT.supportEmail}
              </a>
              <a className="break-all text-navy-foreground/80 hover:text-white" href={`mailto:${CONTACT.helloEmail}`}>
                {CONTACT.helloEmail}
              </a>
              <a className="text-navy-foreground/80 hover:text-white" href={CONTACT.phoneHref}>
                {CONTACT.phoneDisplay}
              </a>
            </address>
          </div>
          {columns.map((col) => (
            <div key={col.heading}>
              <h3 className="text-xs font-bold tracking-[0.14em] text-navy-foreground/60 uppercase">
                {col.heading}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={`${col.heading}-${link.label}`}>
                    <Link
                      to={link.to}
                      className="text-sm break-words text-navy-foreground/80 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-navy-foreground/60 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} SYNTRIXA360. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
