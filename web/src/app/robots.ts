import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://beanmap.pl";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/dashboard/", "/sign-in/", "/sign-up/", "/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
