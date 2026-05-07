"use client";

import { useState } from "react";
import Image from "next/image";
import { reorderImages } from "@/actions/image.actions";

interface SortableImage {
  id: string;
  url: string;
  sortOrder: number;
}

interface ImageSortableListProps {
  images: SortableImage[];
  onReordered?: () => void;
}

export function ImageSortableList({
  images: initialImages,
  onReordered,
}: ImageSortableListProps) {
  const [items, setItems] = useState(initialImages);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;

    const updated = [...items];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(index, 0, moved);
    setItems(updated);
    setDragIndex(index);
  };

  const handleDragEnd = async () => {
    setDragIndex(null);
    setSaving(true);
    const reordered = items.map((item, i) => ({
      id: item.id,
      sortOrder: i,
    }));
    await reorderImages(reordered);
    onReordered?.();
    setSaving(false);
  };

  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {items.map((img, i) => (
        <div
          key={img.id}
          draggable
          onDragStart={() => handleDragStart(i)}
          onDragOver={(e) => handleDragOver(e, i)}
          onDragEnd={handleDragEnd}
          className={`relative rounded-lg overflow-hidden border-2 cursor-grab active:cursor-grabbing ${
            dragIndex === i
              ? "border-amber-500 opacity-50"
              : "border-transparent"
          } ${saving ? "pointer-events-none opacity-60" : ""}`}
        >
          <div className="aspect-square relative">
            <Image
              src={img.url}
              alt=""
              fill
              className="object-cover"
              sizes="200px"
            />
          </div>
          <div className="absolute top-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">
            {i + 1}
          </div>
        </div>
      ))}
    </div>
  );
}
