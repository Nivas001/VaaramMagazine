import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { siteConfig, whatsappLink } from "@/site.config";
import { ContactForm } from "@/components/site/ContactForm";
import { Faq, FaqJsonLd } from "@/components/site/Faq";
import { Section, Eyebrow } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { ConnectIllustration, ProofIllustration } from "@/components/ui/Illustration";

export const metadata: Metadata = {
  title: "Contact — advertise with Vaaram",
  description: `Get in touch with ${siteConfig.name} about advertising in the weekly edition, or with any question about the publication.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const whatsapp = whatsappLink(
    "Hello Vaaram Magazine, I'd like to advertise in an upcoming edition."
  );
  const faq = [...siteConfig.faq];

  return (
    <>
      <FaqJsonLd items={faq} />

      <Section className="!pt-14 sm:!pt-20">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.5fr)] lg:gap-16">
          <header className="max-w-2xl">
            <Eyebrow>Contact</Eyebrow>
            <h1 className="display-xl mt-5">Let&apos;s connect.</h1>
            <p className="lead mt-6">
              Whether you want to advertise in the next edition or just have a question
              about the magazine, this reaches us directly. We answer during office hours,
              usually the same day.
            </p>
          </header>

          <div className="hidden justify-end lg:flex">
            <ConnectIllustration className="max-w-[280px]" />
          </div>
        </div>

        <div className="mt-14 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-16 xl:gap-24">
          {/* ── Direct details ───────────────────────────────────────────── */}
          <Reveal>
            <h2 className="label-eyebrow text-[rgb(var(--text-faint))]">Reach us directly</h2>

            <ul className="mt-6 space-y-px">
              <ContactRow
                Icon={Phone}
                label="Phone"
                value={siteConfig.contact.phone}
                href={`tel:${siteConfig.contact.phone.replace(/\s/g, "")}`}
              />
              {whatsapp && (
                <ContactRow
                  Icon={MessageCircle}
                  label="WhatsApp"
                  value="Message our desk"
                  href={whatsapp}
                  external
                />
              )}
              <ContactRow
                Icon={Mail}
                label="Email"
                value={siteConfig.contact.email}
                href={`mailto:${siteConfig.contact.email}`}
              />
              <ContactRow Icon={MapPin} label="Address" value={siteConfig.contact.address} />
              <ContactRow Icon={Clock} label="Office hours" value={siteConfig.contact.hours} />
            </ul>

            <div className="card-quiet mt-10 overflow-hidden">
              <div className="flex items-center justify-center border-b border-[rgb(var(--hairline))] px-8 py-7">
                <ProofIllustration className="max-w-[210px]" />
              </div>
              <div className="p-6">
                <h3 className="font-display text-xl tracking-[-0.02em]">
                  Advertising in the next edition
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-[rgb(var(--text-muted))]">
                  Send us what you want to say and roughly how much space you have in mind.
                  We lay the advertisement out for you and send a proof to approve before it
                  is published.
                </p>
              </div>
            </div>
          </Reveal>

          {/* ── Form ─────────────────────────────────────────────────────── */}
          <Reveal delay={0.08}>
            <h2 className="label-eyebrow text-[rgb(var(--text-faint))]">Send an enquiry</h2>
            <div className="mt-6">
              <ContactForm />
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ── Questions ──────────────────────────────────────────────────── */}
      <div className="bg-[rgb(var(--surface-2))]">
        <Section>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:gap-16">
            <Reveal>
              <Eyebrow>Before you write</Eyebrow>
              <h2 className="display-lg mt-5 max-w-sm">
                The questions we get asked most.
              </h2>
              <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-[rgb(var(--text-muted))]">
                If the answer is not here, ask us — the form above reaches the same desk as
                the phone.
              </p>
            </Reveal>

            <div>
              <Faq items={faq} />
            </div>
          </div>
        </Section>
      </div>

    </>
  );
}

function ContactRow({
  Icon,
  label,
  value,
  href,
  external,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href?: string;
  external?: boolean;
}) {
  const inner = (
    <>
      <Icon className="mt-0.5 size-[18px] shrink-0 text-[rgb(var(--text-faint))]" />
      <span className="min-w-0">
        <span className="label-eyebrow block text-[rgb(var(--text-faint))]">{label}</span>
        <span className="mt-1.5 block text-[15px] text-[rgb(var(--text))]">{value}</span>
      </span>
    </>
  );

  return (
    <li className="border-b border-[rgb(var(--hairline))]">
      {href ? (
        <a
          href={href}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="flex gap-4 py-4 transition-colors hover:text-[rgb(var(--accent-text))]"
        >
          {inner}
        </a>
      ) : (
        <div className="flex gap-4 py-4">{inner}</div>
      )}
    </li>
  );
}
