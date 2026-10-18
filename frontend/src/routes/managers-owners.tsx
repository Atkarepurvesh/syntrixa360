import { createFileRoute } from "@tanstack/react-router";

import { PageShell, pageHead } from "@/components/site/PageShell";
import { InfoCard, PageHero, SectionHeader } from "@/components/site/primitives";
import { DashboardMock } from "@/components/site/DashboardMock";
import { managerBenefits, managerCapabilities } from "@/data/site";

export const Route = createFileRoute("/managers-owners")({
  head: pageHead(
    "For Managers & Owners",
    "Real-time visibility into team performance, pipeline health and forecasts so managers and owners can decide with confidence.",
  ),
  component: ManagersPage,
});

function ManagersPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="For Managers & Owners"
        title="Complete Visibility."
        highlight="Better Decisions. Higher Sales."
        subtitle="See your entire sales team, pipeline and performance in real time."
      />
      <section className="section-y">
        <div className="container-page">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {managerBenefits.map((b) => (
              <InfoCard key={b.title} icon={b.icon} tone={b.tone} title={b.title} description={b.description} />
            ))}
          </div>
        </div>
      </section>
      <section className="section-y bg-surface">
        <div className="container-page">
          <SectionHeader eyebrow="Capabilities" title="Control Your Sales Operation" />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {managerCapabilities.map((c) => (
              <InfoCard key={c.title} icon={c.icon} tone={c.tone} title={c.title} description={c.description} />
            ))}
          </div>
          <div className="mt-14">
            <DashboardMock variant="manager" />
          </div>
        </div>
      </section>
    </PageShell>
  );
}
