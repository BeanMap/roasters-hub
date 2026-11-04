"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { verifyRoaster, rejectRoaster } from "@/actions/admin.actions";

export interface SerializedRoaster {
  id: string;
  name: string;
  slug: string;
  city: string;
  country: string;
  countryCode: string;
  status: string;
  featured: boolean;
  description: string;
  certifications: string[];
  origins: string[];
  website: string | null;
  email: string | null;
  instagram: string | null;
  createdAt: string;
  imageUrl: string | null;
  imageAlt: string | null;
}

type StatusFilter = "all" | "PENDING" | "VERIFIED" | "REJECTED";

export function AdminPendingClient({ roasters: initial }: { roasters: SerializedRoaster[] }) {
  const t = useTranslations("admin");
  const [roasters, setRoasters] = useState(initial);
  const [selectedId, setSelectedId] = useState<string | null>(initial[0]?.id ?? null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("PENDING");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const filteredRoasters = statusFilter === "all"
    ? roasters
    : roasters.filter((r) => r.status === statusFilter);

  const selected = roasters.find((r) => r.id === selectedId);

  const handleVerify = (id: string) => {
    setError(null);
    startTransition(async () => {
      const result = await verifyRoaster(id);
      if (result.success) {
        setRoasters((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: "VERIFIED" } : r))
        );
      } else {
        setError(result.error);
      }
    });
  };

  const handleReject = (id: string) => {
    if (!rejectReason.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await rejectRoaster(id, rejectReason);
      if (result.success) {
        setRoasters((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: "REJECTED" } : r))
        );
        setShowRejectModal(false);
        setRejectReason("");
      } else {
        setError(result.error);
      }
    });
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "PENDING": return <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full uppercase">{t("pending")}</span>;
      case "VERIFIED": return <span className="px-2 py-0.5 bg-green-100 text-green-800 text-[10px] font-bold rounded-full uppercase">{t("verified")}</span>;
      case "REJECTED": return <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-bold rounded-full uppercase">{t("rejected")}</span>;
      default: return null;
    }
  };

  const [now] = useState(() => Date.now());
  const timeAgo = (iso: string) => {
    const diff = now - new Date(iso).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Admin Header */}
      <header className="bg-surface-container-lowest border-b border-surface-container-high px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="text-2xl font-bold font-headline tracking-tighter">Bean Map</span>
            <span className="text-xs bg-inverse-surface text-inverse-on-surface px-2 py-1 rounded font-bold uppercase">{t("admin")}</span>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            <span className="text-primary font-semibold">
              {t("pending")} ({roasters.filter((r) => r.status === "PENDING").length})
            </span>
            <span className="text-on-surface-variant">{t("allRoasters")}</span>
            <Link href="/" className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1">
              {t("viewSite")}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10" />
              </svg>
            </Link>
          </nav>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3 text-sm text-red-800">
          {error}
          <button onClick={() => setError(null)} className="ml-4 underline">{t("dismiss")}</button>
        </div>
      )}

      {/* Main 2-panel layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel — Queue */}
        <div className="w-[400px] border-r border-surface-container-high flex flex-col bg-surface-container-lowest">
          <div className="p-4 border-b border-surface-container-high">
            <h2 className="font-headline text-xl font-bold mb-3">{t("pendingVerification")}</h2>
            <div className="flex gap-2">
              {(["all", "PENDING", "VERIFIED", "REJECTED"] as StatusFilter[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={
                    statusFilter === filter
                      ? "px-3 py-1 rounded-full bg-primary text-on-primary text-xs font-bold"
                      : "px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant text-xs font-bold hover:bg-surface-variant transition-colors"
                  }
                >
                  {filter === "all" ? t("all") : filter.charAt(0) + filter.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredRoasters.map((roaster) => (
              <button
                key={roaster.id}
                onClick={() => setSelectedId(roaster.id)}
                className={`w-full text-left p-4 border-b border-surface-container-low hover:bg-surface-container-low transition-colors ${
                  selectedId === roaster.id ? "bg-surface-container-low" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-high overflow-hidden shrink-0 relative">
                    {roaster.imageUrl && (
                      <Image src={roaster.imageUrl} alt="" fill className="object-cover" sizes="40px" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-sm truncate">{roaster.name}</h3>
                      {statusBadge(roaster.status)}
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1">{roaster.city}, {roaster.country}</p>
                    <p className="text-xs text-on-surface-variant/60 mt-1">{timeAgo(roaster.createdAt)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Panel — Detail */}
        <div className="flex-1 overflow-y-auto p-8">
          {selected ? (
            <div className="max-w-2xl">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h2 className="font-headline text-3xl font-bold">{selected.name}</h2>
                  <p className="text-on-surface-variant">{selected.city}, {selected.country}</p>
                </div>
                {statusBadge(selected.status)}
              </div>

              <div className="space-y-8">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60 mb-3">{t("description")}</h3>
                  <p className="text-on-surface-variant leading-relaxed">{selected.description}</p>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60 mb-3">{t("certifications")}</h3>
                  <div className="flex flex-wrap gap-2">
                    {selected.certifications.map((c) => (
                      <span key={c} className="bg-surface-container-high px-3 py-1 rounded-full text-sm">{c}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60 mb-3">{t("origins")}</h3>
                  <div className="flex flex-wrap gap-2">
                    {selected.origins.map((o) => (
                      <span key={o} className="bg-surface-container-high px-3 py-1 rounded-full text-sm">{o}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60 mb-3">{t("links")}</h3>
                  <div className="space-y-2 text-sm">
                    {selected.website && <p>{t("website")}: <a href={selected.website} className="text-primary hover:underline">{selected.website}</a></p>}
                    {selected.email && <p>{t("email")}: {selected.email}</p>}
                    {selected.instagram && <p>Instagram: @{selected.instagram}</p>}
                  </div>
                </div>

                {/* Admin Notes */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60 mb-3">{t("adminNotesLabel")}</h3>
                  <textarea
                    className="w-full bg-surface-container-low border-none rounded-lg py-3 px-4 focus:ring-2 focus:ring-primary text-sm resize-none"
                    rows={3}
                    placeholder={t("addNotePlaceholder")}
                  />
                </div>

                {/* Actions */}
                {selected.status === "PENDING" && (
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => handleVerify(selected.id)}
                      disabled={isPending}
                      className="bg-secondary text-on-secondary px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                      </svg>
                      {isPending ? t("saving") : t("verifyAndPublish")}
                    </button>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      disabled={isPending}
                      className="border border-error text-error px-6 py-3 rounded-lg font-medium hover:bg-error/5 transition-all disabled:opacity-50"
                    >
                      {t("reject")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-on-surface-variant/60">
              {t("selectFromQueue")}
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-container-lowest rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 className="font-headline text-xl font-bold mb-4">{t("reasonForRejection")}</h3>
            <textarea
              className="w-full bg-surface-container-low border-none rounded-lg py-3 px-4 focus:ring-2 focus:ring-primary text-sm resize-none mb-6"
              rows={4}
              placeholder={t("provideBriefReason")}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowRejectModal(false)} className="px-4 py-2 text-on-surface-variant hover:text-on-surface transition-colors">{t("cancel")}</button>
              <button
                onClick={() => handleReject(selected.id)}
                disabled={isPending || !rejectReason.trim()}
                className="bg-error text-on-error px-6 py-2 rounded-lg font-medium hover:opacity-90 transition-all disabled:opacity-50"
              >
                {isPending ? t("saving") : t("sendRejection")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
