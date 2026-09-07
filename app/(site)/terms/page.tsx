import type { Metadata } from "next";
import { siteConfig } from "@/site.config";
import { Section } from "@/components/ui/Bento";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: `The terms that apply when you use the ${siteConfig.name} website or advertise with us.`,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <Section className="max-w-3xl">
      <h1 className="text-4xl font-extrabold sm:text-5xl">Terms of Use</h1>
      <p className="mt-4 text-sm text-[rgb(var(--text-muted))]">
        Last updated {new Date().getFullYear()}
      </p>

      <div className="mt-10 space-y-8 text-base leading-relaxed text-[rgb(var(--text-muted))]">
        <section>
          <h2 className="text-xl font-bold text-[rgb(var(--text))]">Reading and sharing</h2>
          <p className="mt-3">
            Every issue on this site is free to read, download and share in full. Please share the
            complete PDF as published rather than extracting individual advertisements, so
            advertisers get the context they paid for.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[rgb(var(--text))]">Advertisements</h2>
          <p className="mt-3">
            Advertisements are supplied by third parties. We check submissions before publishing,
            but we cannot guarantee the goods, services, prices or claims in any advertisement.
            Please make your own checks before paying anyone or sharing personal details.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[rgb(var(--text))]">Booking an advertisement</h2>
          <p className="mt-3">
            Space is confirmed once we have agreed the rate and received your approval of the
            proof. We may decline or withdraw any advertisement that is misleading, unlawful or
            unsuitable for a family newspaper. Where an error on our side materially affects an
            advertisement, we will repeat it in the next issue at no charge.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[rgb(var(--text))]">Our content</h2>
          <p className="mt-3">
            The name, layout and design of {siteConfig.legalName} remain ours. Advertisers keep
            the rights to the artwork and logos they supply.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[rgb(var(--text))]">Availability</h2>
          <p className="mt-3">
            We aim to keep this website online at all times but cannot promise uninterrupted
            access. Issues are published weekly; occasional delays can happen.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[rgb(var(--text))]">Questions</h2>
          <p className="mt-3">
            Contact us at{" "}
            <a className="text-[var(--color-violet)] underline underline-offset-4" href={`mailto:${siteConfig.contact.email}`}>
              {siteConfig.contact.email}
            </a>
            .
          </p>
        </section>
      </div>
    </Section>
  );
}
