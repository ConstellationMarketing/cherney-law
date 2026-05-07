/**
 * Image Optimizer
 * Optimizes images by converting to WebP and downscaling if necessary
 */

/**
 * Optimize an image file by converting to WebP and downscaling if needed
 * @param file - The image file to optimize
 * @returns Promise resolving to the optimized file (or original if no optimization needed)
 */
export async function optimizeImage(file: File): Promise<File> {
  try {
    // Skip SVG and GIF files
    if (file.type === "image/svg+xml" || file.type === "image/gif") {
      return file;
    }

    // Create an image bitmap from the file
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;

    // Determine target dimensions (downscale if either dimension exceeds 2048px)
    let targetWidth = width;
    let targetHeight = height;

    if (width > 2048 || height > 2048) {
      const ratio = Math.min(2048 / width, 2048 / height);
      targetWidth = Math.round(width * ratio);
      targetHeight = Math.round(height * ratio);
    }

    // Create offscreen canvas and draw the image
    const canvas = new OffscreenCanvas(targetWidth, targetHeight);
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      // Fallback: return original if canvas context not available
      return file;
    }

    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
    bitmap.close();

    // Convert to WebP
    const blob = await canvas.convertToBlob({
      type: "image/webp",
      quality: 0.82,
    });

    // Only use WebP if it's smaller than the original
    if (blob.size >= file.size) {
      return file;
    }

    // Create new File with .webp extension
    const originalName = file.name.split(".")[0];
    const webpFile = new File([blob], `${originalName}.webp`, {
      type: "image/webp",
      lastModified: Date.now(),
    });

    return webpFile;
  } catch (err) {
    // On any error, return the original file
    console.warn("Image optimization failed, using original:", err);
    return file;
  }
}

interface OptimizedImageUrlOptions {
  width?: number;
  height?: number;
  quality?: number;
  resize?: "cover" | "contain" | "fill";
}

const RASTER_IMAGE_EXTENSION = /\.(?:jpe?g|png)(?:$|[?#])/i;

export function getOptimizedImageUrl(
  src: string | null | undefined,
  options: OptimizedImageUrlOptions = {},
): string {
  if (!src || !RASTER_IMAGE_EXTENSION.test(src)) {
    return src || "";
  }

  if (src.includes("/storage/v1/object/public/")) {
    try {
      const url = new URL(src);
      url.pathname = url.pathname.replace(
        "/storage/v1/object/public/",
        "/storage/v1/render/image/public/",
      );
      url.searchParams.set("format", "webp");
      url.searchParams.set("quality", String(options.quality ?? 75));
      if (options.width) url.searchParams.set("width", String(options.width));
      if (options.height) url.searchParams.set("height", String(options.height));
      if (options.resize) url.searchParams.set("resize", options.resize);
      return url.toString();
    } catch {
      return src;
    }
  }

  return src;
}

export function getOptimizedBackgroundImage(
  src: string | null | undefined,
  options?: OptimizedImageUrlOptions,
): string | undefined {
  const optimizedSrc = getOptimizedImageUrl(src, options);
  return optimizedSrc ? `url(${optimizedSrc})` : undefined;
}
