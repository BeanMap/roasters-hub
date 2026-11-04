import { Suspense } from "react";
import { Header } from "@/components/shared/Header";

/** Shown instantly while a catalog or profile page streams in. */

function Bar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-surface-container ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div aria-hidden>
      <Bar className="aspect-[4/5] w-full rounded-xl" />
      <Bar className="mt-4 h-5 w-3/4" />
      <Bar className="mt-2 h-3 w-1/2" />
      <div className="mt-3 flex gap-2">
        <Bar className="h-5 w-20 rounded-full" />
        <Bar className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}

export function CatalogSkeleton() {
  return (
    <>
      <Suspense fallback={<div className="h-16" />}>
        <Header />
      </Suspense>
      <main className="max-w-7xl mx-auto w-full px-6 py-12" aria-busy="true">
        <Bar className="h-3 w-32" />
        <Bar className="mt-6 h-12 w-2/3 max-w-xl" />
        <Bar className="mt-3 h-4 w-48" />
        <div className="mt-12 flex flex-col lg:flex-row gap-16">
          <div className="hidden lg:block w-[300px] shrink-0 space-y-4">
            <Bar className="h-11 w-full" />
            <Bar className="h-11 w-full" />
            <Bar className="h-40 w-full" />
          </div>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {Array.from({ length: 6 }, (_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

export function ProfileSkeleton() {
  return (
    <>
      <Suspense fallback={<div className="h-16" />}>
        <Header />
      </Suspense>
      <main className="w-full" aria-busy="true">
        <Bar className="h-[320px] w-full rounded-none" />
        <div className="max-w-7xl mx-auto px-6 py-12 grid lg:grid-cols-[1fr_360px] gap-12">
          <div className="space-y-4">
            <Bar className="h-8 w-1/2" />
            <Bar className="h-4 w-full" />
            <Bar className="h-4 w-5/6" />
            <Bar className="h-4 w-2/3" />
            <Bar className="mt-8 h-56 w-full rounded-xl" />
          </div>
          <Bar className="h-72 w-full rounded-xl" />
        </div>
      </main>
    </>
  );
}
