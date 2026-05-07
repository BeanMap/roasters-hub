"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageLightbox } from "@/components/shared/ImageLightbox";

interface GalleryImage {
  id: string;
  url: string;
  isPrimary: boolean;
  isDefault?: boolean;
}

interface ImageGalleryProps {
  images: GalleryImage[];
  emptyMessage?: string;
}

export function ImageGallery({
  images,
  emptyMessage = "No photos yet",
}: ImageGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50">
        <svg
          className="w-10 h-10 text-gray-300 mb-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
          />
        </svg>
        <p className="text-sm text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {images.map((img, i) => (
          <div
            key={img.id}
            className={`relative cursor-pointer overflow-hidden rounded-lg group ${
              img.isPrimary && i === 0
                ? "sm:col-span-2 sm:row-span-2"
                : ""
            }`}
            onClick={() => setLightboxIndex(i)}
          >
            <div
              className={`relative w-full ${
                img.isPrimary && i === 0 ? "aspect-[4/3]" : "aspect-square"
              }`}
            >
              <Image
                src={img.url}
                alt={""}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>
            {img.isDefault && (
              <span className="absolute top-2 left-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">
                Stock
              </span>
            )}
            {img.isPrimary && (
              <span className="absolute top-2 right-2 bg-amber-600 text-white text-[10px] px-1.5 py-0.5 rounded">
                Cover
              </span>
            )}
          </div>
        ))}
      </div>

      {lightboxIndex !== null && (
        <ImageLightbox
          images={images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
