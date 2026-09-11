"use client";

import { useEffect, useRef } from "react";
import { AD_FORMATS, bannerArtwork, type AdBanner, type AdFormat } from "@/lib/types";
import { observeAd, trackClick } from "@/lib/ad-impressions";
import { cn, safeExternalUrl } from "@/lib/utils";

/**
 * One advertisement.
 *
 * This is the atom every rail and grid is built from. It holds a fixed
 * proportion for its format — the same proportion at every screen size, which
 * is the whole reason an advertiser supplies one image rather than three: only
 * the column around it changes width.
 *
 * Motion is a CSS hover and nothing else. A rail can hold twenty of these, and
 * a staggered entrance across twenty cards would both cost twenty scroll
 * subscriptions on a phone and read, to an advertiser checking their own
 * booking, as an advertisement that failed to load.
 */
export function AdCard({
  banner,
  format = "card",
  className,
}: {
  banner: AdBanner;
  format?: AdFormat;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const spec = AD_FORMATS[format];
  // Filtered again here: rows written before the write-side check exist.
  const href = safeExternalUrl(banner.target_url);
  const art = bannerArtwork(banner);

  useEffect(() => observeAd(ref.current, banner.id), [banner.id]);

  const image = (
    // Uploaded by advertisers and served straight from object storage, so
    // Next's optimiser is bypassed site-wide and <picture> is the right tool.
    // Where one image was supplied every source resolves to it, and this
    // behaves as a plain <img>.
    <picture className="block size-full">
      <source media="(min-width: 1024px)" srcSet={art.desktop} />
      <source media="(min-width: 640px)" srcSet={art.tablet} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={art.mobile}
        alt={`Advertisement by ${banner.client_name}`}
        width={spec.width}
        height={spec.height}
        loading="lazy"
        decoding="async"
        // `contain`, not `cover`: an advertiser paid for this artwork, and
        // cropping a phone number off the edge of it is a worse failure than
        // showing a band of background beside a wrongly-sized image.
        className="size-full object-contain"
      />
    </picture>
  );

  return (
    <div
      ref={ref}
      data-ad-card
      data-ad-id={banner.id}
      className={cn(
        "relative overflow-hidden rounded-lg border border-[rgb(var(--hairline))] bg-[rgb(var(--surface-2))]",
        "transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-md",
        spec.className,
        className
      )}
    >
      {href ? (
        <a
          href={href}
          target="_blank"
          // `sponsored` tells search engines this is a paid link.
          rel="noopener noreferrer sponsored"
          onClick={() => trackClick(banner.id)}
          className="block size-full"
        >
          {image}
        </a>
      ) : (
        image
      )}
    </div>
  );
}
