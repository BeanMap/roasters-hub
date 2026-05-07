"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { UploadButton } from "@/lib/uploadthing";
import { deleteImage, setPrimaryImage } from "@/actions/image.actions";

export interface GalleryImage {
  id: string;
  url: string;
  isPrimary: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

interface DashboardGalleryProps {
  images: GalleryImage[];
  entityType: "CAFE" | "ROASTER";
  entityId: string;
  maxImages: number;
}

export function DashboardGallery({
  images,
  entityType,
  entityId,
  maxImages,
}: DashboardGalleryProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const activeImages = images.filter((img) => img.status !== "REJECTED");
  const remaining = Math.max(0, maxImages - activeImages.length);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this image?")) return;
    setLoading(id);
    const result = await deleteImage(id);
    if (result.success) {
      setMessage({ type: "success", text: "Image deleted." });
      router.refresh();
    } else {
      setMessage({ type: "error", text: result.error });
    }
    setLoading(null);
  };

  const handleSetPrimary = async (id: string) => {
    setLoading(id);
    const result = await setPrimaryImage(id);
    if (result.success) {
      setMessage({ type: "success", text: "Primary image updated." });
      router.refresh();
    } else {
      setMessage({ type: "error", text: result.error });
    }
    setLoading(null);
  };

  return (
    <section className="bg-surface-container-lowest editorial-shadow rounded-2xl p-8 border border-outline-variant/10 mb-8">
      <h2 className="font-headline text-2xl tracking-tight mb-2">Gallery</h2>
      <p className="text-sm text-on-surface-variant/60 mb-6">
        {activeImages.length} / {maxImages} images
        {remaining > 0 && `— you can add ${remaining} more`}
      </p>

      {message && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {images.map((img) => (
            <div
              key={img.id}
              className="relative rounded-lg overflow-hidden border border-gray-200 group"
            >
              <div className="aspect-square relative">
                <Image
                  src={img.url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="200px"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </div>
              <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between gap-2">
                {img.status === "PENDING" && (
                  <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                    Awaiting approval
                  </span>
                )}
                {img.isPrimary && (
                  <span className="bg-green-600 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                    Cover
                  </span>
                )}
                <div className="flex gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                  {img.status === "APPROVED" && !img.isPrimary && (
                    <button
                      onClick={() => handleSetPrimary(img.id)}
                      disabled={loading === img.id}
                      className="bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded hover:bg-black/80 disabled:opacity-50"
                      title="Set as cover"
                    >
                      {loading === img.id ? "..." : "\u2605"}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(img.id)}
                    disabled={loading === img.id}
                    className="bg-red-600/80 text-white text-[10px] px-1.5 py-0.5 rounded hover:bg-red-700 disabled:opacity-50"
                    title="Delete"
                  >
                    {loading === img.id ? "..." : "\u2715"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {remaining > 0 && (
        <div className="flex flex-col items-center gap-3 border-2 border-dashed border-outline-variant/30 rounded-xl p-6 bg-surface-container-low">
          <p className="text-on-surface-variant/70 text-sm">
            {activeImages.length === 0
              ? "Add your first photo"
              : "Add another photo"}
          </p>
          <UploadButton
            endpoint="userImage"
            headers={{
              "x-entity-type": entityType,
              "x-entity-id": entityId,
            }}
            onClientUploadComplete={() => {
              setMessage({ type: "success", text: "Photo uploaded and submitted for review." });
              router.refresh();
            }}
            onUploadError={(error: Error) => {
              setMessage({ type: "error", text: error.message });
            }}
            appearance={{
              button:
                "bg-primary text-on-primary px-6 py-3 rounded-lg text-sm font-medium hover:bg-primary-container transition-colors ut-uploading:bg-primary/50",
              allowedContent: "text-on-surface-variant/50 text-xs mt-2",
            }}
          />
        </div>
      )}

      {remaining === 0 && (
        <div className="text-center py-4 text-on-surface-variant/50 text-sm">
          You&apos;ve reached the maximum number of images.
        </div>
      )}
    </section>
  );
}
