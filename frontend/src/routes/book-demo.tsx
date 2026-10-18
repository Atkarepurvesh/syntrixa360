import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { CalendarCheck, CircleCheck } from "lucide-react";

import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { IconBadge, PageHero } from "@/components/site/primitives";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/book-demo")({
  head: () => ({
    meta: [
      { title: "Book a Demo | Syntrixa360" },
      {
        name: "description",
        content:
          "Request a Syntrixa360 demo and see how it can help your team capture leads, follow up and close more deals.",
      },
    ],
  }),
  component: BookDemoPage,
});

function BookDemoPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage("");
    setSubmitting(true);
    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") || "").trim(),
      email: String(data.get("email") || "").trim(),
      company: String(data.get("company") || "").trim(),
      phone: String(data.get("phone") || "").trim(),
      industry: String(data.get("industry") || ""),
      team_size: String(data.get("team_size") || ""),
      message: String(data.get("message") || "").trim(),
    };
    try {
      const response = await fetch("/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, website: String(data.get("website") || "") }),
      });
      const result = (await response.json().catch(() => ({}))) as { detail?: unknown };
      if (!response.ok) {
        const detail = result.detail;
        throw new Error(
          typeof detail === "string"
            ? detail
            : "Could not submit your request. Please check the form and try again.",
        );
      }
      setSubmitted(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <PageHero
          eyebrow="Book a Demo"
          title="See Syntrixa360"
          highlight="in Action"
          subtitle="Tell us a little about your business and our team will walk you through Syntrixa360 with examples relevant to your industry."
        />

        <section className="section-y">
          <div className="container-page max-w-2xl">
            {submitted ? (
              <div className="reveal rounded-2xl border border-border bg-card p-10 text-center shadow-card">
                <IconBadge name="CircleCheck" tone="success" size="lg" round className="mx-auto" />
                <h2 className="mt-5 text-2xl font-extrabold text-navy">
                  Thank you — request received!
                </h2>
                <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                  Our team will reach out shortly to schedule your personalized Syntrixa360 demo.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="reveal space-y-6 rounded-2xl border border-border bg-card p-7 shadow-card sm:p-9"
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input id="name" name="name" required minLength={2} maxLength={120} placeholder="Jane Smith" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Work Email *</Label>
                    <Input id="email" name="email" type="email" required maxLength={254} placeholder="jane@company.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company Name *</Label>
                    <Input id="company" name="company" required maxLength={160} placeholder="Acme Industries" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input id="phone" name="phone" type="tel" required maxLength={30} placeholder="+91 98765 43210" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry *</Label>
                    <Select name="industry" required>
                      <SelectTrigger id="industry">
                        <SelectValue placeholder="Select Industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wholesale">Wholesale & Distribution</SelectItem>
                        <SelectItem value="export">Export & International Trade</SelectItem>
                        <SelectItem value="manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="trading">Trading Business</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="team-size">Number of Sales Executives *</Label>
                    <Select name="team_size" required>
                      <SelectTrigger id="team-size">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-3">1–3</SelectItem>
                        <SelectItem value="4-10">4–10</SelectItem>
                        <SelectItem value="11-25">11–25</SelectItem>
                        <SelectItem value="25+">25+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us about your current sales process..."
                    name="message"
                    maxLength={2000}
                    rows={4}
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3.5 text-sm font-bold text-brand-foreground transition-colors hover:bg-navy sm:w-auto"
                  disabled={submitting}
                >
                  <CalendarCheck className="size-4" aria-hidden="true" />
                  {submitting ? "Submitting..." : "Request a Demo"}
                </button>
                {errorMessage && <p role="alert" className="text-sm text-destructive">{errorMessage}</p>}
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CircleCheck className="size-3.5 shrink-0 text-success" aria-hidden="true" />
                  No obligation. No credit card required.
                </p>
              </form>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
