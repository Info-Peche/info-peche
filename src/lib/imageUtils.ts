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
