import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { siteConfig } from "@/site.config";
import { Masthead } from "@/components/site/Logo";
import { BannerAd } from "@/components/ads/AdSlot";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/archives", label: "Archives" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const LEGAL = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export function Footer() {
  const socials = Object.entries(siteConfig.social).filter(([, url]) => url);

  return (
    <footer className="border-t border-[rgb(var(--hairline))] bg-[rgb(var(--surface-2))]">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="py-10">
          <BannerAd placement="footer" />
        </div>

        <div className="grid gap-12 border-t border-[rgb(var(--hairline))] py-14 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-16">
          <div>
            <Masthead />
            <p className="mt-6 max-w-xs text-[15px] leading-relaxed text-[rgb(var(--text-muted))]">
              {siteConfig.shortDescription}
            </p>
          </div>

          <nav aria-label="Footer">
            <h2 className="label-eyebrow text-[rgb(var(--text-faint))]">Browse</h2>
            <ul className="mt-5 space-y-3">
              {NAV.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-[15px] text-[rgb(var(--text-muted))] transition-colors hover:text-[rgb(var(--text))]"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="label-eyebrow text-[rgb(var(--text-faint))]">Get in touch</h2>
            <ul className="mt-5 space-y-3.5 text-[15px] text-[rgb(var(--text-muted))]">
              <li>
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="inline-flex items-center gap-2.5 transition-colors hover:text-[rgb(var(--text))]"
                >
                  <Mail className="size-4 shrink-0 text-[rgb(var(--text-faint))]" aria-hidden />
                  {siteConfig.contact.email}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${siteConfig.contact.phone.replace(/\s/g, "")}`}
                  className="inline-flex items-center gap-2.5 transition-colors hover:text-[rgb(var(--text))]"
                >
                  <Phone className="size-4 shrink-0 text-[rgb(var(--text-faint))]" aria-hidden />
                  {siteConfig.contact.phone}
                </a>
              </li>
              <li className="inline-flex items-start gap-2.5">
                <MapPin
                  className="mt-0.5 size-4 shrink-0 text-[rgb(var(--text-faint))]"
                  aria-hidden
                />
                {siteConfig.contact.address}
              </li>
            </ul>

            {socials.length > 0 && (
              <ul className="mt-6 flex gap-4">
                {socials.map(([name, url]) => (
                  <li key={name}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm capitalize text-[rgb(var(--text-muted))] underline decoration-[rgb(var(--hairline))] underline-offset-4 transition-colors hover:text-[rgb(var(--text))]"
                    >
                      {name}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-[rgb(var(--hairline))] py-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-[rgb(var(--text-faint))]">
            © {new Date().getFullYear()} {siteConfig.legalName}. All rights reserved.
          </p>
          <ul className="flex items-center gap-6">
            {LEGAL.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-[13px] text-[rgb(var(--text-faint))] transition-colors hover:text-[rgb(var(--text))]"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
