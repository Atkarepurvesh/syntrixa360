import { createFileRoute } from "@tanstack/react-router";
import { CircleCheck, Sparkles, Target, Zap } from "lucide-react";

import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { DashboardMock } from "@/components/site/DashboardMock";
import { TrustStrip } from "@/components/site/TrustStrip";
import { ProcessFlow } from "@/components/site/ProcessFlow";
import { ComparisonTable } from "@/components/site/ComparisonTable";
import { ScreenshotTabs } from "@/components/site/ScreenshotTabs";
import { AudienceGrid } from "@/components/site/AudienceGrid";
import { CTASection } from "@/components/site/CTASection";
import { FAQAccordion } from "@/components/site/FAQAccordion";
import {
  CTAButton,
  Eyebrow,
  IconBadge,
  InfoCard,
  SectionHeader,
} from "@/components/site/primitives";
import {
  businessImpact,
  faqs,
  features,
  flowSteps,
  industries,
  managerBenefits,
  problems,
  salesExecBenefits,
  trustItems,
} from "@/data/site";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Syntrixa360 | AI-Powered Sales Operating System for B2B Businesses" },
      {
        name: "description",
        content:
          "Syntrixa360 helps B2B businesses capture leads, understand customer conversations, automate follow-ups and give sales teams the right next action — all in one platform.",
      },
      {
        property: "og:title",
        content: "Syntrixa360 | AI-Powered Sales Operating System for B2B Businesses",
      },
      {
        property: "og:description",
        content:
          "Capture, understand, prioritize, follow up and convert — in one intelligent sales platform.",
      },
    ],
  }),
  component: Index,
});

const heroBadges = [
  { label: "AI-Powered", icon: "Sparkles" },
  { label: "Sales Focused", icon: "Target" },
  { label: "Easy to Use", icon: "Zap" },
  { label: "Action Oriented", icon: "CircleCheck" },
] as const;

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <TrustStrip />
        <ProblemSection />
        <SolutionSection />
        <FeaturesTeaser />
        <SalesExecTeaser />
        <ManagerTeaser />
        <IndustriesTeaser />
        <WhySyntrixa />
        <ProductScreenshots />
        <BusinessImpact />
        <WhoIsItFor />
        <TrustSecurity />
        <FAQSection />
        <ClosingCTA />
      </main>
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="overflow-hidden border-b border-border bg-gradient-to-b from-surface to-background">
      <div className="container-page grid grid-cols-1 gap-12 py-14 lg:grid-cols-[1fr_1.15fr] lg:items-center lg:gap-10 lg:py-20">
        <div className="reveal">
          <Eyebrow>
            <Sparkles className="size-3.5" aria-hidden="true" />
            AI-Powered Sales Operating System
          </Eyebrow>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] text-navy sm:text-5xl lg:text-[3.4rem] lg:leading-[1.05]">
            Run Your Sales. Smarter. Faster. <span className="text-brand">With Syntrixa360.</span>
          </h1>
          <p className="mt-5 max-w-lg text-base text-muted-foreground sm:text-lg">
            Capture every lead, understand customer conversations, automate follow-ups and give your
            team the right next action — all in one intelligent platform.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <CTAButton to="/book-demo">Book a Demo</CTAButton>
            <CTAButton to="/solutions" variant="outline" withArrow={false}>
              See How It Works
            </CTAButton>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
            {heroBadges.map((b) => (
              <span
                key={b.label}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy"
              >
                {b.icon === "Sparkles" ? <Sparkles className="size-4 text-brand" /> : null}
                {b.icon === "Target" ? <Target className="size-4 text-brand" /> : null}
                {b.icon === "Zap" ? <Zap className="size-4 text-brand" /> : null}
                {b.icon === "CircleCheck" ? <CircleCheck className="size-4 text-brand" /> : null}
                {b.label}
              </span>
            ))}
          </div>
        </div>
        <div className="reveal">
          <DashboardMock variant="hero" />
        </div>
      </div>
    </section>
  );
}

function ProblemSection() {
  return (
    <section className="section-y bg-surface">
      <div className="container-page">
        <SectionHeader
          eyebrow="The Challenge"
          title="Sales Is Hard. We Make It Easier."
          subtitle="Every day, sales teams face challenges that cost time, revenue and growth."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {problems.map((p) => (
            <InfoCard
              key={p.title}
              icon={p.icon}
              tone={p.tone}
              title={p.title}
              description={p.description}
            />
          ))}
        </div>
        <div className="reveal mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl border border-border bg-card p-6 shadow-card sm:flex-row">
          <div className="flex items-center gap-4">
            <IconBadge name="Lightbulb" tone="brand" size="lg" round />
            <p className="text-base text-navy sm:text-lg">
              The problem isn't lack of leads.{" "}
              <span className="block font-bold text-brand sm:inline">
                {" "}
                It's what happens after the lead arrives.
              </span>
            </p>
          </div>
          <CTAButton to="/solutions" variant="outline" className="w-full sm:w-auto">
            See How Syntrixa360 Helps
          </CTAButton>
        </div>
      </div>
    </section>
  );
}

function SolutionSection() {
  return (
    <section className="section-y">
      <div className="container-page">
        <SectionHeader
          eyebrow="The Solution"
          title={
            <>
              From Lead to Loyal Customer <span className="text-brand">— All in One Flow</span>
            </>
          }
          subtitle="Syntrixa360 brings structure, intelligence and automation to every step of your sales process."
        />
        <div className="mt-14">
          <ProcessFlow steps={flowSteps} />
        </div>
        <div className="mt-10 text-center">
          <CTAButton to="/solutions" variant="outline">
            Explore the Full Solution
          </CTAButton>
        </div>
      </div>
    </section>
  );
}

function FeaturesTeaser() {
  return (
    <section className="section-y bg-surface">
      <div className="container-page">
        <SectionHeader
          eyebrow="Core Features"
          title="Everything You Need to Run Sales Smarter"
          subtitle="Powerful features that help your team capture leads, build relationships and close more deals."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.slice(0, 6).map((f) => (
            <InfoCard
              key={f.title}
              icon={f.icon}
              tone={f.tone}
              title={f.title}
              description={f.description}
            />
          ))}
        </div>
        <div className="mt-10 text-center">
          <CTAButton to="/features">See All 10 Features</CTAButton>
        </div>
      </div>
    </section>
  );
}

function SalesExecTeaser() {
  return (
    <section className="section-y">
      <div className="container-page grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-10">
        <div className="reveal">
          <Eyebrow>For Sales Executives</Eyebrow>
          <h2 className="mt-5 text-3xl font-extrabold leading-tight text-navy sm:text-4xl">
            Everything You Need. <span className="text-brand">Right When You Need It.</span>
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Syntrixa360 gives every sales executive a focused workspace with priorities, follow-ups,
            customer history and next actions.
          </p>
          <ul className="mt-6 space-y-3">
            {salesExecBenefits.slice(0, 3).map((b) => (
              <li key={b.title} className="flex items-start gap-3">
                <IconBadge name={b.icon} tone={b.tone} size="sm" />
                <div>
                  <p className="text-sm font-bold text-navy">{b.title}</p>
                  <p className="text-sm text-muted-foreground">{b.description}</p>
                </div>
              </li>
            ))}
          </ul>
          <CTAButton to="/sales-executives" variant="outline" className="mt-7">
            See the Executive Workspace
          </CTAButton>
        </div>
        <div className="reveal">
          <DashboardMock variant="exec" />
        </div>
      </div>
    </section>
  );
}

function ManagerTeaser() {
  return (
    <section className="section-y bg-surface">
      <div className="container-page grid grid-cols-1 gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-10">
        <div className="reveal order-2 lg:order-1">
          <DashboardMock variant="manager" />
        </div>
        <div className="reveal order-1 lg:order-2">
          <Eyebrow>For Managers & Owners</Eyebrow>
          <h2 className="mt-5 text-3xl font-extrabold leading-tight text-navy sm:text-4xl">
            Complete Visibility. <span className="text-brand">Better Decisions. Higher Sales.</span>
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Get real-time visibility into your entire sales team, pipeline and performance — so you
            can make confident decisions.
          </p>
          <ul className="mt-6 space-y-3">
            {managerBenefits.slice(0, 3).map((b) => (
              <li key={b.title} className="flex items-start gap-3">
                <IconBadge name={b.icon} tone={b.tone} size="sm" />
                <div>
                  <p className="text-sm font-bold text-navy">{b.title}</p>
                  <p className="text-sm text-muted-foreground">{b.description}</p>
                </div>
              </li>
            ))}
          </ul>
          <CTAButton to="/managers-owners" variant="outline" className="mt-7">
            See the Manager Dashboard
          </CTAButton>
        </div>
      </div>
    </section>
  );
}

function IndustriesTeaser() {
  return (
    <section className="section-y">
      <div className="container-page">
        <SectionHeader
          eyebrow="Industries We Serve"
          title="Built for Businesses That Sell to Businesses"
          subtitle="Syntrixa360 is designed for B2B companies with complex sales cycles, multiple customers, repeat orders and active follow-ups."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {industries.map((ind) => (
            <InfoCard
              key={ind.title}
              icon={ind.icon}
              tone={ind.tone}
              title={ind.title}
              description={ind.description}
            >
              <ul className="mt-4 space-y-2 border-t border-border pt-4">
                {ind.points.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <CircleCheck
                      className="mt-0.5 size-3.5 shrink-0 text-brand"
                      aria-hidden="true"
                    />
                    {p}
                  </li>
                ))}
              </ul>
            </InfoCard>
          ))}
        </div>
        <div className="mt-10 text-center">
          <CTAButton to="/industries">Explore All Industries</CTAButton>
        </div>
      </div>
    </section>
  );
}

function WhySyntrixa() {
  return (
    <section className="section-y bg-surface">
      <div className="container-page">
        <SectionHeader
          eyebrow="Why Syntrixa360"
          title="More Than a CRM. Built Around Sales Execution."
          subtitle="Traditional CRMs store data. Syntrixa360 is designed to help your team act on it."
        />
        <div className="mt-12">
          <ComparisonTable />
        </div>
      </div>
    </section>
  );
}

function ProductScreenshots() {
  return (
    <section className="section-y">
      <div className="container-page">
        <SectionHeader
          eyebrow="Product Screenshots"
          title="See Syntrixa360 in Action"
          subtitle="Explore the screens that help your team capture, prioritize and close more deals."
        />
        <div className="mt-12">
          <ScreenshotTabs />
        </div>
      </div>
    </section>
  );
}

function BusinessImpact() {
  return (
    <section className="section-y bg-surface">
      <div className="container-page">
        <SectionHeader
          eyebrow="Business Impact"
          title="Turn Sales Activity Into Better Sales Execution"
          subtitle="Syntrixa360 is designed to help your team work with more focus, consistency and visibility."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {businessImpact.map((b) => (
            <InfoCard
              key={b.title}
              icon={b.icon}
              tone={b.tone}
              title={b.title}
              description={b.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function WhoIsItFor() {
  return (
    <section className="section-y">
      <div className="container-page">
        <SectionHeader
          eyebrow="Who Is It For"
          title={
            <>
              Who <span className="text-brand">Is It For?</span>
            </>
          }
          subtitle="Syntrixa360 is built for B2B businesses and sales teams that want to sell more, follow up better and build lasting customer relationships."
        />
        <div className="mt-12">
          <AudienceGrid />
        </div>
      </div>
      <CTASection />
    </section>
  );
}

function TrustSecurity() {
  return (
    <section className="section-y bg-surface">
      <div className="container-page">
        <SectionHeader
          eyebrow="Trust & Security"
          title="Built with Security in Mind"
          align="center"
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {trustItems.map((t) => (
            <div
              key={t.title}
              className="reveal rounded-2xl border border-border bg-card p-6 text-center shadow-card"
            >
              <IconBadge name={t.icon} tone="brand" round />
              <p className="mt-4 text-sm font-bold text-navy">{t.title}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {t.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  return (
    <section className="section-y">
      <div className="container-page">
        <SectionHeader eyebrow="FAQ" title="Frequently Asked Questions" />
        <div className="mt-12">
          <FAQAccordion items={faqs} />
        </div>
      </div>
    </section>
  );
}

function ClosingCTA() {
  return (
    <section className="section-y bg-navy">
      <div className="container-page">
        <div className="reveal flex flex-col items-center gap-6 text-center">
          <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
            Ready to streamline your sales process?
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <CTAButton to="/book-demo">Book a Demo</CTAButton>
            <CTAButton to="/solutions" variant="ghost" className="text-white hover:bg-white/10">
              See It in Action
            </CTAButton>
          </div>
        </div>
      </div>
    </section>
  );
}
