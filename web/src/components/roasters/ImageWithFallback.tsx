"use client";

import Image from "next/image";
import { useState } from "react";
import { ImagePlaceholder } from "@/components/shared/ImagePlaceholder";

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  fill?: boolean;
  sizes?: string;
  className?: string;
}

export function ImageWithFallback({ src, alt, fill, sizes, className }: ImageWithFallbackProps) {
  const [error, setError] = useState(false);

  if (error) {
    return <ImagePlaceholder label={alt} />;
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      sizes={sizes}
      className={className}
      onError={() => setError(true)}
    />
  );
}
