import { icons, type LucideProps } from "lucide-react";

export type ToneName = "brand" | "navy" | "success" | "warning" | "violet" | "teal" | "rose";

export const toneClasses: Record<ToneName, string> = {
  brand: "bg-brand-soft text-brand",
  navy: "bg-secondary text-navy",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  violet: "bg-violet-soft text-violet",
  teal: "bg-teal-soft text-teal",
  rose: "bg-rose-soft text-rose",
};

export function Icon({ name, ...props }: { name: string } & LucideProps) {
  const Cmp = icons[name as keyof typeof icons] ?? icons.Circle;
  return <Cmp aria-hidden="true" {...props} />;
}
