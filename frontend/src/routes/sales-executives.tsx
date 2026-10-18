import { createFileRoute } from "@tanstack/react-router";

import { PageShell, pageHead } from "@/components/site/PageShell";
import { InfoCard, PageHero, SectionHeader } from "@/components/site/primitives";
import { DashboardMock } from "@/components/site/DashboardMock";
import { salesExecBenefits } from "@/data/site";

export const Route = createFileRoute("/sales-executives")({
  head: pageHead(
    "For Sales Executives",
    "A focused daily workspace with priorities, follow-ups, customer history and AI next-best-actions for every sales executive.",
  ),
  component: SalesExecPage,
});

function SalesExecPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="For Sales Executives"
        title="Everything You Need."
        highlight="Right When You Need It."
        subtitle="A focused workspace with priorities, follow-ups, customer history and next actions — so you always know what to do next."
      />
      <section className="section-y">
        <div className="container-page">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {salesExecBenefits.map((b) => (
              <InfoCard key={b.title} icon={b.icon} tone={b.tone} title={b.title} description={b.description} />
            ))}
          </div>
        </div>
      </section>
      <section className="section-y bg-surface">
        <div className="container-page">
          <SectionHeader eyebrow="Preview" title="Your Daily Workspace" />
          <div className="mt-12">
            <DashboardMock variant="exec" />
          </div>
        </div>
      </section>
    </PageShell>
  );
}
