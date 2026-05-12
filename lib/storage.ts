import "server-only";
import { supabaseService } from "./supabase-service";

export type Bucket = "riders" | "festival-documents" | "rider-templates" | "booking-assets";

function client() {
  return supabaseService();
}

/**
 * Slaat een File op in een bucket onder een nette padstructuur.
 * Returns: { path, url } met de storage_path én een publieke URL.
 */
export async function uploadFile(
  bucket: Bucket,
  pathParts: string[],
  file: File,
  opts: { contentType?: string; upsert?: boolean } = {},
): Promise<{ path: string; url: string | null }> {
  const c = client();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const stamp = Date.now();
  const path = [...pathParts.map((p) => p.replace(/[^a-zA-Z0-9._-]/g, "_")), `${stamp}_${safeName}`].join("/");

  const arrayBuffer = await file.arrayBuffer();
  const { error } = await c.storage.from(bucket).upload(path, arrayBuffer, {
    contentType: opts.contentType ?? file.type ?? "application/octet-stream",
    upsert: opts.upsert ?? false,
  });
  if (error) throw new Error(`Upload faalde: ${error.message}`);

  const { data } = c.storage.from(bucket).getPublicUrl(path);
  return { path, url: data.publicUrl ?? null };
}

export function getPublicUrl(bucket: Bucket, path: string): string | null {
  const c = supabaseService();
  if (!c || !path) return null;
  const { data } = c.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl ?? null;
}

/**
 * Voor private buckets (rider-templates): genereer signed URL die X seconden geldig is.
 */
export async function getSignedUrl(bucket: Bucket, path: string, expiresInSeconds = 60 * 60): Promise<string | null> {
  if (!path) return null;
  const c = client();
  const { data, error } = await c.storage.from(bucket).createSignedUrl(path, expiresInSeconds);
  if (error || !data) return null;
  return data.signedUrl;
}

export async function removeFile(bucket: Bucket, path: string): Promise<void> {
  if (!path) return;
  const c = client();
  await c.storage.from(bucket).remove([path]);
}
