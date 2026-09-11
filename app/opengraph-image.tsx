import { ImageResponse } from "next/og";
import { siteConfig } from "@/site.config";

export const runtime = "nodejs";
export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The card that appears when someone shares vaaram.ca in a message or a post.
 *
 * Drawn from the brand tokens rather than a checked-in JPEG, so it can never
 * drift out of date with the site — and it is laid out with plain boxes
 * because Satori (which renders this) supports a deliberately small subset of
 * CSS: no custom fonts here, no gradients beyond linear, no SVG filters.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          backgroundColor: "#150d11",
          backgroundImage:
            "linear-gradient(135deg, rgba(138,19,50,0.55) 0%, rgba(21,13,17,0) 58%)",
          color: "#faf8f4",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: 16,
              backgroundColor: "#e0b29b",
              display: "flex",
            }}
          />
          <div
            style={{
              fontSize: 24,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "#e0b29b",
              display: "flex",
            }}
          >
            {siteConfig.name}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 108, lineHeight: 1.02, letterSpacing: -3, display: "flex" }}>
            Discover. Connect.
          </div>
          <div
            style={{
              fontSize: 108,
              lineHeight: 1.02,
              letterSpacing: -3,
              color: "#e0b29b",
              display: "flex",
            }}
          >
            Every week.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            borderTop: "1px solid rgba(255,255,255,0.16)",
            paddingTop: 28,
          }}
        >
          <div
            style={{
              fontSize: 26,
              maxWidth: 700,
              lineHeight: 1.45,
              color: "#c4b8b2",
              display: "flex",
            }}
          >
            A weekly advertising and classifieds magazine. One new edition every week —
            free to read.
          </div>
          <div style={{ fontSize: 24, color: "#e0b29b", display: "flex" }}>
            {siteConfig.url.replace(/^https?:\/\//, "")}
          </div>
        </div>
      </div>
    ),
    size
  );
}
