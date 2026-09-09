import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { siteConfig } from "@/site.config";
import { ThemeProvider } from "@/components/site/ThemeProvider";
import "./globals.css";

/**
 * Bricolage Grotesque carries every headline — a heavy, tight-tracked
 * grotesque with real character, replacing the earlier editorial serif.
 * It's a single variable file (weights 400–800), so one <link> buys the
 * whole range from a light kicker to the boldest hero line.
 */
const bricolage = localFont({
  src: "../public/fonts/bricolage.woff2",
  weight: "400 800",
  variable: "--font-bricolage",
  display: "swap",
  fallback: ["Helvetica Neue", "Arial", "sans-serif"],
});

/** Plus Jakarta Sans handles the interface and all body copy. */
const jakarta = localFont({
  src: "../public/fonts/jakarta.woff2",
  weight: "400 800",
  variable: "--font-jakarta",
  display: "swap",
  fallback: ["Helvetica Neue", "Arial", "sans-serif"],
});

/** Loaded only for the Tamil wordmark "வாரம்". */
const tamil = localFont({
  src: "../public/fonts/tamil.woff2",
  weight: "400 700",
  variable: "--font-tamil",
  display: "swap",
  fallback: ["Arial", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "Vaaram Magazine",
    "Vaaram",
    "weekly advertising magazine",
    "classifieds Canada",
    "local business directory Toronto",
    "advertise locally",
    "weekly edition PDF",
  ],
  authors: [{ name: siteConfig.legalName }],
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f4" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0b0d" },
  ],
};

/**
 * Applied before first paint so a visitor who chose dark never sees a flash of
 * the light theme. Kept deliberately tiny and dependency-free.
 */
const themeScript = `
try {
  var stored = localStorage.getItem('vaaram-theme');
  var dark = stored === 'dark' || (!stored && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
} catch (e) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-CA"
      suppressHydrationWarning
      className={`${bricolage.variable} ${jakarta.variable} ${tamil.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-[rgb(var(--accent))] focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
