const JsonLd = () => {

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Info Pêche",
    url: "https://www.info-peche.fr",
    logo: "https://www.info-peche.fr/images/info-peche-logo.png",
    description: "Le magazine de référence de la pêche au coup depuis plus de 25 ans.",
    sameAs: [],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      bestRating: "5",
      worstRating: "1",
      ratingCount: "2512",
    },
  };

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Info Pêche Magazine — Abonnement",
    description: "Abonnement au magazine Info Pêche, la référence de la pêche au coup. 6 numéros par an en version papier, accès numérique inclus.",
    brand: {
      "@type": "Brand",
      name: "Info Pêche",
    },
    offers: [
      {
        "@type": "Offer",
        name: "Abonnement 6 mois",
        price: "14.50",
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        url: "https://www.info-peche.fr/#abonnements",
      },
      {
        "@type": "Offer",
        name: "Abonnement 1 an",
        price: "26.50",
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        url: "https://www.info-peche.fr/#abonnements",
      },
      {
        "@type": "Offer",
        name: "Abonnement 2 ans",
        price: "48.00",
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        url: "https://www.info-peche.fr/#abonnements",
      },
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      bestRating: "5",
      worstRating: "1",
      reviewCount: "2512",
    },
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Info Pêche",
    url: "https://www.info-peche.fr",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://www.info-peche.fr/blog?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Combien coûte l'abonnement Info Pêche ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "L'abonnement numérique est à 33€/an (11 numéros) et l'abonnement papier + numérique est à 55€/an.",
        },
      },
      {
        "@type": "Question",
        name: "Puis-je consulter un numéro avant de m'abonner ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Oui, vous pouvez consulter gratuitement les 4 premières pages de chaque numéro avant de décider.",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
};

export default JsonLd;
