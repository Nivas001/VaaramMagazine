import { Ticker } from "@/components/site/Ticker";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { siteConfig } from "@/site.config";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  /**
   * Structured data. Vaaram is described as a `Periodical`, not a
   * NewsMediaOrganization — it publishes advertising, not journalism, and
   * telling search engines otherwise would be both wrong and unhelpful.
   */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Periodical",
    name: siteConfig.name,
    alternateName: siteConfig.nativeName,
    url: siteConfig.url,
    slogan: siteConfig.tagline,
    description: siteConfig.description,
    inLanguage: "en-CA",
    publishingPrinciples: `${siteConfig.url}/about`,
    publisher: {
      "@type": "Organization",
      name: siteConfig.legalName,
      email: siteConfig.contact.email,
      telephone: siteConfig.contact.phone,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Toronto",
        addressRegion: "ON",
        addressCountry: "CA",
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Ticker />
      <Navbar />
      <main id="main" className="relative">
        {children}
      </main>
      <Footer />
    </>
  );
}
