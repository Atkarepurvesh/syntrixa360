import { createFileRoute } from "@tanstack/react-router";

import { PageShell, pageHead } from "@/components/site/PageShell";
import { InfoCard, PageHero, SectionHeader } from "@/components/site/primitives";
import { ProcessFlow } from "@/components/site/ProcessFlow";
import { ComparisonTable } from "@/components/site/ComparisonTable";
import { FAQAccordion } from "@/components/site/FAQAccordion";
import { businessImpact, faqs, flowSteps, howItWorks, problems, solutionPillars } from "@/data/site";

export const Route = createFileRoute("/solutions")({
  head: pageHead(
    "Solutions",
    "See how Syntrixa360 turns scattered leads into a clear flow: capture, understand, prioritise, follow up and act.",
  ),
  component: SolutionsPage,
});

function SolutionsPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="The Solution"
        title="From Lead to Loyal Customer."
        highlight="All in One Flow."
        subtitle="Syntrixa360 brings structure, intelligence and automation to every step of your sales process."
      />

      <section className="section-y">
        <div className="container-page">
          <SectionHeader
            eyebrow="The Challenge"
            title="Sales Is Hard. We Make It Easier."
            subtitle="The problem isn't lack of leads. It's what happens after the lead arrives."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {problems.map((p) => (
              <InfoCard key={p.title} icon={p.icon} tone={p.tone} title={p.title} description={p.description} />
            ))}
          </div>
        </div>
      </section>

      <section className="section-y bg-surface">
        <div className="container-page">
          <SectionHeader eyebrow="How It Works" title="Five Simple Steps" />
          <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {howItWorks.map((s) => (
              <li key={s.number} className="reveal rounded-2xl border border-border bg-card p-6 shadow-card">
                <span className="text-2xl font-extrabold text-brand">{s.number}</span>
                <p className="mt-2 text-base font-bold text-navy">{s.title}</p>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.description}</p>
              </li>
            ))}
          </ol>
          <div className="mt-14">
            <ProcessFlow steps={flowSteps} />
          </div>
        </div>
      </section>

      <section className="section-y">
        <div className="container-page">
          <SectionHeader eyebrow="Five Pillars" title="What Syntrixa360 Does for You" />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {solutionPillars.map((p) => (
              <InfoCard key={p.title} icon={p.icon} tone={p.tone} title={p.title} description={p.description} />
            ))}
          </div>
        </div>
      </section>

      <section className="section-y bg-surface">
        <div className="container-page">
          <SectionHeader
            eyebrow="Why Syntrixa360"
            title="More Than a CRM."
            subtitle="Traditional CRMs store data. Syntrixa360 helps your team act on it."
          />
          <div className="mt-12">
            <ComparisonTable />
          </div>
        </div>
      </section>

      <section className="section-y">
        <div className="container-page">
          <SectionHeader eyebrow="Business Impact" title="Better Sales Execution" />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {businessImpact.map((b) => (
              <InfoCard key={b.title} icon={b.icon} tone={b.tone} title={b.title} description={b.description} />
            ))}
          </div>
        </div>
      </section>

      <section className="section-y bg-surface">
        <div className="container-page">
          <SectionHeader eyebrow="FAQ" title="Frequently Asked Questions" />
          <div className="mt-12">
            <FAQAccordion items={faqs} />
          </div>
        </div>
      </section>
    </PageShell>
  );
}
