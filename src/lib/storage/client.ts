import { supabase } from "@/lib/supabase/client";
import type { StorageFolder } from "@/types/storage";

/* Browser-side entry point to platform storage.

   Every file on the platform lives in Cloudflare R2 and nowhere else. The
   browser never sees R2 credentials: it posts the file to our own API routes,
   which upload server-side. Stored paths are always written as "r2:<key>".

   Supabase is the database and the auth provider here, never a file store: it
   is used below only to read the caller's access token. */

export type StoredFile = { path: string; key: string; fileName: string; mimeType: string; size: number };

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("You are signed out. Please sign in again.");
  return { Authorization: `Bearer ${token}` };
}

async function readError(res: Response): Promise<string> {
  const body = (await res.json().catch(() => null)) as { error?: string } | null;
  return body?.error ?? `Upload failed (${res.status})`;
}

/** Upload any file, from any feature, to Cloudflare R2.
    `ownerId` lets an admin file an attachment under the student it belongs to. */
export async function uploadUserFile(
  file: File,
  opts: { folder: StorageFolder; ownerId?: string },
): Promise<StoredFile> {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", opts.folder);
  if (opts.ownerId) form.append("ownerId", opts.ownerId);

  const res = await fetch("/api/upload", { method: "POST", headers: await authHeader(), body: form });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as StoredFile;
}

/** Resolve a stored path to a short-lived viewable/downloadable URL. */
export async function fileUrl(path: string, download?: string, ttl?: number): Promise<string | null> {
  try {
    const res = await fetch("/api/file-url", {
      method: "POST",
      headers: { ...(await authHeader()), "Content-Type": "application/json" },
      body: JSON.stringify({ key: path.startsWith("r2:") ? path.slice(3) : path, download, ttl }),
    });
    if (!res.ok) return null;
    return ((await res.json()) as { url?: string }).url ?? null;
  } catch {
    return null;
  }
}

/** Opens a stored file in a new browser tab — the platform's one "Preview"
    action. No in-app viewer: every "Preview" button, on the admin side or
    the student's own, calls this same function, so opening a file behaves
    identically everywhere rather than each page rolling its own. */
export async function openFilePreview(path: string): Promise<void> {
  const url = await fileUrl(path);
  if (url) window.open(url, "_blank", "noopener,noreferrer");
}

/** Delete a stored file by its "r2:<key>" path (or raw key). */
export async function deleteUserFile(path: string): Promise<void> {
  const res = await fetch("/api/delete", {
    method: "POST",
    headers: { ...(await authHeader()), "Content-Type": "application/json" },
    body: JSON.stringify({ key: path.startsWith("r2:") ? path.slice(3) : path }),
  });
  if (!res.ok) throw new Error(await readError(res));
}
