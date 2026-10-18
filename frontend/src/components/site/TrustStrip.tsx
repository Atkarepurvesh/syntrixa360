import { trustedCompanies } from "@/data/site";

export function TrustStrip() {
  return (
    <section className="border-y border-white/10 bg-navy py-8">
      <div className="container-page">
        <p className="text-center text-xs font-bold tracking-[0.14em] text-navy-foreground/60 uppercase">
          Trusted by growing businesses across industries
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {trustedCompanies.map((name) => (
            <span
              key={name}
              className="text-sm font-bold tracking-wide text-navy-foreground/50 sm:text-base"
            >
              {name}
            </span>
          ))}
        </div>
        <p className="mt-4 text-center text-[11px] text-navy-foreground/35">
          Sample business names shown for illustration.
        </p>
      </div>
    </section>
  );
}
