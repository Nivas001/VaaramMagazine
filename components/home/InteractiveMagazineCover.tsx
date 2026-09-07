"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Download, Eye, Sparkles, X } from "lucide-react";
import type { Publication } from "@/lib/types";
import { DownloadButton } from "@/components/site/DownloadButton";
import { editionLabel } from "@/lib/utils";

interface InteractiveCoverProps {
  publication: Publication;
}

export function InteractiveMagazineCover({ publication }: InteractiveCoverProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glareX, setGlareX] = useState(50);
  const [glareY, setGlareY] = useState(50);
  const [glareOpacity, setGlareOpacity] = useState(0);
  const [peekOpen, setPeekOpen] = useState(false);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rX = ((y - centerY) / centerY) * -12;
    const rY = ((x - centerX) / centerX) * 12;

    setRotateX(rX);
    setRotateY(rY);

    setGlareX((x / rect.width) * 100);
    setGlareY((y / rect.height) * 100);
    setGlareOpacity(0.35);
  }

  function handleMouseLeave() {
    setRotateX(0);
    setRotateY(0);
    setGlareOpacity(0);
  }

  return (
    <>
      <div className="relative mx-auto w-full max-w-sm perspective-1000">
        {/* 3D Tilt Container */}
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1, 1, 1)`,
            transition: rotateX === 0 && rotateY === 0 ? "transform 0.5s ease-out" : "none",
          }}
          className="group relative cursor-pointer border-2 border-neutral-800 bg-[#090909] shadow-2xl transition-shadow duration-300 hover:border-[#cd2129] hover:shadow-[0_25px_60px_-15px_rgba(205,33,41,0.3)]"
          onClick={() => setPeekOpen(true)}
        >
          {/* Cover Image */}
          <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-950">
            {publication.cover_url ? (
              <img
                src={publication.cover_url}
                alt={publication.title}
                className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
            ) : (
              <div className="flex size-full flex-col items-center justify-center p-8 text-center text-neutral-400">
                <BookOpen className="size-16 stroke-[1.2] text-[#cd2129]" />
                <span className="mt-4 font-display text-2xl uppercase tracking-wider text-white">
                  {publication.title}
                </span>
              </div>
            )}

            {/* Realistic Glare Overlay */}
            <div
              className="pointer-events-none absolute inset-0 transition-opacity duration-200"
              style={{
                opacity: glareOpacity,
                background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 65%)`,
              }}
            />

            {/* Corner Badge */}
            <div className="absolute left-0 top-0 bg-[#cd2129] px-3 py-1 font-display text-xs tracking-widest text-white uppercase">
              NEW RELEASE
            </div>

            {/* Floating Hover Indicator */}
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/85 px-3 py-1.5 font-display text-xs tracking-wider text-white uppercase backdrop-blur-sm border border-neutral-700 group-hover:border-[#cd2129]">
              <Eye className="size-3.5 text-[#cd2129]" />
              QUICK PEEK
            </div>
          </div>

          {/* Quick Meta Footer */}
          <div className="border-t border-neutral-800 bg-[#0c0c0c] p-4 text-left">
            <div className="flex items-center justify-between">
              <span className="font-display text-xs tracking-widest text-[#d2ac47] uppercase">
                {editionLabel(publication.edition_date)}
              </span>
              <span className="font-sans text-[10px] font-bold tracking-widest text-neutral-400 uppercase">
                {publication.total_pages} PAGES • PDF
              </span>
            </div>
            <h3 className="mt-1 truncate font-display text-lg tracking-wider text-white uppercase group-hover:text-[#cd2129] transition-colors">
              {publication.title}
            </h3>
          </div>
        </div>

        {/* 3D Reflection base */}
        <div className="mx-auto mt-2 h-3 w-4/5 rounded-full bg-[#cd2129]/20 blur-md" />
      </div>

      {/* ── Interactive "Quick Peek" Modal ─────────────────────────────── */}
      {peekOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-2xl border border-neutral-800 bg-[#0c0c0c] p-6 sm:p-8 shadow-2xl">
            {/* Close Button */}
            <button
              onClick={() => setPeekOpen(false)}
              className="absolute right-4 top-4 grid size-9 place-items-center border border-neutral-800 bg-neutral-900 text-white hover:border-[#cd2129] hover:text-[#cd2129] transition-colors cursor-pointer"
              aria-label="Close preview"
            >
              <X className="size-4" />
            </button>

            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              {/* Thumbnail */}
              <div className="w-40 shrink-0 border border-neutral-800 bg-neutral-950 aspect-[3/4]">
                {publication.cover_url && (
                  <img
                    src={publication.cover_url}
                    alt={publication.title}
                    className="size-full object-cover"
                  />
                )}
              </div>

              {/* Contents & Actions */}
              <div className="flex flex-1 flex-col">
                <div className="flex items-center gap-2 font-display text-xs uppercase tracking-widest text-[#d2ac47]">
                  <Sparkles className="size-3.5 text-[#cd2129]" />
                  THIS WEEK&apos;S EDITION SPOTLIGHT
                </div>

                <h2 className="mt-2 font-display text-2xl uppercase tracking-wider text-white sm:text-3xl">
                  {publication.title}
                </h2>

                <p className="mt-3 font-sans text-sm leading-relaxed text-neutral-400">
                  {publication.description}
                </p>

                {/* Highlights */}
                <div className="mt-4 grid grid-cols-2 gap-2 border-y border-neutral-800 py-3 font-sans text-xs">
                  <div>
                    <span className="font-bold uppercase text-white">DATE: </span>
                    <span className="text-neutral-400">{editionLabel(publication.edition_date)}</span>
                  </div>
                  <div>
                    <span className="font-bold uppercase text-white">FORMAT: </span>
                    <span className="text-neutral-400">Print PDF & Web</span>
                  </div>
                  <div>
                    <span className="font-bold uppercase text-white">PAGES: </span>
                    <span className="text-neutral-400">{publication.total_pages} Pages</span>
                  </div>
                  <div>
                    <span className="font-bold uppercase text-white">ACCESS: </span>
                    <span className="text-[#cd2129] font-bold">100% Free</span>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link
                    href={`/editions/${publication.slug}`}
                    onClick={() => setPeekOpen(false)}
                    className="inline-flex h-11 items-center gap-2 bg-[#cd2129] px-6 font-bold text-xs uppercase tracking-wider text-white hover:bg-[#b01b22] transition-colors"
                  >
                    READ ONLINE <ArrowRight className="size-4" />
                  </Link>
                  <DownloadButton
                    url={publication.pdf_url}
                    publicationId={publication.id}
                    label="DOWNLOAD PDF"
                    className="h-11 border border-neutral-700 bg-neutral-900 px-5 font-bold text-xs uppercase tracking-wider text-white hover:border-neutral-500 hover:bg-neutral-800 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
