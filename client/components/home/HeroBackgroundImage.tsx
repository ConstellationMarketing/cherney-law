import { getOptimizedImageUrl } from "@site/lib/imageOptimizer";

interface HeroBackgroundImageProps {
  src: string;
  alt?: string;
}

export default function HeroBackgroundImage({
  src,
  alt = "",
}: HeroBackgroundImageProps) {
  const mobileSrc = getOptimizedImageUrl(src, {
    width: 768,
    quality: 75,
    resize: "cover",
  });
  const desktopSrc = getOptimizedImageUrl(src, {
    width: 1920,
    quality: 75,
    resize: "cover",
  });
  const srcSet = `${mobileSrc} 768w, ${desktopSrc} 1920w`;

  return (
    <picture className="absolute inset-0 block overflow-hidden" aria-hidden={!alt}>
      <source media="(max-width: 767px)" srcSet={mobileSrc} />
      <img
        src={desktopSrc}
        srcSet={srcSet}
        sizes="100vw"
        alt={alt}
        width={1920}
        height={1080}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        className="h-full w-full object-cover object-center"
      />
    </picture>
  );
}
