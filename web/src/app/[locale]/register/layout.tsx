import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildAlternates, buildOpenGraph, seoKeywords } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "register" });
  const title = `${t("registerRoastery")} | Bean Map`;
  const description = "List your specialty coffee roastery on Bean Map. Reach coffee enthusiasts around the world.";
  return {
    title,
    description,
    keywords: seoKeywords("register"),
    alternates: buildAlternates(locale, "/register"),
    openGraph: buildOpenGraph(title, description),
  };
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
