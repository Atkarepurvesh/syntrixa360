import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ArrowRight, Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Icon, toneClasses, type ToneName } from "./Icon";

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-brand-soft px-3.5 py-1.5 text-xs font-bold tracking-[0.14em] text-brand uppercase",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "reveal max-w-3xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className,
      )}
    >
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="mt-4 text-3xl font-extrabold text-navy sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">{subtitle}</p>
      ) : null}
    </div>
  );
}

export function CTAButton({
  to,
  children,
  variant = "primary",
  className,
  withArrow = true,
}: {
  to: string;
  children: ReactNode;
  variant?: "primary" | "outline" | "navy" | "ghost";
  className?: string;
  withArrow?: boolean;
}) {
  const styles: Record<string, string> = {
    primary: "bg-brand text-brand-foreground hover:bg-navy shadow-card",
    outline:
      "border border-brand/30 bg-background text-brand hover:border-brand hover:bg-brand-soft",
    navy: "bg-navy text-navy-foreground hover:bg-navy-soft",
    ghost: "text-brand hover:bg-brand-soft",
  };
  return (
    <Link
      to={to}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
        styles[variant],
        className,
      )}
    >
      {children}
      {withArrow ? <ArrowRight className="size-4" aria-hidden="true" /> : null}
    </Link>
  );
}

export function IconBadge({
  name,
  tone = "brand",
  size = "md",
  round = false,
  className,
}: {
  name: string;
  tone?: ToneName;
  size?: "sm" | "md" | "lg";
  round?: boolean;
  className?: string;
}) {
  const sizes = { sm: "size-9", md: "size-12", lg: "size-14" };
  const iconSizes = { sm: 18, md: 22, lg: 26 };
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center",
        round ? "rounded-full" : "rounded-xl",
        sizes[size],
        toneClasses[tone],
        className,
      )}
    >
      <Icon name={name} size={iconSizes[size]} />
    </span>
  );
}

export function InfoCard({
  icon,
  tone = "brand",
  title,
  description,
  children,
  className,
  numbered,
}: {
  icon?: string;
  tone?: ToneName;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  numbered?: number;
}) {
  return (
    <article
      className={cn(
        "group reveal flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-lift",
        className,
      )}
    >
      {icon ? <IconBadge name={icon} tone={tone} /> : null}
      <h3 className="mt-5 text-lg font-bold text-navy">
        {numbered ? <span className="text-muted-foreground">{numbered}. </span> : null}
        {title}
      </h3>
      {description ? (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
      {children}
    </article>
  );
}

export function BulletList({
  items,
  tone = "brand",
}: {
  items: readonly string[];
  tone?: ToneName;
}) {
  return (
    <ul className="mt-4 space-y-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-sm text-foreground">
          <span
            className={cn(
              "mt-0.5 inline-flex size-4.5 items-center justify-center rounded-full",
              toneClasses[tone],
            )}
          >
            <Check className="size-3" aria-hidden="true" />
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}

export function PageHero({
  eyebrow,
  title,
  highlight,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  highlight?: string;
  subtitle: string;
  children?: ReactNode;
}) {
  return (
    <section className="border-b border-border bg-gradient-to-b from-surface to-background">
      <div className="container-page py-14 lg:py-20">
        <div className="reveal max-w-3xl">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="mt-5 text-4xl font-extrabold text-navy sm:text-5xl lg:text-[3.4rem] lg:leading-[1.05]">
            {title} {highlight ? <span className="text-brand">{highlight}</span> : null}
          </h1>
          <p className="mt-5 text-base text-muted-foreground sm:text-lg">{subtitle}</p>
        </div>
        {children}
      </div>
    </section>
  );
}
