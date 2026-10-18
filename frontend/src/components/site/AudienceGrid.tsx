import { IconBadge, BulletList } from "@/components/site/primitives";
import { audiences } from "@/data/site";

export function AudienceGrid() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {audiences.map((a) => (
        <article
          key={a.title}
          className="reveal flex flex-col rounded-[20px] border border-border bg-card p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-lift"
        >
          <IconBadge name={a.icon} tone={a.tone} size="lg" />
          <h3 className="mt-5 text-base font-bold text-navy">{a.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{a.description}</p>
          <div className="mt-4 border-t border-border pt-4">
            <BulletList items={a.points} tone={a.tone} />
          </div>
        </article>
      ))}
    </div>
  );
}
