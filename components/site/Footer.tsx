import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { FacebookIcon, InstagramIcon, YoutubeIcon } from "@/components/site/BrandIcons";
import { siteConfig, whatsappLink } from "@/site.config";
import { AdSlot } from "@/components/ads/AdSlot";
import { Logo } from "@/components/site/Logo";

export function Footer() {
  const year = new Date().getFullYear();

  const socials = [
    { href: siteConfig.social.facebook, Icon: FacebookIcon, label: "Facebook" },
    { href: siteConfig.social.instagram, Icon: InstagramIcon, label: "Instagram" },
    { href: siteConfig.social.youtube, Icon: YoutubeIcon, label: "YouTube" },
  ].filter((s) => s.href);

  return (
    <footer className="relative mt-20 border-t border-neutral-200 dark:border-neutral-900 bg-neutral-100 dark:bg-[#070707] transition-colors duration-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <AdSlot placement="footer" className="my-10" />
      </div>

      <div className="border-t border-neutral-200 dark:border-neutral-900">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Link href="/" className="group inline-block">
              <Logo variant="full" size="md" />
            </Link>
            <p className="mt-4 max-w-xs font-sans text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              Canada&apos;s premier weekly broadsheet and community magazine. Published fresh every week and 100% free to read or download.
            </p>
            {socials.length > 0 && (
              <div className="mt-6 flex gap-2">
                {socials.map(({ href, Icon, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="grid size-8 place-items-center border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-[#121212] text-neutral-600 dark:text-neutral-400 hover:border-[#cd2129] hover:text-[#cd2129] dark:hover:text-white transition-colors"
                  >
                    <Icon className="size-3.5" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <nav aria-label="Site">
            <h3 className="font-display text-xs uppercase tracking-widest text-[#b89028] dark:text-[#d2ac47]">
              EXPLORE
            </h3>
            <ul className="mt-4 space-y-2.5 font-sans text-xs font-bold uppercase tracking-wider">
              {[
                { href: "/editions", label: "ALL ISSUES" },
                { href: "/advertise", label: "PLACE AN AD" },
                { href: "/about", label: "ABOUT US" },
                { href: "/about#how-it-works", label: "HOW IT WORKS" },
                { href: "/contact", label: "CONTACT" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-neutral-600 dark:text-neutral-400 transition-colors hover:text-[#cd2129]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Editions">
            <h3 className="font-display text-xs uppercase tracking-widest text-[#b89028] dark:text-[#d2ac47]">
              {siteConfig.editions.length > 1 ? "EDITIONS" : "ISSUES"}
            </h3>
            <ul className="mt-4 space-y-2.5 font-sans text-xs font-bold uppercase tracking-wider">
              {siteConfig.editions.map((e) => (
                <li key={e.slug}>
                  <Link
                    href={`/editions?edition=${e.slug}`}
                    className="text-neutral-600 dark:text-neutral-400 transition-colors hover:text-[#cd2129]"
                  >
                    {e.name} EDITION
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className="font-display text-xs uppercase tracking-widest text-[#b89028] dark:text-[#d2ac47]">
              REACH US
            </h3>
            <ul className="mt-4 space-y-3 font-sans text-xs text-neutral-600 dark:text-neutral-400">
              <li>
                <a
                  href={`tel:${siteConfig.contact.phone.replace(/\s/g, "")}`}
                  className="flex items-start gap-2.5 transition-colors hover:text-[#cd2129]"
                >
                  <Phone className="mt-0.5 size-4 shrink-0 text-[#cd2129]" />
                  {siteConfig.contact.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="flex items-start gap-2.5 transition-colors hover:text-[#cd2129]"
                >
                  <Mail className="mt-0.5 size-4 shrink-0 text-[#cd2129]" />
                  {siteConfig.contact.email}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-[#cd2129]" />
                <span>{siteConfig.contact.address}</span>
              </li>
            </ul>
            <div className="mt-5 flex flex-col gap-2">
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 border border-[#25D366] bg-[#25D366]/10 px-4 py-2 font-display text-xs font-bold uppercase tracking-wider text-[#1e8343] dark:text-[#25D366] hover:bg-[#25D366] hover:text-white dark:hover:text-black transition-all"
              >
                MESSAGE ON WHATSAPP
              </a>
              <a
                href={`mailto:${siteConfig.contact.email}?subject=Vaaram%20Magazine%20Enquiry`}
                className="inline-flex items-center justify-center gap-2 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-2 font-display text-xs uppercase tracking-wider text-neutral-800 dark:text-white hover:border-[#cd2129] hover:text-[#cd2129] transition-colors"
              >
                EMAIL EDITORIAL DESK
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-200 dark:border-neutral-900">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 font-sans text-xs font-medium tracking-wide text-neutral-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>
              © {year} {siteConfig.legalName} (www.vaaram.ca). ALL RIGHTS RESERVED.
            </p>
            <div className="flex gap-6 uppercase font-bold tracking-wider">
              <Link href="/privacy" className="transition-colors hover:text-[#cd2129]">
                PRIVACY
              </Link>
              <Link href="/terms" className="transition-colors hover:text-[#cd2129]">
                TERMS
              </Link>
              <Link href="/admin" className="transition-colors hover:text-[#cd2129]">
                ADMIN
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
