import { createFileRoute } from "@tanstack/react-router";
import { CircleCheck } from "lucide-react";

import { PageShell, pageHead } from "@/components/site/PageShell";
import { InfoCard, PageHero, SectionHeader } from "@/components/site/primitives";
import { AudienceGrid } from "@/components/site/AudienceGrid";
import { industries } from "@/data/site";

export const Route = createFileRoute("/industries")({
  head: pageHead(
    "Industries",
    "Syntrixa360 is built for wholesale, export, manufacturing and trading businesses with complex B2B sales cycles.",
  ),
  component: IndustriesPage,
});

function IndustriesPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Industries"
        title="Built for Businesses"
        highlight="That Sell to Businesses."
        subtitle="Complex sales cycles, many customers, repeat orders and active follow-ups — Syntrixa360 is designed for exactly this."
      />
      <section className="section-y">
        <div className="container-page">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {industries.map((ind) => (
              <InfoCard key={ind.title} icon={ind.icon} tone={ind.tone} title={ind.title} description={ind.description}>
                <ul className="mt-4 space-y-2 border-t border-border pt-4">
                  {ind.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CircleCheck className="mt-0.5 size-3.5 shrink-0 text-brand" aria-hidden="true" />
                      {p}
                    </li>
                  ))}
                </ul>
              </InfoCard>
            ))}
          </div>
        </div>
      </section>
      <section className="section-y bg-surface">
        <div className="container-page">
          <SectionHeader eyebrow="Who Is It For" title="Who Is It For?" subtitle="If you sell, follow up and build relationships, Syntrixa360 is for you." />
          <div className="mt-12">
            <AudienceGrid />
          </div>
        </div>
      </section>
    </PageShell>
  );
}
