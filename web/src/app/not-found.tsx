import Link from "next/link";
import { AppShell } from "@/components/shared/AppShell";

// Only reached for URLs outside the [locale] segment, which has no document of its own.

export default function NotFound() {
  return (
    <AppShell locale="en">
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center min-h-screen">
      <p className="text-7xl font-semibold text-surface-container-highest mb-4">404</p>
      <h1 className="text-2xl font-semibold text-on-surface mb-3">Page not found</h1>
      <p className="text-on-surface-variant mb-8 max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex gap-4 flex-wrap justify-center">
        <Link
          href="/roasters"
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary hover:bg-accent-hover transition-colors"
        >
          Browse Roasters
        </Link>
        <Link
          href="/cafes"
          className="rounded-lg border border-outline-variant px-5 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors"
        >
          Browse Cafés
        </Link>
      </div>
    </main>
    </AppShell>
  );
}
