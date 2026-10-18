import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { PageShell, pageHead } from "@/components/site/PageShell";
import { PageHero, SectionHeader } from "@/components/site/primitives";
import { FAQAccordion } from "@/components/site/FAQAccordion";
import { Icon } from "@/components/site/Icon";
import { ProcessFlow } from "@/components/site/ProcessFlow";
import { BRAND_GLYPHS } from "@/data/integration-logos";
import {
  INTEGRATIONS,
  INTEGRATION_CATEGORIES,
  STATUS_META,
  filterIntegrations,
  groupByCategory,
  integrationFaqs,
  integrationFlowSteps,
  type Integration,
  type IntegrationCategoryId,
} from "@/data/integrations";

export const Route = createFileRoute("/integrations")({
  head: pageHead(
    "Integrations",
    "Bring leads from marketplaces, messaging, portals, ads and your website into Syntrixa360. Every integration shows its real status.",
  ),
  component: IntegrationsPage,
});

// Any file in src/assets/integrations named <integration-id>.(svg|png|webp|jpg) is used automatically.
const LOGO_FILES = import.meta.glob("/src/assets/integrations/*.{svg,png,webp,jpg,jpeg}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

function logoFile(id: string): string | undefined {
  const hit = Object.keys(LOGO_FILES).find((p) => /\/([^/]+)\.[a-z]+$/.exec(p)?.[1] === id);
  return hit ? LOGO_FILES[hit] : undefined;
}

function Logo({ id, logo, name }: { id: string; logo: Integration["logo"]; name: string }) {
  const box = "flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-background";
  const file = logoFile(id);
  if (file) {
    // Wordmark logos (e.g. 99acres, Justdial) are wide, so the tile grows to fit them instead of squashing.
    return (
      <span
        className="flex h-11 min-w-11 max-w-28 shrink-0 items-center justify-center rounded-xl border border-border bg-background px-1.5"
        aria-hidden="true"
      >
        <img src={file} alt="" loading="lazy" className="h-7 w-auto max-w-24 object-contain" />
      </span>
    );
  }
  if (logo.kind === "brand") {
    const g = BRAND_GLYPHS[logo.glyph];
    if (g) {
      return (
        <span className={box} aria-hidden="true">
          <svg viewBox={g.viewBox} className="size-6" fill={g.color}>
            <path d={g.path} />
          </svg>
        </span>
      );
    }
  }
  if (logo.kind === "icon") {
    return (
      <span className={box} aria-hidden="true">
        <Icon name={logo.icon} size={22} />
      </span>
    );
  }
  const text = logo.kind === "monogram" ? logo.text : name.slice(0, 2);
  return (
    <span className={`${box} text-sm font-extrabold text-navy`} aria-hidden="true">
      {text}
    </span>
  );
}

function IntegrationsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<IntegrationCategoryId | "all">("all");
  const groups = useMemo(
    () => groupByCategory(filterIntegrations(INTEGRATIONS, { query, category })),
    [query, category],
  );

  return (
    <PageShell>
      <PageHero
        eyebrow="Integrations"
        title="Bring Every Lead"
        highlight="Into One Place."
        subtitle="Marketplaces, messaging, portals, ads and your website. Each card shows its honest status, so you know what is available and what is planned."
      />

      <section className="section-y">
        <div className="container-page">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(Object.keys(STATUS_META) as (keyof typeof STATUS_META)[]).map((k) => (
              <div key={k} className="rounded-2xl border border-border bg-card p-4 shadow-card">
                <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_META[k].badgeClass}`}>
                  {STATUS_META[k].label}
                </span>
                <p className="mt-2 text-xs text-muted-foreground">{STATUS_META[k].summary}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-4">
            <label className="relative block">
              <span className="sr-only">Search integrations</span>
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search IndiaMART, WhatsApp, Gmail…"
                className="h-12 w-full rounded-xl border border-input bg-background pr-4 pl-10 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
              {[{ id: "all" as const, chip: "All" }, ...INTEGRATION_CATEGORIES].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  aria-pressed={category === c.id}
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors ${
                    category === c.id
                      ? "border-brand bg-brand text-brand-foreground"
                      : "border-border bg-background text-navy hover:border-brand/40"
                  }`}
                >
                  {c.chip}
                </button>
              ))}
            </div>
          </div>

          {groups.length === 0 ? (
            <p className="mt-12 text-center text-muted-foreground">No integrations match your search.</p>
          ) : (
            groups.map(({ category: cat, items }) => (
              <div key={cat.id} className="mt-12">
                <h2 className="flex items-center gap-2 text-xl font-extrabold text-navy">
                  <Icon name={cat.icon} size={20} />
                  {cat.label}
                </h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((i) => (
                    <article key={i.id} className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-card">
                      <div className="flex items-center gap-3">
                        <Logo id={i.id} logo={i.logo} name={i.name} />
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-bold text-navy">{i.name}</h3>
                          <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUS_META[i.status].badgeClass}`}>
                            {STATUS_META[i.status].label}
                          </span>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">{i.description}</p>
                      <p className="mt-3 text-xs text-muted-foreground">
                        <span className="font-bold text-navy">How: </span>
                        {i.method}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="section-y bg-surface">
        <div className="container-page">
          <SectionHeader eyebrow="How It Works" title="From Source to Follow-up" />
          <div className="mt-12">
            <ProcessFlow steps={integrationFlowSteps} />
          </div>
        </div>
      </section>

      <section className="section-y">
        <div className="container-page">
          <SectionHeader eyebrow="FAQ" title="Integration Questions" />
          <div className="mt-12">
            <FAQAccordion items={integrationFaqs} />
          </div>
        </div>
      </section>
    </PageShell>
  );
}
