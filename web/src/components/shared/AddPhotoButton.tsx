"use client";

import { useState } from "react";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { AddPhotoModal } from "@/components/shared/AddPhotoModal";

interface AddPhotoButtonProps {
  entityType: "CAFE" | "ROASTER";
  entityId: string;
}

export function AddPhotoButton({ entityType, entityId }: AddPhotoButtonProps) {
  const { isSignedIn } = useAuth();
  const [showModal, setShowModal] = useState(false);

  if (!isSignedIn) {
    return (
      <div className="text-center py-3">
        <SignInButton mode="modal">
          <button className="text-sm text-amber-600 hover:text-amber-700 font-medium">
            Sign in to add a photo
          </button>
        </SignInButton>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700 font-medium"
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
