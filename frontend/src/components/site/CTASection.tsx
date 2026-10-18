import { Calendar, MessageCircle, Target } from "lucide-react";

import { CTAButton } from "@/components/site/primitives";

export function CTASection({
  title = "If you sell, follow-up and build relationships, Syntrixa360 is for you.",
  subtitle = "One platform. Every step. Better results.",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <section className="section-y">
      <div className="container-page">
        <div className="reveal flex flex-col items-center gap-8 rounded-3xl border border-brand/15 bg-gradient-to-br from-brand-soft via-surface to-brand-soft p-8 sm:p-10 lg:flex-row lg:items-center lg:justify-between lg:p-14">
          <div className="flex items-center gap-6 lg:gap-8">
            <span className="relative hidden size-24 shrink-0 items-center justify-center rounded-full border-4 border-white bg-white shadow-lift sm:flex lg:size-28">
              <Target className="size-11 text-brand lg:size-12" aria-hidden="true" />
              <span className="absolute -top-1 -right-1 flex size-9 items-center justify-center rounded-full bg-navy text-white shadow-card">
                <MessageCircle className="size-4" aria-hidden="true" />
              </span>
            </span>
            <div className="text-center lg:text-left">
              <h2 className="text-2xl font-extrabold text-navy sm:text-3xl lg:text-[2.15rem] lg:leading-tight">
                {title}
              </h2>
              <p className="mt-2 text-base font-semibold text-brand">{subtitle}</p>
            </div>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <CTAButton to="/book-demo" className="w-full sm:w-auto">
              <Calendar className="size-4" aria-hidden="true" />
              Book a Demo
            </CTAButton>
          </div>
        </div>
      </div>
    </section>
  );
}
