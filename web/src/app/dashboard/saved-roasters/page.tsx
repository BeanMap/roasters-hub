import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { RoasterCard } from "@/components/roasters/RoasterCard";
import { db } from "@/lib/db";
import { CARD_IMAGE } from "@/lib/card-image";

export const dynamic = "force-dynamic";

export default async function SavedRoastersPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const savedRoasters = await db.savedRoaster.findMany({
    where: { userId },
    include: {
      roaster: {
        include: { images: CARD_IMAGE },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="font-headline text-4xl tracking-tight mb-2">
            My Saved Roasters
          </h1>
          <p className="text-on-surface-variant/60 font-light">
            Roasters you&apos;ve bookmarked for easy reference.
          </p>
        </div>

        {savedRoasters.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-on-surface-variant/60 mb-4">
              You haven&apos;t saved any roasters yet.
            </p>
            <Link
              href="/roasters"
              className="inline-block bg-primary text-on-primary px-6 py-3 rounded-lg font-medium text-sm hover:bg-primary-container transition-all"
            >
              Browse Roasters
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {savedRoasters.map((sr: (typeof savedRoasters)[number]) => (
              <RoasterCard key={sr.roaster.id} roaster={sr.roaster} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
