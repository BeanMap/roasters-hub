"use client";

import { useState, useEffect } from "react";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { AddPhotoModal } from "@/components/shared/AddPhotoModal";

interface AddPhotoButtonProps {
  entityType: "CAFE" | "ROASTER";
  entityId: string;
}

async function fetchImageInfo(entityType: string, entityId: string) {
  try {
    const { getImageUploadInfo } = await import("@/actions/image.actions");
    return await getImageUploadInfo(entityType as "CAFE" | "ROASTER", entityId);
  } catch {
    return null;
  }
}

interface ImageInfo { total: number; userTotal: number; maxTotal: number; maxPerUser: number; }

export function AddPhotoButton({ entityType, entityId }: AddPhotoButtonProps) {
  const { isSignedIn } = useAuth();
  const t = useTranslations("profiles");
  const [showModal, setShowModal] = useState(false);
  const [info, setInfo] = useState<ImageInfo | null>(null);

  useEffect(() => {
    if (isSignedIn) {
      fetchImageInfo(entityType, entityId).then(setInfo);
    }
  }, [isSignedIn, entityType, entityId]);

  const limitReached = !!(info && info.userTotal >= info.maxPerUser);
  const totalReached = !!(info && info.total >= info.maxTotal);

  if (!isSignedIn) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-outline-variant px-4 py-3">
        <p className="text-sm text-on-surface-variant">{t("signInToAddPhoto")}</p>
        <SignInButton mode="modal">
          <button className="rounded-full border border-on-surface/20 px-4 py-1.5 text-sm font-semibold text-on-surface hover:border-primary hover:text-primary transition-colors">
            {t("signInShort")}
          </button>
        </SignInButton>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowModal(true)}
          disabled={limitReached || totalReached}
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-on-surface-variant font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Photo
        </button>
        {info && (
          <span className="text-xs text-on-surface-variant/60">
            ({info.total}/{info.maxTotal})
          </span>
        )}
        {limitReached && (
          <span className="text-xs text-red-500">Limit reached</span>
        )}
      </div>
      {showModal && (
        <AddPhotoModal
          entityType={entityType}
          entityId={entityId}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
