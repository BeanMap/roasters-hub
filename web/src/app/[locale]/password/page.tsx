"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

export default function PasswordPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/beta-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      window.location.href = redirect;
    } else {
      setError("Incorrect password. Try again.");
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(151,68,0,0.18) 0%, transparent 70%), #1c1917",
      }}
    >
      {/* Subtle grain texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
          backgroundRepeat: "repeat",
          backgroundSize: "128px",
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Image
            src="/brand/beanmap-logo.png"
            alt="Bean Map"
            width={120}
            height={47}
            className="h-[47px] w-auto brightness-0 invert opacity-90"
            priority
          />
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="font-headline text-[2rem] font-semibold text-white leading-[1.1] tracking-[-0.02em] mb-3">
            Private Beta
          </h1>
          <p className="text-white/55 text-[15px] leading-[1.6]">
            Enter your access code to explore Bean Map before the public launch.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Access code"
            className="w-full px-4 py-[14px] rounded-lg text-white placeholder-white/30 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/70 transition-shadow"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
            autoFocus
            autoComplete="current-password"
          />
          {error && (
            <p className="text-red-400/90 text-sm pl-1">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full px-4 py-[14px] rounded-lg bg-primary text-on-primary font-semibold text-[15px] hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Verifying…" : "Enter"}
          </button>
        </form>

        {/* Footer note */}
        <p className="text-center text-white/25 text-xs mt-10 tracking-wide">
          © Bean Map · Private Beta
        </p>
      </div>
    </div>
  );
}
