import { supabase } from "@/lib/supabase/client";

// User uploads (chat files, receipts) go to Cloudflare R2 via the `storage-sign`
// presign edge function — never through Supabase storage. Stored paths are
// prefixed "r2:<key>" so the app knows to resolve them through R2.
//
// If R2 is unavailable (e.g. secrets not yet configured) we fall back to the
// given Supabase bucket so uploads never hard-fail; the returned path has no
// "r2:" prefix in that case and is resolved through Supabase instead.

export type StoredFile = { path: string; storage: "r2" | "supabase" };

export async function uploadUserFile(file: File, opts: { fallbackBucket: string; fallbackPrefix: string; folder?: string }): Promise<StoredFile> {
  try {
    const { data, error } = await supabase.functions.invoke("storage-sign", {
      body: { action: "upload", filename: file.name, contentType: file.type || "application/octet-stream", folder: opts.folder },
    });
    const key = (data as { key?: string; url?: string } | null)?.key;
    const url = (data as { url?: string } | null)?.url;
    if (error || !key || !url) throw error ?? new Error("no presigned url");
    const put = await fetch(url, { method: "PUT", headers: file.type ? { "content-type": file.type } : undefined, body: file });
    if (!put.ok) throw new Error("r2 put failed " + put.status);
    return { path: `r2:${key}`, storage: "r2" };
  } catch (e) {
    console.warn("R2 upload unavailable, falling back to Supabase storage:", e);
    const path = `${opts.fallbackPrefix}/${Date.now()}_${file.name.replace(/[^\w.\-]/g, "_")}`;
    const up = await supabase.storage.from(opts.fallbackBucket).upload(path, file);
    if (up.error) throw up.error;
    return { path, storage: "supabase" };
  }
}

// Resolve a stored path (R2 or Supabase) to a short-lived viewable/downloadable URL.
export async function fileUrl(path: string, supabaseBucket: string, download?: string, ttl?: number): Promise<string | null> {
  if (path.startsWith("r2:")) {
    const key = path.slice(3);
    const { data, error } = await supabase.functions.invoke("storage-sign", { body: { action: "download", key, download, ttl } });
    if (error) return null;
    return (data as { url?: string } | null)?.url ?? null;
  }
  const { data } = await supabase.storage.from(supabaseBucket).createSignedUrl(path, 300, download ? { download } : undefined);
  return data?.signedUrl ?? null;
}
