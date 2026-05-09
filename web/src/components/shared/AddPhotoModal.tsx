"use client";

import { useState } from "react";
import { UploadButton } from "@/lib/uploadthing";
import { useRouter } from "next/navigation";

interface AddPhotoModalProps {
  entityType: "CAFE" | "ROASTER";
  entityId: string;
  onClose: () => void;
}

export function AddPhotoModal({
  entityType,
  entityId,
  onClose,
}: AddPhotoModalProps) {
  const router = useRouter();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-8 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Add a Photo</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        {message && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm ${
              message.type === "success"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            <p className="mb-2">{message.text}</p>
            <button
              onClick={() => {
                if (message.type === "success") {
                  router.refresh();
                }
                onClose();
              }}
              className="text-xs underline hover:no-underline"
            >
              {message.type === "success" ? "Close" : "Dismiss"}
            </button>
          </div>
        )}

        <p className="text-sm text-gray-500 mb-4">
          Photos are reviewed before appearing on the profile. Please only
          upload photos you&apos;ve taken yourself.
        </p>

        <div className="flex flex-col items-center gap-3 border-2 border-dashed border-gray-300 rounded-xl p-8">
          <UploadButton
            endpoint="userImage"
            input={{ entityType, entityId }}
            onClientUploadComplete={() => {
              setMessage({
                type: "success",
                text: "Photo submitted for review! It will appear after moderation.",
              });
            }}
            onUploadError={(error: Error) => {
              setMessage({ type: "error", text: error.message });
            }}
            appearance={{
              button:
                "bg-amber-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-amber-700 ut-uploading:bg-amber-400",
              allowedContent: "text-gray-400 text-xs mt-2",
            }}
          />
        </div>
      </div>
    </div>
  );
}
