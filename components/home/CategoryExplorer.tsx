"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Briefcase, Building, Film, Home, Mail, MessageCircle, Users, Wrench } from "lucide-react";
import { siteConfig, whatsappLink } from "@/site.config";
import { cn } from "@/lib/utils";

const PILLARS = [
  {
    id: "community",
    name: "COMMUNITY & NEWS",
    Icon: Users,
    count: "140+ Listings",
    badge: "WEEKLY PULSE",
    headline: "Connecting Diaspora Voices Across Canada & Beyond",
    description: "From cultural galas to volunteer initiatives and milestone announcements, Vaaram is the community's primary record.",
    features: ["Community announcements", "Obituaries & memorials", "Cultural festivals & events", "Public notices & tenders"],
  },
  {
    id: "realestate",
    name: "REAL ESTATE & HOUSING",
    Icon: Home,
    count: "320+ Properties",
    badge: "HIGH DEMAND",
    headline: "Commercial, Residential, Condos & Rentals",
    description: "Verified direct owner and broker listings covering the Greater Toronto Area, Ontario, and international investment corridors.",
    features: ["Homes for sale & rent", "Commercial storefronts", "Pre-construction releases", "Room & apartment sublets"],
  },
  {
    id: "careers",
    name: "CAREERS & EMPLOYMENT",
    Icon: Briefcase,
    count: "180+ Openings",
    badge: "HIRING NOW",
    headline: "Fast-Track Opportunities for Trade & Skilled Professionals",
    description: "Connect directly with hiring managers in logistics, healthcare, tech, construction, retail, and professional services.",
    features: ["Tech & office positions", "Trades & skilled labour", "Healthcare & caregiving", "Retail & hospitality shifts"],
  },
  {
    id: "business",
    name: "BUSINESS & TRADE",
    Icon: Building,
    count: "210+ Directory Ads",
    badge: "VERIFIED TRADE",
    headline: "Wholesale, Import-Export, Financial & Legal Services",
    description: "The trusted marketplace where business leaders advertise equipment, B2B services, franchises, and trade partnerships.",
    features: ["Accounting & tax advisors", "Legal & immigration counsel", "Wholesale & food distributors", "Business sales & partnerships"],
  },
  {
    id: "culture",
    name: "ARTS, CINEMA & HERITAGE",
    Icon: Film,
    count: "95+ Features",
    badge: "EDITORIAL FOCUS",
    headline: "Exclusive Film Interviews, Music Reviews & Literary Columns",
    description: "Celebrating artists, musicians, filmmakers, and creators shaping the cultural Renaissance in Canada and internationally.",
    features: ["South Asian cinema previews", "Concert & tour schedules", "Book launches & poetry", "Heritage & youth spotlights"],
  },
  {
    id: "services",
    name: "SERVICES & AUTOMOTIVE",
    Icon: Wrench,
    count: "160+ Providers",
    badge: "ESSENTIAL SERVICES",
    headline: "Reliable Contractors, Auto Sales & Everyday Solutions",
    description: "Quick access to verified electricians, plumbers, automotive repair, driving schools, and home renovation experts.",
    features: ["Vehicle sales & leasing", "Home renovation & plumbing", "Catering & event decor", "Driving instructors & tutors"],
  },
];

export function CategoryExplorer() {
  const [activeId, setActiveId] = useState(PILLARS[0].id);
  const current = PILLARS.find((p) => p.id === activeId) || PILLARS[0];
  const CurrentIcon = current.Icon;

  return (
    <div className="w-full">
      {/* Category Tab Bar */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {PILLARS.map((pillar) => {
          const isSelected = pillar.id === activeId;
          const Icon = pillar.Icon;
          return (
            <button
              key={pillar.id}
              onClick={() => setActiveId(pillar.id)}
              className={cn(
                "flex flex-col items-center justify-center p-3 text-center transition-all cursor-pointer border",
                isSelected
                  ? "border-[#cd2129] bg-[#cd2129] text-white shadow-lg"
                  : "border-neutral-800 bg-[#0c0c0c] text-neutral-400 hover:border-neutral-700 hover:text-white"
              )}
            >
              <Icon className={cn("size-5 mb-1.5", isSelected ? "text-white" : "text-[#cd2129]")} />
              <span className="font-display text-[11px] uppercase tracking-wider line-clamp-1">
                {pillar.name}
              </span>
              <span className={cn("mt-1 font-sans text-[9px] font-bold tracking-widest", isSelected ? "text-white/80" : "text-[#d2ac47]")}>
                {pillar.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Showcase Box */}
      <div className="mt-6 border border-neutral-800 bg-[#090909] p-6 sm:p-10 transition-all">
        <div className="grid items-center gap-8 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center bg-[#cd2129] px-2.5 py-0.5 font-display text-[11px] font-normal uppercase tracking-wider text-white">
                {current.badge}
              </span>
              <span className="font-display text-xs uppercase tracking-widest text-[#d2ac47]">
                {current.count}
              </span>
            </div>

            <h3 className="mt-4 font-display text-2xl uppercase tracking-wide text-white sm:text-4xl">
              {current.headline}
            </h3>

            <p className="mt-3 font-sans text-sm leading-relaxed text-neutral-400 sm:text-base">
              {current.description}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/editions"
                className="inline-flex h-11 items-center gap-2 bg-[#cd2129] px-6 font-bold text-xs uppercase tracking-wider text-white hover:bg-[#b01b22] transition-colors"
              >
                BROWSE IN ISSUE <ArrowRight className="size-4" />
              </Link>
              <a
                href={whatsappLink(`Hello Vaaram Magazine, I would like to place an ad or announcement in the ${current.name} category.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2 border border-[#25D366]/50 bg-[#25D366]/10 px-5 font-bold text-xs uppercase tracking-wider text-[#25D366] hover:bg-[#25D366] hover:text-black transition-colors"
              >
                <MessageCircle className="size-4" /> BOOK IN THIS SECTION (WHATSAPP)
              </a>
              <a
                href={`mailto:${siteConfig.contact.email}?subject=${encodeURIComponent(`Ad Inquiry: ${current.name}`)}`}
                className="inline-flex h-11 items-center gap-2 border border-neutral-700 bg-neutral-900 px-4 font-bold text-xs uppercase tracking-wider text-white hover:border-neutral-500 hover:bg-neutral-800 transition-colors"
              >
                <Mail className="size-3.5 text-[#cd2129]" /> EMAIL
              </a>
            </div>
          </div>

          {/* Feature List */}
          <div className="border border-neutral-800 bg-[#0f0f0f] p-6">
            <div className="flex items-center gap-2 border-b border-neutral-800 pb-3 font-display text-xs uppercase tracking-widest text-[#d2ac47]">
              <CurrentIcon className="size-4 text-[#cd2129]" />
              KEY HIGHLIGHTS IN THIS PILLAR
            </div>
            <ul className="mt-4 space-y-3 font-sans text-xs font-bold uppercase tracking-wider text-neutral-300">
              {current.features.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <span className="size-1.5 bg-[#cd2129] shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
