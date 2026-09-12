"use client";

import { useEffect, useState } from "react";
import { Phone, Mail, ExternalLink } from "lucide-react";
import type { PageLink, PageTextItem, PdfBook, Rect } from "@/lib/pdf-book";
import { cn } from "@/lib/utils";

/**
 * One printed page, with everything layered on top of it.
 *
 * Four layers, back to front:
 *
 *  1. the rasterised page itself;
 *  2. a **text layer** — invisible, positioned type that makes the page
 *     selectable and copyable, so a reader can lift a phone number out of an
 *     advertisement instead of writing it down;
 *  3. **search highlights**, when a search is running;
 *  4. a **link layer** — the links the PDF declares, plus the phone numbers,
 *     e-mail addresses and web addresses found in the text. In a classifieds
 *     magazine that is the point of the whole publication: every number in it
 *     is something someone wants to call.
 *
 * The image is fetched at a width matched to how large the page is actually
 * being shown. Whatever raster is already in memory is painted at once so the
 * sheet is never blank, and the sharper one replaces it when it arrives.
 */

let measurer: CanvasRenderingContext2D | null = null;

/**
 * How wide a run of text naturally renders, used to squeeze the invisible
 * type back onto the glyphs actually printed on the page. The page's own
 * embedded fonts are not available to us, so every run gets scaled to fit the
 * box pdf.js measured for it — the same trick the pdf.js viewer uses.
 */
function naturalWidth(text: string, fontSize: number) {
  if (!measurer) {
    const canvas = document.createElement("canvas");
    measurer = canvas.getContext("2d");
  }
  if (!measurer) return 0;
  measurer.font = `${fontSize}px sans-serif`;
  return measurer.measureText(text).width;
}

export function PageFace({
  book,
  pageNumber,
  width,
  height,
  tone,
  interactive = true,
  selectable = false,
  litLinks = false,
  highlights,
  activeHighlight,
  onNavigate,
  className,
}: {
  book: PdfBook;
  pageNumber: number;
  /** Rendered size in CSS pixels. */
  width: number;
  height: number;
  tone: "paper" | "sepia" | "night";
  /** Static pages are interactive; a sheet mid-turn is not. */
  interactive?: boolean;
  /** Turns the invisible text layer live, so the page can be selected. */
  selectable?: boolean;
  /** Outlines every link at once, for a reader hunting for a number. */
  litLinks?: boolean;
  highlights?: Rect[];
  activeHighlight?: Rect | null;
  onNavigate?: (page: number) => void;
  className?: string;
}) {
  const [src, setSrc] = useState<string | null>(() => book.peekPage(pageNumber)?.url ?? null);
  const [text, setText] = useState<PageTextItem[]>([]);
  const [links, setLinks] = useState<PageLink[]>([]);

  /* ── The page image, at the size it is actually shown ─────────────────── */
  useEffect(() => {
    let cancelled = false;
    const fallback = book.peekPage(pageNumber);
    if (fallback) setSrc(fallback.url);

    void book.getPage(pageNumber, width).then((image) => {
      if (cancelled || !image) return;
      setSrc(image.url);
    });

    return () => {
      cancelled = true;
    };
  }, [book, pageNumber, width]);

  /* ── Text and links, once the page is settled ─────────────────────────── */
  useEffect(() => {
    if (!interactive) return;
    let cancelled = false;

    // A beat behind the image: extracting text must never delay the paint the
    // reader is waiting on.
    const id = window.setTimeout(() => {
      void book.getText(pageNumber).then((items) => !cancelled && setText(items));
      void book.getLinks(pageNumber).then((items) => !cancelled && setLinks(items));
    }, 120);

    return () => {
      cancelled = true;
      window.clearTimeout(id);
      setText([]);
      setLinks([]);
    };
  }, [book, pageNumber, interactive]);

  return (
    <div
      className={cn(
        "pdf-page",
        selectable && "pdf-page-selectable",
        litLinks && "pdf-page-links-lit",
        className
      )}
      style={{ width, height }}
      data-tone={tone}
      data-page={pageNumber}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`Page ${pageNumber}`}
          className="pdf-page-img"
          draggable={false}
          decoding="async"
        />
      ) : (
        <div className="pdf-page-blank" aria-hidden />
      )}

      {/* The page's own tint. Applied over the raster rather than as a filter
          on it, so switching to night reading costs nothing to re-render. */}
      {tone !== "paper" && <div className="pdf-page-tone" aria-hidden />}

      {interactive && text.length > 0 && (
        <div className="pdf-text-layer" aria-hidden={false}>
          {text.map((item, i) => {
            const fontSize = item.rect.h * height;
            if (fontSize < 4) return null;
            const target = item.rect.w * width;
            const natural = naturalWidth(item.text, fontSize);
            return (
              <span
                key={i}
                style={{
                  left: `${item.rect.x * 100}%`,
                  top: `${item.rect.y * 100}%`,
                  fontSize: `${fontSize}px`,
                  transform: natural > 0 ? `scaleX(${target / natural})` : undefined,
                }}
              >
                {item.text}
              </span>
            );
          })}
        </div>
      )}

      {highlights?.map((rect, i) => (
        <span
          key={`hl-${i}`}
          aria-hidden
          className={cn(
            "pdf-highlight",
            activeHighlight &&
              rect.x === activeHighlight.x &&
              rect.y === activeHighlight.y &&
              "pdf-highlight-active"
          )}
          style={{
            left: `${rect.x * 100}%`,
            top: `${rect.y * 100}%`,
            width: `${rect.w * 100}%`,
            height: `${rect.h * 100}%`,
          }}
        />
      ))}

      {interactive &&
        links.map((link, i) => {
          const Icon = link.kind === "tel" ? Phone : link.kind === "mail" ? Mail : ExternalLink;
          const label =
            link.kind === "tel"
              ? `Call ${link.href.replace("tel:", "")}`
              : link.kind === "mail"
                ? `Email ${link.href.replace("mailto:", "")}`
                : `Open ${link.href}`;

          if (link.kind === "page") {
            return (
              <button
                key={`ln-${i}`}
                type="button"
                className="pdf-link"
                style={boxOf(link.rect)}
                onClick={() => onNavigate?.(Number(link.href))}
                aria-label={`Go to page ${link.href}`}
              >
                <Icon className="pdf-link-icon" aria-hidden />
              </button>
            );
          }

          return (
            <a
              key={`ln-${i}`}
              href={link.href}
              target={link.kind === "url" ? "_blank" : undefined}
              rel={link.kind === "url" ? "noopener noreferrer" : undefined}
              className="pdf-link"
              style={boxOf(link.rect)}
              aria-label={label}
              title={label}
            >
              <Icon className="pdf-link-icon" aria-hidden />
            </a>
          );
        })}
    </div>
  );
}

function boxOf(rect: Rect): React.CSSProperties {
  return {
    left: `${rect.x * 100}%`,
    top: `${rect.y * 100}%`,
    width: `${rect.w * 100}%`,
    height: `${rect.h * 100}%`,
  };
}
