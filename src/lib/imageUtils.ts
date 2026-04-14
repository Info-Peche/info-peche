/**
 * Appends Supabase Storage image transformation parameters to resize images on the fly.
 * Only works with Supabase public storage URLs.
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

  const separator = url.includes("?") ? "&" : "?";
  const params = [`width=${width}`, `quality=${quality}`];
  if (height) params.push(`height=${height}`);

  return `${url}${separator}${params.join("&")}`;
}
