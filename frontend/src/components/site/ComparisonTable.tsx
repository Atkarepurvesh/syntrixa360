import { Check, Minus } from "lucide-react";

import { comparison } from "@/data/site";
import { cn } from "@/lib/utils";

export function ComparisonTable() {
  const rows = comparison.traditional.map((t, i) => ({
    traditional: t,
    syntrixa: comparison.syntrixa[i],
  }));

  return (
    <div className="reveal mx-auto max-w-4xl overflow-hidden rounded-2xl border border-border shadow-card">
      <div className="grid grid-cols-2">
        <div className="bg-secondary/60 px-5 py-4 text-center text-sm font-bold text-muted-foreground sm:text-base">
          Traditional CRM
        </div>
        <div className="bg-navy px-5 py-4 text-center text-sm font-bold text-white sm:text-base">
          Syntrixa360
        </div>
      </div>
      {rows.map((row, i) => (
        <div key={row.traditional} className={cn("grid grid-cols-2", i % 2 === 1 && "bg-muted/40")}>
          <div className="flex items-center gap-2.5 border-t border-border px-5 py-4 text-sm text-muted-foreground">
            <Minus className="size-4 shrink-0 text-muted-foreground/60" aria-hidden="true" />
            {row.traditional}
          </div>
          <div className="flex items-center gap-2.5 border-t border-l border-border bg-brand-soft/40 px-5 py-4 text-sm font-semibold text-navy">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand text-white">
              <Check className="size-3" aria-hidden="true" />
            </span>
            {row.syntrixa}
          </div>
        </div>
      ))}
    </div>
  );
}
