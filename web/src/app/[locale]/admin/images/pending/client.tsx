"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { approveImage, rejectImage } from "@/actions/image.actions";

interface PendingImage {
  id: string;
  url: string;
  entityType: "CAFE" | "ROASTER";
  entityName: string | null;
  uploadedBy: string;
  createdAt: string;
}

export function AdminPendingImagesClient({
  images,
}: {
  images: PendingImage[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setLoading(id);
    const result = await approveImage(id);
    if (result.success) router.refresh();
    setLoading(null);
  };

  const handleReject = async (id: string) => {
    setLoading(id);
    const result = await rejectImage(id);
    if (result.success) router.refresh();
    setLoading(null);
  };

  if (images.length === 0) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-20 text-center text-gray-400">
        <p className="text-lg">All clear!</p>
        <p className="text-sm mt-1">No images waiting for review.</p>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-8">
        Pending Images ({images.length})
      </h1>

      <div className="space-y-4">
        {images.map((img) => (
          <div
            key={img.id}
            className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4"
          >
            <div className="relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-md">
              <Image
                src={img.url}
                alt="Pending image"
                fill
                className="object-cover"
                sizes="112px"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium uppercase px-2 py-0.5 rounded bg-gray-100">
                  {img.entityType}
                </span>
                {img.entityName && (
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {img.entityName}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                by {img.uploadedBy} ·{" "}
                {new Date(img.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => handleApprove(img.id)}
                disabled={loading === img.id}
                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              >
                {loading === img.id ? "..." : "Approve"}
              </button>
              <button
                onClick={() => handleReject(img.id)}
                disabled={loading === img.id}
                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
