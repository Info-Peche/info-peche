/**
 * Appends Supabase Storage image transformation parameters to resize images on the fly.
 * Uses the /render/image/public/ endpoint for on-the-fly transforms.
 * @see https://supabase.com/docs/guides/storage/serving/image-transformations
 */
export function resizeSupabaseImage(
  url: string,
  width: number,
  height?: number,
  quality: number = 75
): string {
  if (!url) return url;

  // Only transform Supabase storage URLs
  if (!url.includes("supabase.co/storage/")) return url;

  // Convert /object/public/ URL to /render/image/public/ for transforms
  const renderUrl = url.replace(
    "/storage/v1/object/public/",
    "/storage/v1/render/image/public/"
  );

  const separator = renderUrl.includes("?") ? "&" : "?";
  const params = [`width=${width}`, `quality=${quality}`];
  if (height) params.push(`height=${height}`);
  params.push("resize=contain");

  return `${renderUrl}${separator}${params.join("&")}`;
}

/**
 * Compresses an image File in the browser to keep it under maxBytes.
 * Iteratively reduces dimensions and JPEG quality until the size fits.
 * Returns the original File if it already fits or if compression fails.
 */
export async function compressImageFile(
  file: File,
  maxBytes: number = 5 * 1024 * 1024,
  options: { maxDimension?: number; mimeType?: string } = {}
): Promise<File> {
  if (file.size <= maxBytes) return file;
  if (!file.type.startsWith("image/")) return file;

  const { maxDimension = 2000, mimeType = "image/jpeg" } = options;

  // Decode image
  const dataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Lecture du fichier impossible"));
    reader.readAsDataURL(file);
  });

  const img: HTMLImageElement = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("Décodage de l'image impossible"));
    i.src = dataUrl;
  });

  // Iteratively shrink + lower quality until it fits
  let width = img.naturalWidth;
  let height = img.naturalHeight;
  const ratio = width / height;

  if (Math.max(width, height) > maxDimension) {
    if (width >= height) {
      width = maxDimension;
      height = Math.round(maxDimension / ratio);
    } else {
      height = maxDimension;
      width = Math.round(maxDimension * ratio);
    }
  }

  const qualities = [0.85, 0.75, 0.65, 0.55, 0.45];

  for (let attempt = 0; attempt < 5; attempt++) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, width, height);

    for (const q of qualities) {
      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob(resolve, mimeType, q)
      );
      if (!blob) continue;
      if (blob.size <= maxBytes) {
        const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
        return new File([blob], newName, { type: mimeType });
      }
    }

    // Still too big — shrink dimensions further and retry
    width = Math.round(width * 0.8);
    height = Math.round(height * 0.8);
    if (width < 600 || height < 600) break;
  }

  return file;
}
