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
