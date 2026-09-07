import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { siteConfig } from "@/site.config";
import { ThemeProvider } from "@/components/site/ThemeProvider";
import "./globals.css";

const bayon = localFont({
  src: "../public/fonts/bayon.woff2",
  weight: "400",
  variable: "--font-display",
  display: "swap",
  fallback: ["Impact", "Arial Black", "sans-serif"],
});

const assistant = localFont({
  src: "../public/fonts/assistant.woff2",
  weight: "400 700",
  variable: "--font-sans",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
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
    "vaaram.ca",
    "weekly magazine",
    "community broadsheet",
    "weekly ads paper",
    "Canada weekly magazine",
    "Toronto classifieds",
    "download magazine pdf",
    "free digital magazine",
    ...siteConfig.editions.map((e) => `${e.name} edition`),
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
  themeColor: "#cd2129",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${bayon.variable} ${assistant.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const t = localStorage.getItem('vaaram-theme');
                if (t === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="bg-white dark:bg-black text-neutral-900 dark:text-white min-h-dvh antialiased selection:bg-[#cd2129] selection:text-white">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
