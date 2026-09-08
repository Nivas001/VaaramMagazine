import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { siteConfig, whatsappLink } from "@/site.config";
import { ContactForm } from "@/components/site/ContactForm";
import { Section, Eyebrow } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Contact — advertise with Vaaram",
  description: `Get in touch with ${siteConfig.name} about advertising in the weekly edition, or with any question about the publication.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const whatsapp = whatsappLink(
    "Hello Vaaram Magazine, I'd like to advertise in an upcoming edition."
  );

  return (
    <Section className="!pt-14 sm:!pt-20">
      <header className="max-w-2xl">
        <Eyebrow>Contact</Eyebrow>
        <h1 className="display-xl mt-5">Let&apos;s connect.</h1>
        <p className="lead mt-6">
          Whether you want to advertise in the next edition or just have a question about
          the magazine, this reaches us directly.
        </p>
      </header>

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

          <div className="card-quiet mt-10 p-6">
            <h3 className="font-display text-xl tracking-[-0.02em]">
              Advertising in the next edition
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed text-[rgb(var(--text-muted))]">
              Send us what you want to say and roughly how much space you have in mind. We
              lay the advertisement out for you and send a proof to approve before it is
              published.
            </p>
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
          className="flex gap-4 py-4 transition-colors hover:text-[rgb(var(--accent))]"
        >
          {inner}
        </a>
      ) : (
        <div className="flex gap-4 py-4">{inner}</div>
      )}
    </li>
  );
}
