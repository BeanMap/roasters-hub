"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteImage } from "@/actions/image.actions";

interface Photo {
  id: string;
  url: string;
  entityType: "CAFE" | "ROASTER";
  entityName: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

export function MyPhotosClient({ photos }: { photos: Photo[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this photo?")) return;
    setDeleting(id);
    const result = await deleteImage(id);
    if (result.success) router.refresh();
    setDeleting(null);
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-amber-100 text-amber-700",
      APPROVED: "bg-green-100 text-green-700",
      REJECTED: "bg-red-100 text-red-700",
    };
    return (
      <span
        className={`text-xs font-medium px-2 py-0.5 rounded ${colors[status] ?? "bg-gray-100"}`}
      >
        {status}
      </span>
    );
  };

  if (photos.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h1 className="text-2xl font-bold mb-2">My Photos</h1>
        <p className="text-gray-500">
          You haven&apos;t uploaded any photos yet. Visit a cafe or roaster
          profile and click &quot;Add Photo&quot;.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-2">My Photos</h1>
      <p className="text-sm text-gray-500 mb-8">
        Photos you&apos;ve uploaded. Pending photos are waiting for admin
        review.
      </p>

      <div className="space-y-3">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4"
          >
            <div className="relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-md">
              <Image
                src={photo.url}
                alt=""
                fill
                className="object-cover"
                sizes="112px"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {statusBadge(photo.status)}
                <span className="text-xs text-gray-400 uppercase">
                  {photo.entityType}
                </span>
              </div>
              {photo.entityName && (
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {photo.entityName}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-0.5">
                {new Date(photo.createdAt).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => handleDelete(photo.id)}
              disabled={deleting === photo.id}
              className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
            >
              {deleting === photo.id ? "..." : "Delete"}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/roasters"
          className="text-sm text-amber-600 hover:text-amber-700"
        >
          Browse roasters to add more photos →
        </Link>
      </div>
    </div>
  );
}
