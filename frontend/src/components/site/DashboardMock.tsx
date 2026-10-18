import { Bell, ChevronDown, MessageSquare, Search } from "lucide-react";

import { Logo } from "@/components/site/Logo";
import { cn } from "@/lib/utils";
import {
  execFollowups,
  execKpis,
  heroKpis,
  leadSources,
  nextBestActions,
  ownerKpis,
  pipelineStages,
  teamPerformance,
} from "@/data/site";

const toneBar: Record<string, string> = {
  brand: "bg-brand",
  teal: "bg-teal",
  success: "bg-success",
  warning: "bg-warning",
  violet: "bg-violet",
  rose: "bg-rose",
};

const sidebarSets = {
  owner: [
    "Dashboard",
    "Leads",
    "Conversations",
    "Customers",
    "Follow-ups",
    "Opportunities",
    "Tasks",
    "Reports",
    "Analytics",
    "Team",
    "Settings",
  ],
  exec: [
    "My Workspace",
    "Leads",
    "Conversations",
    "Customers",
    "Follow-ups",
    "Opportunities",
    "Tasks",
    "Reports",
  ],
  manager: [
    "Dashboard",
    "Leads",
    "Conversations",
    "Customers",
    "Opportunities",
    "Pipeline",
    "Tasks",
    "Reports",
    "Analytics",
    "Team",
    "Settings",
  ],
} as const;

function Sidebar({ items, active = 0 }: { items: readonly string[]; active?: number }) {
  return (
    <div className="hidden w-[168px] shrink-0 flex-col bg-navy p-3 sm:flex">
      <div className="px-1 py-2">
        <Logo inverted compact />
      </div>
      <nav className="mt-3 flex flex-col gap-0.5">
        {items.map((item, i) => (
          <span
            key={item}
            className={cn(
              "truncate rounded-lg px-2.5 py-2 text-[11px] font-semibold",
              i === active ? "bg-brand text-white" : "text-navy-foreground/60",
            )}
          >
            {item}
          </span>
        ))}
      </nav>
    </div>
  );
}

function TopBar({
  title,
  subtitle,
  user = "Admin",
}: {
  title: string;
  subtitle: string;
  user?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
      <div>
        <p className="text-sm font-bold text-navy sm:text-base">{title}</p>
        <p className="text-[11px] text-muted-foreground">{subtitle}</p>
      </div>
      <div className="hidden items-center gap-3 sm:flex">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-[11px] text-muted-foreground">
          <Search className="size-3.5" /> Search...
        </div>
        <Bell className="size-4 text-muted-foreground" />
        <MessageSquare className="size-4 text-muted-foreground" />
        <div className="flex items-center gap-1.5">
          <span className="flex size-7 items-center justify-center rounded-full bg-brand-soft text-[10px] font-bold text-brand">
            {user.slice(0, 1)}
          </span>
          <ChevronDown className="size-3 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}

function KpiRow({
  items,
}: {
  items: readonly { label: string; value: string; delta?: string; note?: string }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {items.map((k) => (
        <div key={k.label} className="rounded-xl border border-border bg-card p-3">
          <p className="text-[10px] font-semibold text-muted-foreground">{k.label}</p>
          <p className="mt-1 text-base font-extrabold text-navy sm:text-lg">{k.value}</p>
          {k.delta ? <p className="mt-0.5 text-[10px] font-bold text-success">{k.delta}</p> : null}
          {k.note ? <p className="mt-0.5 text-[10px] font-semibold text-brand">{k.note}</p> : null}
        </div>
      ))}
    </div>
  );
}

function PipelinePanel() {
  const max = pipelineStages[0].value;
  return (
    <div className="rounded-xl border border-border bg-card p-3.5">
      <p className="text-xs font-bold text-navy">Sales Pipeline</p>
      <div className="mt-3 space-y-2">
        {pipelineStages.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <span className="w-20 shrink-0 truncate text-[10px] text-muted-foreground">
              {s.label}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
              <div
                className={cn("h-full rounded-full", toneBar[s.tone])}
                style={{ width: `${Math.max(8, (s.value / max) * 100)}%` }}
              />
            </div>
            <span className="w-10 shrink-0 text-right text-[10px] font-bold text-navy">
              {s.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LeadSourcePanel() {
  const total = leadSources.reduce((a, b) => a + b.value, 0);
  return (
    <div className="rounded-xl border border-border bg-card p-3.5">
      <p className="text-xs font-bold text-navy">Leads Source</p>
      <div className="mt-3 space-y-2">
        {leadSources.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <span className="w-16 shrink-0 truncate text-[10px] text-muted-foreground">
              {s.label}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
              <div
                className={cn("h-full rounded-full", toneBar[s.tone])}
                style={{ width: `${(s.value / total) * 260}%` }}
              />
            </div>
            <span className="w-10 shrink-0 text-right text-[10px] font-bold text-navy">
              {Math.round((s.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrendPanel() {
  const points = [30, 45, 38, 52, 60, 48, 70, 64, 78];
  const w = 100;
  const h = 40;
  const step = w / (points.length - 1);
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - (p / 100) * h}`)
    .join(" ");
  return (
    <div className="rounded-xl border border-border bg-card p-3.5">
      <p className="text-xs font-bold text-navy">Sales Trend</p>
      <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 h-16 w-full" preserveAspectRatio="none">
        <path
          d={path}
          fill="none"
          stroke="oklch(0.51 0.22 264)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

function TeamTablePanel() {
  return (
    <div className="rounded-xl border border-border bg-card p-3.5">
      <p className="text-xs font-bold text-navy">Team Performance</p>
      <div className="mt-3 overflow-hidden rounded-lg border border-border">
        <table className="w-full text-left text-[10px]">
          <thead className="bg-secondary/60 text-muted-foreground">
            <tr>
              <th className="px-2.5 py-1.5 font-semibold">Executive</th>
              <th className="px-2.5 py-1.5 font-semibold">Leads</th>
              <th className="px-2.5 py-1.5 font-semibold">Conv %</th>
            </tr>
          </thead>
          <tbody>
            {teamPerformance.map((t) => (
              <tr key={t.name} className="border-t border-border">
                <td className="px-2.5 py-1.5 font-semibold text-navy">{t.name}</td>
                <td className="px-2.5 py-1.5 text-muted-foreground">{t.leads}</td>
                <td className="px-2.5 py-1.5 font-semibold text-success">{t.rate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FollowupsPanel() {
  return (
    <div className="rounded-xl border border-border bg-card p-3.5">
      <p className="text-xs font-bold text-navy">My Follow-ups</p>
      <div className="mt-3 space-y-2.5">
        {execFollowups.map((f) => (
          <div
            key={f.name}
            className="flex items-center justify-between gap-2 border-b border-border pb-2 last:border-0 last:pb-0"
          >
            <div className="min-w-0">
              <p className="truncate text-[11px] font-bold text-navy">{f.name}</p>
              <p className="truncate text-[10px] text-muted-foreground">{f.note}</p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold",
                f.priority === "High"
                  ? "bg-rose-soft text-rose"
                  : f.priority === "Medium"
                    ? "bg-warning-soft text-warning"
                    : "bg-success-soft text-success",
              )}
            >
              {f.priority}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NextActionsPanel() {
  return (
    <div className="rounded-xl border border-border bg-card p-3.5">
      <p className="text-xs font-bold text-navy">Next Best Actions</p>
      <div className="mt-3 space-y-2.5">
        {nextBestActions.map((a) => (
          <div
            key={a.title}
            className="flex items-center justify-between gap-2 border-b border-border pb-2 last:border-0 last:pb-0"
          >
            <div className="min-w-0">
              <p className="truncate text-[11px] font-bold text-navy">{a.title}</p>
              <p className="truncate text-[10px] text-muted-foreground">{a.note}</p>
            </div>
            <span className="shrink-0 rounded-lg bg-brand px-2.5 py-1 text-[9px] font-bold text-brand-foreground">
              {a.action}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardMock({
  variant = "owner",
  className,
}: {
  variant?: "hero" | "owner" | "exec" | "manager";
  className?: string;
}) {
  const config = {
    hero: {
      sidebar: sidebarSets.owner,
      title: "Dashboard",
      subtitle: "Welcome back, Admin",
      kpis: heroKpis,
      panels: ["pipeline", "trend"],
    },
    owner: {
      sidebar: sidebarSets.owner,
      title: "Owner Dashboard",
      subtitle: "Welcome back, Admin",
      kpis: ownerKpis,
      panels: ["pipeline", "source", "trend", "team"],
    },
    manager: {
      sidebar: sidebarSets.manager,
      title: "Manager Dashboard",
      subtitle: "01 May – 31 May 2024",
      kpis: ownerKpis,
      panels: ["pipeline", "source", "team", "trend"],
    },
    exec: {
      sidebar: sidebarSets.exec,
      title: "My Workspace",
      subtitle: "Welcome back, Rahul",
      kpis: execKpis,
      panels: ["followups", "actions"],
    },
  }[variant];

  return (
    <div
      className={cn(
        "flex overflow-hidden rounded-2xl border border-border bg-background shadow-panel",
        className,
      )}
    >
      <Sidebar items={config.sidebar} />
      <div className="min-w-0 flex-1">
        <TopBar title={config.title} subtitle={config.subtitle} />
        <div className="space-y-3 p-3.5 sm:p-4">
          <KpiRow items={config.kpis as never} />
          <div className="grid gap-3 sm:grid-cols-2">
            {config.panels.includes("pipeline") ? <PipelinePanel /> : null}
            {config.panels.includes("source") ? <LeadSourcePanel /> : null}
            {config.panels.includes("trend") ? <TrendPanel /> : null}
            {config.panels.includes("team") ? <TeamTablePanel /> : null}
            {config.panels.includes("followups") ? <FollowupsPanel /> : null}
            {config.panels.includes("actions") ? <NextActionsPanel /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
