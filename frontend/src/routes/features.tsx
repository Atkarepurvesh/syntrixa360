import { createFileRoute } from "@tanstack/react-router";

import { PageShell, pageHead } from "@/components/site/PageShell";
import { InfoCard, PageHero, SectionHeader } from "@/components/site/primitives";
import { DashboardMock } from "@/components/site/DashboardMock";
import { features } from "@/data/site";

export const Route = createFileRoute("/features")({
  head: pageHead(
    "Features",
    "Lead management, customer 360, AI follow-ups, pipeline, analytics and forecasting — everything your B2B sales team needs in one platform.",
  ),
  component: FeaturesPage,
});

function FeaturesPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Product"
        title="Everything Your Sales Team Needs."
        highlight="In One Platform."
        subtitle="From the first enquiry to repeat orders — capture, understand, prioritise, follow up and convert with Syntrixa360."
      />
      <section className="section-y">
        <div className="container-page">
          <SectionHeader
            eyebrow="10 Core Features"
            title="Built Around Sales Execution"
            subtitle="Every feature is designed to help your team know what to do next."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <InfoCard
                key={f.title}
                icon={f.icon}
                tone={f.tone}
                title={f.title}
                description={f.description}
                numbered={i + 1}
              />
            ))}
          </div>
        </div>
      </section>
      <section className="section-y bg-surface">
        <div className="container-page">
          <SectionHeader eyebrow="Preview" title="See It in Action" />
          <div className="mt-12">
            <DashboardMock variant="hero" />
          </div>
        </div>
      </section>
    </PageShell>
  );
}
