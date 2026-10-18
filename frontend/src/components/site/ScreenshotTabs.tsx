import { useState } from "react";

import { DashboardMock } from "@/components/site/DashboardMock";
import { cn } from "@/lib/utils";
import { productTabs } from "@/data/site";

const variantForTab: Record<string, "owner" | "exec" | "manager" | "hero"> = {
  "Owner Dashboard": "owner",
  "Sales Executive Dashboard": "exec",
  "Lead Management": "owner",
  "Customer 360°": "manager",
  Conversations: "exec",
  "Follow-ups": "exec",
  Analytics: "manager",
};

export function ScreenshotTabs() {
  const [active, setActive] = useState(0);
  const tab = productTabs[active] ?? productTabs[0];

  return (
    <div className="reveal">
      <div className="flex flex-wrap justify-center gap-2">
        {productTabs.map((t, i) => (
          <button
            key={t.label}
            type="button"
            onClick={() => setActive(i)}
            className={cn(
              "rounded-lg border px-3.5 py-2 text-xs font-bold transition-colors sm:text-sm",
              i === active
                ? "border-brand bg-brand text-brand-foreground shadow-card"
                : "border-border bg-background text-navy hover:border-brand/40",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        <DashboardMock
          variant={variantForTab[tab.label] ?? "owner"}
          className="mx-auto max-w-4xl"
        />
        <p className="mx-auto mt-5 max-w-2xl text-center text-sm text-muted-foreground sm:text-base">
          {tab.description}
        </p>
      </div>
    </div>
  );
}
