"use client";

import React, { useState, useEffect, useTransition } from "react";
import type { ProposalWithMeta } from "./types";
import { updateProposalStatus } from "../../actions";
import { applyEntityProposals } from "@/app/[locale]/admin/enrichment/actions/apply";
import { useRouter } from "next/navigation";
import { useUploadThing } from "@/lib/uploadthing";

interface EntityCardProps {
  runId: string;
  entityId: string | null;
  entityName: string;
  entityType: string;
  isNew: boolean;
  proposals: ProposalWithMeta[];
  existingFields: Record<string, unknown>;
  runKeywords: string[];
  onAdvance: () => void;
}

const FIELD_GROUPS = [
  { key: "IDENTITY", label: "Tożsamość" },
  { key: "LOCATION", label: "Lokalizacja" },
  { key: "CONTACT", label: "Kontakt" },
  { key: "SOCIAL", label: "Social" },
  { key: "PRODUCT", label: "Produkt" },
  { key: "ENRICHMENT", label: "Oferta" },
  { key: "VISIT", label: "Wizyta" },
];

export function EntityCard({
  runId,
  entityId,
  entityName,
  entityType,
  isNew,
  proposals,
  existingFields,
  runKeywords,
  onAdvance,
}: EntityCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { startUpload, isUploading } = useUploadThing("adminImage");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoPage, setPhotoPage] = useState(1);
  const [photoCredit, setPhotoCredit] = useState<{ name: string; link: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-load photo on mount
  useEffect(() => {
    const query = [entityName, ...runKeywords.slice(0, 2), "specialty coffee"].join(" ");
    fetch(`/api/enrichment/photo?query=${encodeURIComponent(query)}&page=1`)
      .then((r) => r.json())
      .then((data) => {
        if (data.url) { setPhotoUrl(data.url); setPhotoCredit(data.credit); }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId, entityName]);

  function rollPhoto() {
    const nextPage = photoPage + 1;
    setPhotoPage(nextPage);
    const query = [entityName, ...runKeywords.slice(0, 2), "specialty coffee"].join(" ");
    fetch(`/api/enrichment/photo?query=${encodeURIComponent(query)}&page=${nextPage}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.url) { setPhotoUrl(data.url); setPhotoCredit(data.credit); }
      })
      .catch(() => {});
  }

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      const result = await applyEntityProposals({
        runId,
        entityId,
        entityName,
        entityType,
        photoUrl: photoUrl ?? undefined,
      });
      if (result.success) {
        onAdvance();
        router.refresh();
      } else {
        setError(result.error ?? "Unknown error");
      }
    });
  }

  function handleSkip() {
    startTransition(async () => {
      const pendingIds = proposals.filter((p) => p.status === "PENDING").map((p) => p.id);
      await Promise.all(pendingIds.map((id) => updateProposalStatus(id, "SKIPPED")));
      onAdvance();
      router.refresh();
    });
  }

  const pendingProposals = proposals.filter((p) => p.status === "PENDING");

  return (
    <div className="flex flex-col gap-5 p-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        {/* Photo */}
        <div className="relative flex-shrink-0">
          <div
            className="h-[90px] w-[130px] overflow-hidden rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-low"
            style={photoUrl ? { backgroundImage: `url(${photoUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
          >
            {!photoUrl && (
              <div className="flex h-full items-center justify-center text-2xl text-on-surface-variant">📷</div>
            )}
          </div>
          <div className="mt-1.5 flex gap-1">
            <button
              onClick={rollPhoto}
              className="flex-1 rounded border border-outline-variant bg-surface-container-low py-0.5 text-center text-[10px] text-on-surface-variant hover:bg-surface-container-low"
            >
              ↺ Losuj
            </button>
            <label className="flex-1 cursor-pointer rounded border border-outline-variant bg-surface-container-low py-0.5 text-center text-[10px] text-on-surface-variant hover:bg-surface-container-low">
              {isUploading ? "Wgrywanie…" : "↑ Wgraj"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isUploading}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const res = await startUpload([file]);
                  if (res?.[0]?.url) {
                    setPhotoUrl(res[0].url);
                    setPhotoCredit(null);
                  }
                }}
              />
            </label>
          </div>
          {photoCredit && (
            <p className="mt-1 text-[9px] text-on-surface-variant">
              Unsplash · <a href={photoCredit.link} target="_blank" rel="noreferrer" className="underline">{photoCredit.name}</a>
            </p>
          )}
        </div>

        {/* Meta */}
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h2 className="text-xl font-bold text-on-surface">{entityName}</h2>
            {isNew && (
              <span className="rounded bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">NOWA ENCJA</span>
            )}
          </div>
          <p className="mb-3 text-xs text-on-surface-variant">{entityType} · {(existingFields.city as string) ?? "—"}</p>

          {error && <p className="mb-2 text-xs text-red-600">{error}</p>}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleApprove}
              disabled={isPending}
              className="rounded-lg bg-amber-800 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-900 disabled:opacity-50"
            >
              {isPending ? "Zapisywanie…" : "Zatwierdź i przejdź dalej →"}
            </button>
            <button
              onClick={handleSkip}
              disabled={isPending}
              className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container-low"
            >
              Pomiń
            </button>
            <button
              disabled={isPending}
              className="rounded-lg border border-red-200 bg-surface-container-lowest px-3 py-2 text-xs text-red-500 hover:bg-red-50"
            >
              Oznacz jako nieaktywna
            </button>
          </div>
        </div>
      </div>

      {/* Fields by group */}
      {FIELD_GROUPS.map((group) => {
        const groupProposals = proposals.filter((p) => p.fieldGroup === group.key);
        if (groupProposals.length === 0) return null;

        return (
          <div key={group.key}>
            <p className="mb-2 border-b border-outline-variant pb-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              {group.label}
            </p>
            <div className="overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest">
              {groupProposals.map((p) => (
                <div key={p.id} className="flex items-baseline gap-3 border-b border-stone-50 px-3 py-2 last:border-0">
                  <span className="w-[90px] flex-shrink-0 text-[10px] uppercase text-on-surface-variant">{p.fieldKey}</span>
                  {p.proposedValue !== null && p.proposedValue !== undefined ? (
                    <span className="flex-1 text-xs text-green-700">
                      {String(p.proposedValue)}
                      <span className="ml-1.5 rounded bg-surface-container-low px-1 py-0.5 text-[9px] text-on-surface-variant">{p.sourceId.toUpperCase()}</span>
                    </span>
                  ) : (
                    <input className="flex-1 rounded border border-outline-variant px-2 py-0.5 text-xs text-on-surface-variant outline-none focus:border-amber-700" placeholder={`Wpisz ${p.fieldKey}…`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Pending proposals section */}
      {pendingProposals.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between border-b border-outline-variant pb-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Propozycje ({pendingProposals.length} oczekujące)
            </p>
            <div className="flex gap-2">
              <button className="text-[10px] text-green-600 hover:underline">Zatwierdź wszystkie</button>
              <button className="text-[10px] text-red-400 hover:underline">Odrzuć wszystkie</button>
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest">
            {pendingProposals.map((p) => (
              <div key={p.id} className="flex items-center gap-3 border-b border-stone-50 px-3 py-2 text-xs last:border-0">
                <span className="w-[80px] flex-shrink-0 text-[10px] uppercase text-on-surface-variant">{p.fieldKey}</span>
                <span className="flex-1 text-on-surface-variant">{String(p.proposedValue ?? "—")}</span>
                <span className="text-[10px] font-semibold text-amber-600">{Math.round(p.confidence * 100)}%</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => updateProposalStatus(p.id, "APPLIED")}
                    className="flex h-6 w-6 items-center justify-center rounded border border-green-300 text-green-600 hover:bg-green-50 text-[11px]"
                  >✓</button>
                  <button
                    onClick={() => updateProposalStatus(p.id, "REJECTED")}
                    className="flex h-6 w-6 items-center justify-center rounded border border-red-200 text-red-400 hover:bg-red-50 text-[11px]"
                  >✗</button>
                  <button
                    onClick={() => updateProposalStatus(p.id, "SKIPPED")}
                    className="flex h-6 w-6 items-center justify-center rounded border border-outline-variant text-on-surface-variant hover:bg-surface-container-low text-[11px]"
                  >–</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All done empty state */}
      {pendingProposals.length === 0 && proposals.length > 0 && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center text-sm text-green-700">
          ✓ Encja przejrzana
        </div>
      )}
    </div>
  );
}
