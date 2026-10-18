import { ArrowRight } from "lucide-react";

import { IconBadge } from "@/components/site/primitives";
import type { ToneName } from "@/components/site/Icon";

type FlowStep = {
  step: string;
  title: string;
  description: string;
  icon: string;
  tone: ToneName;
};

export function ProcessFlow({ steps }: { steps: readonly FlowStep[] }) {
  return (
    <div className="reveal">
      {/* Desktop: horizontal flow */}
      <div className="hidden lg:flex lg:flex-wrap lg:items-start lg:justify-center lg:gap-x-1 lg:gap-y-8">
        {steps.map((s, i) => (
          <div key={s.title} className="flex w-[13%] min-w-[150px] items-start">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <IconBadge name={s.icon} tone={s.tone} size="lg" round />
                <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-navy text-[10px] font-bold text-white">
                  {s.step}
                </span>
              </div>
              <p className="mt-3 text-sm font-bold text-navy">{s.title}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {s.description}
              </p>
            </div>
            {i < steps.length - 1 ? (
              <ArrowRight className="mt-6 size-4 shrink-0 text-brand/40" aria-hidden="true" />
            ) : null}
          </div>
        ))}
      </div>

      {/* Mobile / tablet: vertical timeline */}
      <div className="space-y-6 lg:hidden">
        {steps.map((s) => (
          <div key={s.title} className="flex gap-4">
            <div className="flex flex-col items-center">
              <IconBadge name={s.icon} tone={s.tone} round />
              <span className="mt-2 h-full w-px flex-1 bg-border" aria-hidden="true" />
            </div>
            <div className="pb-2">
              <p className="text-sm font-bold text-navy">
                <span className="text-muted-foreground">{s.step}. </span>
                {s.title}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
