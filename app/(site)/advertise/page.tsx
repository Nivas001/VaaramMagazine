import type { Metadata } from "next";
import { Check, Mail, MessageCircle } from "lucide-react";
import { siteConfig, whatsappLink } from "@/site.config";
import { DirectContactHub } from "@/components/site/DirectContactHub";
import { Eyebrow, Section, SectionHeading } from "@/components/ui/Bento";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { AdSlot } from "@/components/ads/AdSlot";

export const metadata: Metadata = {
  title: "Advertise With Us — Instant WhatsApp & Email Booking",
  description: `Book a classified or display ad in ${siteConfig.name}. Instant direct booking via WhatsApp and Email. Dual reach in weekly print-ready PDF and digital broadsheet.`,
  alternates: { canonical: "/advertise" },
};

const packages = [
  {
    name: "Classified Column Ad",
    tag: "MOST POPULAR",
    body: "Formatted text listing placed in the appropriate classified section. Ideal for recruitment, real estate, trade services, and announcements.",
    whatsappMsg: "Hello Vaaram Magazine, I would like to book a Classified Column Ad for the upcoming Sunday edition.",
    emailSubject: "Classified Column Ad Booking — Vaaram Magazine",
    points: [
      "Appears in the weekly print-ready PDF",
      "Included in digital issue archive",
      "Typeset into correct directory column",
      "Editorial proofreading included",
    ],
  },
  {
    name: "Display Box Ad",
    tag: "HIGH VISIBILITY",
    body: "Custom-designed bordered ad block featuring your organization logo, product photography, and brand typography.",
    whatsappMsg: "Hello Vaaram Magazine, I would like to book a Display Box Ad for the upcoming Sunday edition. Please share sizes and rates.",
    emailSubject: "Display Box Ad Booking — Vaaram Magazine",
    points: [
      "Designed and prepared by production team",
      "Guaranteed page placement options",
      "High-resolution vector PDF proof sent prior to publication",
      "Multi-issue run discounts available",
    ],
  },
  {
    name: "Digital Web Banner",
    tag: "CONTINUOUS REACH",
    body: "Prominently positioned digital billboard shown to all visitors downloading or reading issues throughout the week.",
    whatsappMsg: "Hello Vaaram Magazine, I would like to place a Digital Web Banner on www.vaaram.ca. Please share slot availability.",
    emailSubject: "Digital Web Banner Booking — www.vaaram.ca",
    points: [
      "Placed across high-traffic issue pages",
      "Direct inbound hyperlink to your website",
      "Impression and click counters provided",
      "Available individually or bundled with print",
    ],
  },
];

export default function AdvertisePage() {
  return (
    <>
      <Section className="!pb-8">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <Eyebrow>ADVERTISING &amp; SPONSORSHIPS</Eyebrow>
            <h1 className="mt-5 font-display text-4xl sm:text-6xl md:text-7xl uppercase tracking-wide text-neutral-900 dark:text-white">
              REACH A WIDER AUDIENCE <span className="text-[#cd2129]">WITH DIRECT IMPACT</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl font-sans text-base leading-relaxed text-neutral-600 dark:text-neutral-400 sm:text-lg">
              One booking places your business in the weekly PDF downloaded by thousands of readers
              and featured directly on this site. Zero forms to fill — chat directly with our desk on WhatsApp or Email.
            </p>
          </div>
        </Reveal>
      </Section>

      {/* Pricing & Ad Packages */}
      <Section className="!pt-0">
        <RevealGroup className="grid gap-6 lg:grid-cols-3">
          {packages.map(({ name, tag, body, points, whatsappMsg, emailSubject }) => (
            <RevealItem key={name} className="h-full">
              <div className="flex h-full flex-col border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] p-7 sm:p-8 shadow-xs hover:border-[#cd2129] hover:shadow-md transition-all">
                <div className="flex items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-4">
                  <span className="font-display text-xs uppercase tracking-widest text-[#b89028] dark:text-[#d2ac47] font-bold">
                    {tag}
                  </span>
                  <span className="inline-flex items-center bg-[#cd2129] px-2.5 py-0.5 font-display text-xs font-normal uppercase tracking-wider text-white">
                    WEEKLY RUN
                  </span>
                </div>

                <h2 className="mt-5 font-display text-2xl uppercase tracking-wider text-neutral-900 dark:text-white">
                  {name}
                </h2>
                <p className="mt-2.5 font-sans text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                  {body}
                </p>

                <ul className="mt-6 flex-1 space-y-3 font-sans text-sm text-neutral-700 dark:text-neutral-300">
                  {points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 size-4 shrink-0 text-[#cd2129]" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>

                {/* Direct Action Buttons - No Forms */}
                <div className="mt-8 flex flex-col gap-2.5 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  <a
                    href={whatsappLink(whatsappMsg)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 items-center justify-center gap-2 bg-[#25D366] font-display text-xs uppercase tracking-wider text-black font-bold hover:bg-[#20ba59] transition-colors"
                  >
                    <MessageCircle className="size-4" /> BOOK ON WHATSAPP
                  </a>
                  <a
                    href={`mailto:${siteConfig.contact.email}?subject=${encodeURIComponent(emailSubject)}`}
                    className="inline-flex h-11 items-center justify-center gap-2 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-display text-xs uppercase tracking-wider text-neutral-800 dark:text-white font-bold hover:border-[#cd2129] hover:text-[#cd2129] transition-colors"
                  >
                    <Mail className="size-4 text-[#cd2129]" /> EMAIL INQUIRY
                  </a>
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <AdSlot placement="home_mid" />
      </div>

      {/* Categories */}
      <Section>
        <Reveal>
          <SectionHeading
            eyebrow="DIRECTORY SECTIONS"
            title={<>REGULAR CATEGORIES IN <span className="text-[#cd2129]">EVERY EDITION</span></>}
            lead="Organized, indexed classified sections that readers browse weekly."
          />
        </Reveal>
        <RevealGroup className="mt-8 flex flex-wrap justify-center gap-2.5" stagger={0.03}>
          {siteConfig.categories.map((category) => (
            <RevealItem key={category}>
              <a
                href={whatsappLink(`Hello Vaaram Magazine, I would like to place an ad in the ${category} category.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121212] px-4 py-2 font-display text-xs uppercase tracking-widest text-neutral-700 dark:text-neutral-300 hover:border-[#cd2129] hover:text-[#cd2129] shadow-2xs transition-colors"
              >
                <span className="size-1.5 bg-[#cd2129] group-hover:scale-125 transition-transform" />
                {category}
              </a>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      {/* Direct Booking Desk (Zero Forms) */}
      <Section id="enquiry" className="scroll-mt-28 !pt-0">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="mb-8 text-center">
              <Eyebrow>DIRECT BOOKING DESK</Eyebrow>
              <h2 className="mt-3 font-display text-3xl sm:text-5xl uppercase tracking-wide text-neutral-900 dark:text-white">
                START YOUR BOOKING <span className="text-[#cd2129]">INSTANTLY</span>
              </h2>
              <p className="mx-auto mt-2 max-w-xl font-sans text-sm text-neutral-600 dark:text-neutral-400">
                Skip lengthy registration forms. Send us your requirements directly on WhatsApp or Email for instant confirmation.
              </p>
            </div>

            <DirectContactHub variant="advertise" />
          </Reveal>
        </div>
      </Section>
    </>
  );
}
