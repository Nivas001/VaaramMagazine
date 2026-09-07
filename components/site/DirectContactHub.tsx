"use client";

import { useState } from "react";
import { ArrowUpRight, Check, Clock, Copy, Mail, MessageCircle, Phone, Send } from "lucide-react";
import { siteConfig, whatsappLink } from "@/site.config";
import { cn } from "@/lib/utils";

interface DirectContactHubProps {
  variant?: "contact" | "advertise";
  className?: string;
}

const TOPIC_PRESETS = [
  {
    id: "classified",
    label: "BOOK A CLASSIFIED AD",
    badge: "MOST POPULAR",
    message: "Hello Vaaram Magazine, I would like to book a classified ad for the upcoming Sunday issue. Please let me know the rates and closing deadline.",
    subject: "Classified Ad Booking — Vaaram Magazine",
  },
  {
    id: "display",
    label: "BOOK A DISPLAY BOX AD",
    badge: "HIGH VISIBILITY",
    message: "Hello Vaaram Magazine, I want to enquire about display ad sizes, prime page positions, and corporate rates for the upcoming edition.",
    subject: "Display Box Ad Inquiry — Vaaram Magazine",
  },
  {
    id: "banner",
    label: "DIGITAL WEB BANNER",
    badge: "CONTINUOUS REACH",
    message: "Hello Vaaram Magazine, I am interested in placing a digital billboard banner on www.vaaram.ca. Please share the impression rates and specifications.",
    subject: "Digital Web Banner Inquiry — www.vaaram.ca",
  },
  {
    id: "community",
    label: "SUBMIT COMMUNITY NOTICE / STORY",
    badge: "EDITORIAL",
    message: "Hello Vaaram Magazine, I have a community announcement / cultural event story to share with your readers for publication.",
    subject: "Community Notice Submission — Vaaram Magazine",
  },
  {
    id: "general",
    label: "GENERAL EDITORIAL INQUIRY",
    badge: "DIRECT DESK",
    message: "Hello Vaaram Magazine, I would like to get in touch with your editorial desk regarding the publication.",
    subject: "Editorial Desk Inquiry — Vaaram Magazine",
  },
];

export function DirectContactHub({ variant = "contact", className }: DirectContactHubProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  function copyToClipboard(text: string, key: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2200);
    }
  }

  const defaultWhatsappMsg =
    variant === "advertise"
      ? "Hello Vaaram Magazine, I would like to book an ad in the upcoming Sunday issue. Please share rates and available space."
      : "Hello Vaaram Magazine, I would like to speak with your editorial desk.";

  const defaultEmailSubject =
    variant === "advertise"
      ? "Ad Placement Booking — Vaaram Magazine"
      : "Editorial & General Enquiry — Vaaram Magazine";

  return (
    <div className={cn("w-full space-y-6 select-none", className)}>
      {/* ── Top Status Banner ───────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#090909] px-5 py-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#25D366] opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-[#25D366]" />
          </span>
          <span className="font-display text-xs tracking-widest text-[#1e8343] dark:text-[#25D366] uppercase">
            DESK ACTIVE NOW
          </span>
          <span className="text-neutral-400 dark:text-neutral-600 hidden sm:inline">•</span>
          <span className="font-sans text-xs text-neutral-600 dark:text-neutral-400 hidden sm:inline">
            Zero forms. Direct one-click connection to our Toronto team.
          </span>
        </div>
        <span className="font-display text-[11px] tracking-widest text-[#b89028] dark:text-[#d2ac47] uppercase font-bold">
          FAST WHATSAPP &amp; EMAIL RESPONSE
        </span>
      </div>

      {/* ── Primary Action Channels ─────────────────────────────────────── */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* 1. Direct WhatsApp Card */}
        <div className="relative flex flex-col justify-between border-2 border-[#25D366]/50 bg-white dark:bg-[#0c0c0c] p-6 sm:p-7 shadow-sm hover:border-[#25D366] transition-all">
          <div className="absolute right-4 top-4">
            <span className="inline-flex items-center gap-1.5 bg-[#25D366]/10 border border-[#25D366]/30 px-2.5 py-0.5 font-display text-[10px] tracking-wider text-[#1e8343] dark:text-[#25D366] uppercase font-bold">
              <span className="size-1.5 rounded-full bg-[#25D366]" /> FASTEST
            </span>
          </div>

          <div>
            <div className="flex items-center gap-3">
              <span className="grid size-12 place-items-center bg-[#25D366] text-black">
                <MessageCircle className="size-6" />
              </span>
              <div>
                <p className="font-display text-xs tracking-widest text-[#1e8343] dark:text-[#25D366] uppercase">
                  DIRECT MESSAGING
                </p>
                <h3 className="font-display text-2xl tracking-wider text-neutral-900 dark:text-white uppercase">
                  WHATSAPP DESK
                </h3>
              </div>
            </div>

            <p className="mt-4 font-sans text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
              Send your advertisement copy, images, questions, or draft articles directly to our production team.
            </p>

            <div className="mt-4 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#121212] px-4 py-2.5 font-mono text-sm font-bold text-neutral-800 dark:text-neutral-200">
              {siteConfig.contact.phone}
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
            <a
              href={whatsappLink(defaultWhatsappMsg)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex h-11 items-center justify-center gap-2 bg-[#25D366] font-display text-xs uppercase tracking-wider text-black font-bold hover:bg-[#20ba59] transition-colors"
            >
              CHAT ON WHATSAPP <ArrowUpRight className="size-4" />
            </a>
            <button
              onClick={() => copyToClipboard(siteConfig.contact.phone, "phone")}
              className="inline-flex h-11 items-center justify-center gap-2 border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 px-4 font-display text-xs uppercase tracking-wider text-neutral-800 dark:text-white hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors cursor-pointer"
            >
              {copiedKey === "phone" ? (
                <>
                  <Check className="size-4 text-[#25D366]" /> COPIED!
                </>
              ) : (
                <>
                  <Copy className="size-4 text-neutral-500" /> COPY NUMBER
                </>
              )}
            </button>
          </div>
        </div>

        {/* 2. Direct Email Card */}
        <div className="relative flex flex-col justify-between border-2 border-[#cd2129]/40 bg-white dark:bg-[#0c0c0c] p-6 sm:p-7 shadow-sm hover:border-[#cd2129] transition-all">
          <div className="absolute right-4 top-4">
            <span className="inline-flex items-center gap-1.5 bg-[#cd2129]/10 border border-[#cd2129]/30 px-2.5 py-0.5 font-display text-[10px] tracking-wider text-[#cd2129] uppercase font-bold">
              EDITORIAL DESK
            </span>
          </div>

          <div>
            <div className="flex items-center gap-3">
              <span className="grid size-12 place-items-center bg-[#cd2129] text-white">
                <Mail className="size-6" />
              </span>
              <div>
                <p className="font-display text-xs tracking-widest text-[#cd2129] uppercase">
                  OFFICIAL INBOX
                </p>
                <h3 className="font-display text-2xl tracking-wider text-neutral-900 dark:text-white uppercase">
                  DIRECT EMAIL
                </h3>
              </div>
            </div>

            <p className="mt-4 font-sans text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
              Ideal for submitting high-resolution PDF artwork, large press packages, display proofs, and invoices.
            </p>

            <div className="mt-4 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#121212] px-4 py-2.5 font-mono text-sm font-bold text-neutral-800 dark:text-neutral-200">
              {siteConfig.contact.email}
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
            <a
              href={`mailto:${siteConfig.contact.email}?subject=${encodeURIComponent(defaultEmailSubject)}`}
              className="flex-1 inline-flex h-11 items-center justify-center gap-2 bg-[#cd2129] font-display text-xs uppercase tracking-wider text-white font-bold hover:bg-[#b01b22] transition-colors"
            >
              COMPOSE EMAIL <Send className="size-3.5" />
            </a>
            <button
              onClick={() => copyToClipboard(siteConfig.contact.email, "email")}
              className="inline-flex h-11 items-center justify-center gap-2 border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 px-4 font-display text-xs uppercase tracking-wider text-neutral-800 dark:text-white hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors cursor-pointer"
            >
              {copiedKey === "email" ? (
                <>
                  <Check className="size-4 text-[#cd2129]" /> COPIED!
                </>
              ) : (
                <>
                  <Copy className="size-4 text-neutral-500" /> COPY EMAIL
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── 1-Click WhatsApp Presets ────────────────────────────────────── */}
      <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0a0a0a] p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-4">
          <div>
            <span className="font-display text-xs uppercase tracking-widest text-[#b89028] dark:text-[#d2ac47]">
              1-CLICK START
            </span>
            <h4 className="font-display text-lg uppercase tracking-wider text-neutral-900 dark:text-white sm:text-xl">
              CHOOSE YOUR TOPIC TO MESSAGE DIRECTLY
            </h4>
          </div>
          <span className="font-sans text-xs text-neutral-500">
            Pre-fills your inquiry on WhatsApp with zero typing required
          </span>
        </div>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {TOPIC_PRESETS.map((preset) => (
            <a
              key={preset.id}
              href={whatsappLink(preset.message)}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col justify-between border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#121212] p-4 text-left hover:border-[#cd2129] hover:bg-white dark:hover:bg-[#161616] transition-all"
            >
              <div>
                <span className="font-display text-[9px] tracking-widest text-[#b89028] dark:text-[#d2ac47] uppercase font-bold">
                  {preset.badge}
                </span>
                <p className="mt-1 font-display text-sm tracking-wider text-neutral-900 dark:text-white group-hover:text-[#cd2129] transition-colors uppercase">
                  {preset.label}
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between font-sans text-xs text-neutral-500">
                <span className="text-[#1e8343] dark:text-[#25D366] font-bold">START CHAT</span>
                <ArrowUpRight className="size-3.5 text-neutral-400 group-hover:text-[#cd2129] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* ── Direct Telephone & Office Information ───────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center justify-between border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0c] p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-[#cd2129]">
              <Phone className="size-4" />
            </span>
            <div>
              <p className="font-display text-[10px] tracking-widest text-[#b89028] dark:text-[#d2ac47] uppercase font-bold">
                TELEPHONE HOTLINE
              </p>
              <p className="font-mono text-sm font-bold text-neutral-900 dark:text-white">{siteConfig.contact.phone}</p>
            </div>
          </div>
          <a
            href={`tel:${siteConfig.contact.phone.replace(/\s/g, "")}`}
            className="inline-flex h-9 items-center gap-1.5 bg-[#cd2129] px-3 font-display text-[11px] uppercase tracking-wider text-white hover:bg-[#b01b22] transition-colors"
          >
            CALL NOW
          </a>
        </div>

        <div className="flex items-center gap-3 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0c] p-4 shadow-xs">
          <span className="grid size-10 place-items-center bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-[#b89028] dark:text-[#d2ac47]">
            <Clock className="size-4" />
          </span>
          <div>
            <p className="font-display text-[10px] tracking-widest text-[#b89028] dark:text-[#d2ac47] uppercase font-bold">
              DESK HOURS (EST)
            </p>
            <p className="font-sans text-xs text-neutral-600 dark:text-neutral-300">{siteConfig.contact.hours}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
