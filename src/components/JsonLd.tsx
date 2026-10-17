import {
  getOgImageUrl,
  getSiteUrl,
  siteDescription,
  siteName,
} from "@/lib/site";

/**
 * JSON-LD CoffeeShop: адрес и часы из ТЗ, без телефона и рейтингов.
 */
export function JsonLd() {
  const siteUrl = getSiteUrl().origin;

  const data = {
    "@context": "https://schema.org",
    "@type": "CoffeeShop",
    name: siteName,
    description: siteDescription,
    url: siteUrl,
    image: getOgImageUrl(),
    address: {
      "@type": "PostalAddress",
      streetAddress: "ул. Короля, 9",
      addressLocality: "Минск",
      addressCountry: "BY",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
        ],
        opens: "08:00",
        closes: "20:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Saturday", "Sunday"],
        opens: "10:00",
        closes: "18:00",
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
