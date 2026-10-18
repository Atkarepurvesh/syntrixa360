import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck, ShieldCheck } from "lucide-react";

import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { PricingCard } from "@/components/site/PricingCard";
import { CTAButton, IconBadge, PageHero } from "@/components/site/primitives";
import { pricingPlans } from "@/data/site";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing | Syntrixa360" },
      {
        name: "description",
        content:
          "Simple, transparent plans for growing B2B sales teams. Book a demo to see pricing for your team size.",
      },
    ],
  }),
  component: PricingPage,
});

const helpPoints = [
  {
    title: "Talk to our experts",
    description: "Get personalized guidance for your business.",
    icon: "MessageCircle",
  },
  {
    title: "See how it fits",
    description: "Understand how Syntrixa360 fits your sales process.",
    icon: "CalendarCheck",
  },
  {
    title: "No obligation",
    description: "No credit card required to book a demo.",
    icon: "ShieldCheck",
  },
] as const;

function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <PageHero
          eyebrow="Pricing"
          title="Simple Plans."
          highlight="Powerful Results."
          subtitle="Transparent monthly plans for pharma wholesalers, distributors and growing B2B sales teams. Choose the level of CRM, automation and AI that fits your business."
        />

        <section className="section-y">
          <div className="container-page">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pricingPlans.map((plan) => (
                <PricingCard key={plan.name} plan={plan} />
              ))}
            </div>
            <p className="reveal mt-6 text-center text-xs text-muted-foreground">
              Monthly subscription prices are shown in INR. Annual billing options are listed in each plan. GST, where applicable, is extra. Feature availability and usage limits are subject to the active subscription and connected integrations.
            </p>
          </div>
        </section>

        <section className="section-y bg-surface">
          <div className="container-page grid gap-6 lg:grid-cols-2">
            <div className="reveal rounded-2xl border border-border bg-card p-8 shadow-card">
              <p className="text-xs font-bold tracking-[0.14em] text-brand uppercase">
                Not Sure Which Plan Is Right?
              </p>
              <h3 className="mt-3 text-2xl font-extrabold text-navy">
                We're here to help you choose.
              </h3>
              <div className="mt-6 space-y-4">
                {helpPoints.map((p) => (
                  <div key={p.title} className="flex items-start gap-3">
                    <IconBadge name={p.icon} tone="brand" size="sm" round />
                    <div>
                      <p className="text-sm font-bold text-navy">{p.title}</p>
                      <p className="text-xs text-muted-foreground">{p.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="reveal flex flex-col justify-center rounded-2xl border border-border bg-navy p-8 text-center shadow-panel">
              <IconBadge name="CalendarCheck" tone="brand" size="lg" round className="mx-auto" />
              <h3 className="mt-4 text-xl font-extrabold text-white">See Syntrixa360 in Action</h3>
              <p className="mt-2 text-sm text-white/70">
                Book a demo and our team will walk you through pricing and setup for your team.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <CTAButton to="/book-demo">
                  <CalendarCheck className="size-4" aria-hidden="true" />
                  Book a Demo
                </CTAButton>
              </div>
              <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-white/50">
                <ShieldCheck className="size-3.5" aria-hidden="true" />
                Your information is safe with us.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
