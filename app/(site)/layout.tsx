import { Aurora } from "@/components/ui/Aurora";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { siteConfig } from "@/site.config";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  // Structured data helps Google show the publication as a rich result.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    name: siteConfig.legalName,
    alternateName: siteConfig.name,
    url: siteConfig.url,
    slogan: siteConfig.tagline,
    foundingDate: siteConfig.since,
    email: siteConfig.contact.email,
    telephone: siteConfig.contact.phone,
    address: { "@type": "PostalAddress", streetAddress: siteConfig.contact.address },
    areaServed: siteConfig.editions.map((e) => e.name),
  };

  return (
    <>
      <Aurora />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main className="relative pt-24 sm:pt-28">{children}</main>
      <Footer />
    </>
  );
}
