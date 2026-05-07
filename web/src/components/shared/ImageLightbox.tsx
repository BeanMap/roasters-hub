"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";

interface GalleryImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

export function ImageLightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: GalleryImage[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);

  const prev = useCallback(() => {
    setIndex((i) => (i > 0 ? i - 1 : images.length - 1));
  }, [images.length]);

  const next = useCallback(() => {
    setIndex((i) => (i < images.length - 1 ? i + 1 : 0));
  }, [images.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose, prev, next]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 text-white text-2xl hover:opacity-70"
        aria-label="Close"
      >
        ✕
      </button>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            className="absolute left-4 z-10 text-white text-3xl hover:opacity-70 px-2"
            aria-label="Previous"
          >
            ‹
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            className="absolute right-4 z-10 text-white text-3xl hover:opacity-70 px-2"
            aria-label="Next"
          >
            ›
          </button>
        </>
      )}

      <div
        className="relative max-h-[90vh] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={images[index].url}
          alt={""}
          width={1200}
          height={900}
          className="max-h-[90vh] w-auto object-contain rounded"
          priority
        />
      </div>

      {images.length > 1 && (
        <div className="absolute bottom-6 text-white text-sm font-medium">
          {index + 1} / {images.length}
        </div>
      )}
    </div>
  );
}
