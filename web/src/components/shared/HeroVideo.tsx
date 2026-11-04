export function HeroVideo() {
  return (
    <video
      className="absolute inset-0 w-full h-full object-cover opacity-[0.55] motion-reduce:hidden"
      src="/videos/hero-bg-loop.mp4"
      // First frame shows immediately instead of a black hero while the video loads.
      poster="/videos/hero-poster.jpg"
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      aria-hidden="true"
    />
  );
}
