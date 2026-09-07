import type { Metadata } from "next";
import { Clock, MapPin, Zap } from "lucide-react";
import { siteConfig } from "@/site.config";
import { Eyebrow, Section } from "@/components/ui/Bento";
import { Reveal } from "@/components/ui/Reveal";
import { DirectContactHub } from "@/components/site/DirectContactHub";

export const metadata: Metadata = {
  title: "Contact Desk — Direct WhatsApp & Email",
  description: `Contact ${siteConfig.name} directly via WhatsApp or email. No forms. Immediate responses for classified ads, display banners, and editorial stories.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <Section className="!pb-8">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <Eyebrow>DIRECT EDITORIAL &amp; ADVERTISING DESK</Eyebrow>
            <h1 className="mt-5 font-display text-4xl sm:text-6xl md:text-7xl uppercase tracking-wide text-neutral-900 dark:text-white">
              REACH US <span className="text-[#cd2129]">DIRECTLY</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl font-sans text-base leading-relaxed text-neutral-600 dark:text-neutral-400 sm:text-lg">
              No forms, no ticket queues, and no delays. Tap WhatsApp or Email below to connect directly with our Toronto production desk.
            </p>
          </div>
        </Reveal>
      </Section>

      <Section className="!pt-0">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <DirectContactHub variant="contact" />
          </Reveal>

          {/* Guidelines & Publishing Deadlines */}
          <Reveal className="mt-12">
            <div className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#0c0c0c] p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-2 font-display text-xs uppercase tracking-widest text-[#b89028] dark:text-[#d2ac47] border-b border-neutral-200 dark:border-neutral-800 pb-3">
                <Zap className="size-4 text-[#cd2129]" />
                PUBLICATION DESK PROTOCOLS &amp; DEADLINES
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121212] p-5 shadow-xs">
                  <span className="font-display text-[10px] tracking-widest text-[#cd2129] uppercase font-bold">
                    CLOSING DEADLINE
                  </span>
                  <h4 className="mt-1 font-display text-lg tracking-wider text-neutral-900 dark:text-white uppercase">
                    FRIDAYS AT 5:00 PM EST
                  </h4>
                  <p className="mt-2 font-sans text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                    All classifieds and display advertisements must be confirmed by Friday 5:00 PM for placement in Sunday&apos;s 6:00 AM issue.
                  </p>
                </div>

                <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121212] p-5 shadow-xs">
                  <span className="font-display text-[10px] tracking-widest text-[#b89028] dark:text-[#d2ac47] uppercase font-bold">
                    FREE TYPESETTING
                  </span>
                  <h4 className="mt-1 font-display text-lg tracking-wider text-neutral-900 dark:text-white uppercase">
                    PROOF SENT BEFORE PRESS
                  </h4>
                  <p className="mt-2 font-sans text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                    Our graphics team formats your classified or display banner and shares a digital proof on WhatsApp for your approval.
                  </p>
                </div>

                <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121212] p-5 shadow-xs">
                  <span className="font-display text-[10px] tracking-widest text-[#1e8343] dark:text-[#25D366] uppercase font-bold">
                    INSTANT DELIVERY
                  </span>
                  <h4 className="mt-1 font-display text-lg tracking-wider text-neutral-900 dark:text-white uppercase">
                    SUNDAYS 6:00 AM
                  </h4>
                  <p className="mt-2 font-sans text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                    Every issue is published worldwide at 6:00 AM EST with high-resolution digital broadsheet and print PDF downloads.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-neutral-200 dark:border-neutral-800 pt-5 text-xs text-neutral-600 dark:text-neutral-400">
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-[#cd2129]" />
                  <span>{siteConfig.contact.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-[#b89028] dark:text-[#d2ac47]" />
                  <span>{siteConfig.contact.hours}</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
