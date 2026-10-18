import { Check } from "lucide-react";

import { CTAButton } from "@/components/site/primitives";
import { cn } from "@/lib/utils";
import type { pricingPlans } from "@/data/site";

export function PricingCard({ plan }: { plan: (typeof pricingPlans)[number] }) {
  return (
    <div
      className={cn(
        "reveal flex h-full flex-col rounded-2xl border p-7",
        plan.highlighted
          ? "border-brand bg-navy text-white shadow-panel lg:-translate-y-2"
          : "border-border bg-card shadow-card",
      )}
    >
      {plan.highlighted ? (
        <span className="mb-4 inline-flex w-fit items-center rounded-full bg-brand px-3 py-1 text-[11px] font-bold tracking-wide text-white uppercase">
          Most Popular
        </span>
      ) : null}
      <h3 className={cn("text-lg font-bold", plan.highlighted ? "text-white" : "text-navy")}>
        {plan.name}
      </h3>
      <p
        className={cn(
          "mt-1.5 text-sm",
          plan.highlighted ? "text-white/70" : "text-muted-foreground",
        )}
      >
        {plan.description}
      </p>
      <p
        className={cn(
          "mt-5 text-2xl font-extrabold",
          plan.highlighted ? "text-white" : "text-navy",
        )}
      >
        {plan.price}
      </p>
      <CTAButton
        to="/book-demo"
        variant={plan.highlighted ? "primary" : "outline"}
        className={cn("mt-5 w-full", plan.highlighted && "bg-white text-navy hover:bg-white/90")}
      >
        Book a Demo
      </CTAButton>
      <ul
        className={cn(
          "mt-6 space-y-2.5 border-t pt-6",
          plan.highlighted ? "border-white/10" : "border-border",
        )}
      >
        {plan.features.map((f) => (
          <li
            key={f}
            className={cn(
              "flex items-start gap-2.5 text-sm",
              plan.highlighted ? "text-white/85" : "text-foreground",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full",
                plan.highlighted ? "bg-white/15 text-white" : "bg-brand-soft text-brand",
              )}
            >
              <Check className="size-3" aria-hidden="true" />
            </span>
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}
