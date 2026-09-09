import type { Metadata } from "next";
import { siteConfig } from "@/site.config";
import { Section } from "@/components/ui/Section";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${siteConfig.name} collects, uses and protects the information you send us.`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <Section width="narrow" className="!pt-14 sm:!pt-20">
      <h1 className="display-lg">Privacy Policy</h1>
      <p className="mt-4 text-sm text-[rgb(var(--text-muted))]">
        Last updated {new Date().getFullYear()}
      </p>

      <div className="mt-10 space-y-9 text-[16px] leading-relaxed text-[rgb(var(--text-muted))]">
        <section>
          <h2 className="font-display text-2xl tracking-[-0.02em] text-[rgb(var(--text))]">What we collect</h2>
          <p className="mt-3">
            You can read and download every edition on this website without giving us anything at
            all. We only receive personal information when you choose to send it — through the
            enquiry form, by email, by phone or on WhatsApp. That is normally your name, phone
            number, optional email address and whatever you write in your message.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl tracking-[-0.02em] text-[rgb(var(--text))]">
            The weekly email list
          </h2>
          <p className="mt-3">
            If you ask to be told when a new edition is published, we store the email address you
            typed, the date you gave it and which page on this site you gave it from. Nothing
            else — no name, no interests, no tracking of what you open. We use it for one thing:
            sending you a link to the week&apos;s edition. Ask us to remove you, from any of those
            emails or by writing to us, and the address is switched off the same day and is never
            added back.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl tracking-[-0.02em] text-[rgb(var(--text))]">Why we use it</h2>
          <p className="mt-3">
            We use those details for one purpose: to reply to you and, if you go ahead, to
            prepare and publish your advertisement. We do not sell your information, and we do
            not pass it to anyone outside our own team.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl tracking-[-0.02em] text-[rgb(var(--text))]">Counts and statistics</h2>
          <p className="mt-3">
            We keep simple counts of how many times an edition is opened or downloaded, and how
            many times an advertisement banner is shown or clicked. These are plain numbers. They
            are not linked to you, and we do not build a profile of any visitor.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl tracking-[-0.02em] text-[rgb(var(--text))]">Storage on your device</h2>
          <p className="mt-3">
            The only thing this site stores in your browser is your light or dark mode choice, so
            the site looks the way you left it. It never leaves your device.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl tracking-[-0.02em] text-[rgb(var(--text))]">How long we keep it</h2>
          <p className="mt-3">
            Enquiries are kept while we are dealing with them and for a reasonable period
            afterwards for our records. You can ask us to delete your enquiry at any time. An
            unsubscribed email address is kept in a switched-off state rather than deleted, purely
            so that a later import can never quietly put it back on the list — tell us if you
            would prefer it removed outright and we will do that instead.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl tracking-[-0.02em] text-[rgb(var(--text))]">Contact us about your data</h2>
          <p className="mt-3">
            Write to <a className="font-medium text-[rgb(var(--accent-text))] underline underline-offset-4" href={`mailto:${siteConfig.contact.email}`}>{siteConfig.contact.email}</a>{" "}
            or call {siteConfig.contact.phone} and we will help.
          </p>
        </section>
      </div>
    </Section>
  );
}
