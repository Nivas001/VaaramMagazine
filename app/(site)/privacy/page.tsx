import type { Metadata } from "next";
import { siteConfig } from "@/site.config";
import { Section } from "@/components/ui/Bento";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${siteConfig.name} collects, uses and protects the information you send us.`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <Section className="max-w-3xl">
      <h1 className="text-4xl font-extrabold sm:text-5xl">Privacy Policy</h1>
      <p className="mt-4 text-sm text-[rgb(var(--text-muted))]">
        Last updated {new Date().getFullYear()}
      </p>

      <div className="prose-custom mt-10 space-y-8 text-base leading-relaxed text-[rgb(var(--text-muted))]">
        <section>
          <h2 className="text-xl font-bold text-[rgb(var(--text))]">What we collect</h2>
          <p className="mt-3">
            You can read and download every issue on this website without giving us anything at
            all. We only receive personal information when you choose to send it — through the
            enquiry form, by email, by phone or on WhatsApp. That is normally your name, phone
            number, optional email address and whatever you write in your message.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[rgb(var(--text))]">Why we use it</h2>
          <p className="mt-3">
            We use those details for one purpose: to reply to you and, if you go ahead, to
            prepare and publish your advertisement. We do not sell your information, and we do
            not pass it to anyone outside our own team.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[rgb(var(--text))]">Counts and statistics</h2>
          <p className="mt-3">
            We keep simple counts of how many times an issue is opened or downloaded, and how
            many times an advertisement banner is shown or clicked. These are plain numbers. They
            are not linked to you, and we do not build a profile of any visitor.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[rgb(var(--text))]">Storage on your device</h2>
          <p className="mt-3">
            The only thing this site stores in your browser is your light or dark mode choice, so
            the site looks the way you left it. It never leaves your device.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[rgb(var(--text))]">How long we keep it</h2>
          <p className="mt-3">
            Enquiries are kept while we are dealing with them and for a reasonable period
            afterwards for our records. You can ask us to delete your enquiry at any time.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[rgb(var(--text))]">Contact us about your data</h2>
          <p className="mt-3">
            Write to <a className="text-[var(--color-violet)] underline underline-offset-4" href={`mailto:${siteConfig.contact.email}`}>{siteConfig.contact.email}</a>{" "}
            or call {siteConfig.contact.phone} and we will help.
          </p>
        </section>
      </div>
    </Section>
  );
}
