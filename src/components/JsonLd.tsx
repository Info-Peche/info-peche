import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const JsonLd = () => {
  const [avgRating, setAvgRating] = useState(4.8);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("rating")
        .eq("is_approved", true);

      if (!error && data && data.length > 0) {
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
        setAvgRating(Math.round(avg * 10) / 10);
        setReviewCount(data.length);
      }
    };
    fetchStats();
  }, []);

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Info Pêche",
    url: window.location.origin,
    logo: `${window.location.origin}/favicon.ico`,
    description: "Le magazine de référence de la pêche au coup depuis plus de 25 ans.",
    sameAs: [],
    aggregateRating: reviewCount > 0 ? {
      "@type": "AggregateRating",
      ratingValue: avgRating.toString(),
      bestRating: "5",
      worstRating: "1",
      ratingCount: reviewCount.toString(),
    } : undefined,
  };

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Info Pêche Magazine — Abonnement",
    description: "Abonnement au magazine Info Pêche, la référence de la pêche au coup. 11 numéros par an en version papier ou numérique.",
    brand: {
      "@type": "Brand",
      name: "Info Pêche",
    },
    offers: [
      {
        "@type": "Offer",
        name: "Abonnement Numérique",
        price: "33.00",
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        url: `${window.location.origin}/#abonnements`,
      },
      {
        "@type": "Offer",
        name: "Abonnement Papier + Numérique",
        price: "55.00",
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        url: `${window.location.origin}/#abonnements`,
      },
    ],
    aggregateRating: reviewCount > 0 ? {
      "@type": "AggregateRating",
      ratingValue: avgRating.toString(),
      bestRating: "5",
      worstRating: "1",
      reviewCount: reviewCount.toString(),
    } : undefined,
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Info Pêche",
    url: window.location.origin,
    potentialAction: {
      "@type": "SearchAction",
      target: `${window.location.origin}/blog?q={search_term_string}`,
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
