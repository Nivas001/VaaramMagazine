"use client";

import Link from "next/link";
import { ArrowRight, Download, MessageCircle, Sparkles } from "lucide-react";
import { siteConfig, whatsappLink } from "@/site.config";
import { ButtonLink } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Bento";
import type { Publication } from "@/lib/types";

/**
 * Clean, uncluttered Vaaram Magazine Hero Section.
 * Crystal-clear purpose: Read latest issue, download free PDF, or contact via WhatsApp/Email.
 */
export function Hero({ latest }: { latest: Publication[] }) {
  const featuredIssue = latest[0];

  return (
    <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 sm:pt-14">
      {/* ── Editorial Header ─────────────────────────────────────────────── */}
      <div className="mx-auto max-w-3xl text-center">
        <Eyebrow>
          ESTABLISHED {siteConfig.since} · WWW.VAARAM.CA · CANADA&apos;S WEEKLY BROADSHEET
        </Eyebrow>

        <h1 className="mt-5 font-display text-4xl sm:text-6xl md:text-7xl uppercase tracking-wide text-neutral-950 dark:text-white">
          DISCOVER. CONNECT.{" "}
          <span className="text-[#cd2129]">EVERY WEEK.</span>
        </h1>

        <p className="mx-auto mt-4 max-w-2xl font-sans text-base leading-relaxed text-neutral-600 dark:text-neutral-400 sm:text-lg">
          Canada&apos;s premier weekly community newspaper and digital broadsheet.
          Read the complete edition online for free or download the print-ready PDF every Sunday morning.
        </p>

        {/* Primary Call-to-Action Buttons */}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <ButtonLink href="/editions" size="lg">
            READ LATEST ISSUE <ArrowRight className="size-4" />
          </ButtonLink>

          <a
            href={whatsappLink("Hello Vaaram Magazine, I would like to place an ad or submit an announcement.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center justify-center gap-2 border border-[#25D366] bg-[#25D366]/10 px-6 font-display text-xs uppercase tracking-wider text-[#1e8343] dark:text-[#25D366] font-bold hover:bg-[#25D366] hover:text-white dark:hover:text-black transition-all"
          >
            <span className="size-2 rounded-full bg-[#25D366] animate-pulse" />
            <MessageCircle className="size-4" />
            CHAT ON WHATSAPP
          </a>

          <ButtonLink href="/advertise" size="lg" variant="outline">
            AD RATES & INFO
          </ButtonLink>
        </div>

        {/* Reassurance Features */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-xs font-sans font-bold tracking-wider text-neutral-500 uppercase">
          <span>✓ 100% FREE READ & DOWNLOAD</span>
          <span className="text-neutral-300 dark:text-neutral-700">•</span>
          <span>✓ ZERO REGISTRATION OR FORMS</span>
          <span className="text-neutral-300 dark:text-neutral-700">•</span>
          <span>✓ FRESH SUNDAYS AT 6:00 AM</span>
        </div>
      </div>

      {/* ── Featured Current Issue Showcase ─────────────────────────────── */}
      {featuredIssue && (
        <div className="mt-12 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#0c0c0c] p-6 sm:p-10 shadow-sm">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.35fr]">
            {/* Magazine Cover */}
            <div className="flex justify-center">
              <Link
                href={`/editions/${featuredIssue.slug}`}
                className="group relative block max-w-[340px] overflow-hidden border border-neutral-300 dark:border-neutral-800 shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                {featuredIssue.cover_url ? (
                  <img
                    src={featuredIssue.cover_url}
                    alt={featuredIssue.title}
                    className="aspect-[3/4] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="aspect-[3/4] w-full bg-neutral-900 grid place-items-center text-white">
                    {featuredIssue.title}
                  </div>
                )}
                <div className="absolute right-3 top-3 bg-[#cd2129] px-2.5 py-1 font-display text-xs text-white uppercase tracking-wider">
                  CURRENT ISSUE
                </div>
              </Link>
            </div>

            {/* Issue Overview & Direct Actions */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center bg-[#cd2129] px-2.5 py-0.5 font-display text-xs font-normal uppercase tracking-wider text-white">
                  LATEST EDITION
                </span>
                <span className="font-display text-xs uppercase tracking-widest text-[#b89028] dark:text-[#d2ac47]">
                  ISSUE #204 • SUNDAY BROADGUARD
                </span>
              </div>

              <h2 className="mt-3 font-display text-3xl sm:text-4xl uppercase tracking-wide text-neutral-900 dark:text-white">
                {featuredIssue.title}
              </h2>

              <p className="mt-3 font-sans text-sm leading-relaxed text-neutral-600 dark:text-neutral-400 sm:text-base">
                {featuredIssue.description}
              </p>

              {/* Fast Specs */}
              <div className="mt-5 grid grid-cols-2 gap-2.5 border-y border-neutral-200 dark:border-neutral-800 py-3.5 font-sans text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                <div className="flex items-center gap-2">
                  <span className="size-1.5 bg-[#cd2129]" />
                  <span>32 PAGES FULL BROADSHEET</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-1.5 bg-[#cd2129]" />
                  <span>350+ VERIFIED CLASSIFIEDS</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-1.5 bg-[#cd2129]" />
                  <span>REAL ESTATE & CAREERS</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-1.5 bg-[#cd2129]" />
                  <span>FREE PRESS-READY PDF</span>
                </div>
              </div>

              {/* Instant Actions */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href={`/editions/${featuredIssue.slug}`}
                  className="inline-flex h-11 items-center gap-2 bg-[#cd2129] px-6 font-bold text-xs uppercase tracking-wider text-white hover:bg-[#b01b22] transition-colors"
                >
                  READ ISSUE ONLINE <ArrowRight className="size-4" />
                </Link>

                <a
                  href={featuredIssue.pdf_url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center gap-2 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-5 font-bold text-xs uppercase tracking-wider text-neutral-900 dark:text-white hover:border-[#cd2129] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <Download className="size-4 text-[#cd2129]" /> DOWNLOAD PDF ({featuredIssue.total_pages} PAGES)
                </a>

                <a
                  href={whatsappLink("Hello Vaaram Magazine, I would like to book a spot in the upcoming Sunday issue.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center gap-2 border border-[#25D366] bg-[#25D366]/10 px-4 font-bold text-xs uppercase tracking-wider text-[#1e8343] dark:text-[#25D366] hover:bg-[#25D366] hover:text-white dark:hover:text-black transition-colors"
                >
                  <MessageCircle className="size-3.5" />
                  PLACE AD IN NEXT ISSUE
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
