import type { ReactNode } from "react";

import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { CTASection } from "@/components/site/CTASection";

/** Shared wrapper for marketing pages: navbar + content + closing CTA + footer. */
export function PageShell({ children, cta = true }: { children: ReactNode; cta?: boolean }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        {children}
        {cta ? <CTASection /> : null}
      </main>
      <Footer />
    </div>
  );
}

export function pageHead(title: string, description: string) {
  return () => ({
    meta: [
      { title: `${title} | Syntrixa360` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} | Syntrixa360` },
      { property: "og:description", content: description },
    ],
  });
}
