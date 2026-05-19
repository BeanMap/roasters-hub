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
  const title = `${t("registerCafe")} | Bean Map`;
  const description = "List your specialty coffee cafe on Bean Map. Connect with roasters and coffee enthusiasts.";
  return {
    title,
    description,
    keywords: seoKeywords("registerCafe"),
    alternates: buildAlternates(locale, "/register/cafe"),
    openGraph: buildOpenGraph(title, description),
  };
}

export default function RegisterCafeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
