"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { UploadButton } from "@/lib/uploadthing";
import { deleteImage } from "@/actions/image.actions";

interface ImageItem {
  id: string;
  url: string;
  entityType: "CAFE" | "ROASTER";
  status: string;
  isDefault: boolean;
  createdAt: string;
  uploadedBy: string;
}

export function AdminImagesClient({ images }: { images: ImageItem[] }) {
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState<"ALL" | "CAFE" | "ROASTER">(
    "ALL",
  );

  const filtered =
    typeFilter === "ALL"
      ? images
      : images.filter((img) => img.entityType === typeFilter);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this image?")) return;
    const result = await deleteImage(id);
    if (result.success) router.refresh();
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Default Image Pool</h1>
          <p className="text-sm text-gray-500 mt-1">
            {images.length} images in pool
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-1 rounded-lg border border-gray-300 bg-white p-0.5">
            {(["ALL", "CAFE", "ROASTER"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setTypeFilter(tab)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  typeFilter === tab
                    ? "bg-amber-600 text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab === "ALL" ? "All" : tab.charAt(0) + tab.slice(1).toLowerCase() + "s"}
              </button>
            ))}
          </div>
          <UploadButton
            endpoint="defaultImage"
            headers={{ "x-entity-type": typeFilter === "ALL" ? "CAFE" : typeFilter }}
            onClientUploadComplete={() => {
              router.refresh();
            }}
            appearance={{
              button:
                "bg-amber-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-amber-700 ut-ready:bg-amber-600 ut-uploading:bg-amber-400",
            }}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">No default images yet</p>
          <p className="text-sm mt-1">
            Upload your first default image to help new entries look great.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((img) => (
            <div
              key={img.id}
              className="group relative rounded-lg overflow-hidden border border-gray-200 bg-white"
            >
              <div className="aspect-[4/3] relative">
                <Image
                  src={img.url}
                  alt="Default image"
                  fill
                  className="object-cover"
                  sizes="200px"
                />
              </div>
              <div className="p-2 flex items-center justify-between">
                <span className="text-xs text-gray-500 uppercase">
                  {img.entityType}
                </span>
                <button
                  onClick={() => handleDelete(img.id)}
                  className="text-xs text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
