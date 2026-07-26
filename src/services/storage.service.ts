import "server-only";
import { randomUUID } from "node:crypto";
import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getR2Bucket, getR2Client } from "@/lib/r2";
import { resolveContentType, validateFile, extensionOf } from "@/lib/storage/validation";
import { StorageError, type ListedObject, type StorageFolder, type StoredFileMeta } from "@/types/storage";

/* The single upload gateway for the whole platform.
   Avatars, receipts, chat attachments, application documents, learning
   resources, blog media, admin exports and every future module call these
   functions — no feature ever talks to R2 directly. */

const DEFAULT_URL_TTL = 300; // 5 minutes
const MIN_URL_TTL = 60;
const MAX_URL_TTL = 604800; // 7 days — the SigV4 ceiling (used for emailed attachments)

/** Objects are filed as users/<ownerId>/<folder>/<uuid>.<ext> so that access
    control is a simple prefix check and filenames can never collide. */
export function generateUniqueFilename(originalName: string): string {
  const ext = extensionOf(originalName);
  return ext ? `${randomUUID()}.${ext}` : randomUUID();
}

export function buildObjectKey(ownerId: string, folder: StorageFolder, originalName: string): string {
  return `users/${ownerId}/${folder}/${generateUniqueFilename(originalName)}`;
}

export function ownerPrefix(ownerId: string): string {
  return `users/${ownerId}/`;
}

function fail(code: "upload_failed" | "delete_failed" | "not_found", action: string, err: unknown): never {
  console.error(`[storage] ${action} failed:`, err);
  const status = code === "not_found" ? 404 : 502;
  // The provider's own reason (AccessDenied, NoSuchBucket, InvalidAccessKeyId,
  // SignatureDoesNotMatch…) is what makes this diagnosable. It names no secret,
  // so it is safe to return and is far more useful than "try again".
  const e = err as { name?: string; Code?: string; message?: string; $metadata?: { httpStatusCode?: number } };
  const reason = e?.Code || e?.name || e?.message || "unknown error";
  const http = e?.$metadata?.httpStatusCode;
  throw new StorageError(code, `Storage ${action} failed: ${reason}${http ? ` (R2 HTTP ${http})` : ""}`, status);
}

/** Upload a file to R2 and return exactly what the database should store. */
export async function uploadFile(params: {
  file: File;
  folder: StorageFolder;
  ownerId: string;
}): Promise<StoredFileMeta> {
  const { file, folder, ownerId } = params;
  validateFile({ name: file.name, size: file.size, type: file.type }, folder);

  const key = buildObjectKey(ownerId, folder, file.name);
  const contentType = resolveContentType(file.name, file.type);

  // Node streams the request body from this buffer; the SDK sets Content-Length
  // from it, which R2 requires for a single PutObject.
  const body = new Uint8Array(await file.arrayBuffer());
  const put = () => getR2Client().send(
    new PutObjectCommand({
      Bucket: getR2Bucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
      ContentLength: body.byteLength,
      // Original name kept as metadata only; the key stays opaque.
      Metadata: { "original-name": encodeURIComponent(file.name), "owner-id": ownerId },
    }),
  );

  try {
    await put();
  } catch (first) {
    // One retry: a dropped connection or a transient 5xx should not cost the
    // student their payment submission.
    const status = (first as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode ?? 0;
    const transient = status === 0 || status >= 500;
    if (!transient) fail("upload_failed", "upload", first);
    try { await put(); } catch (second) { fail("upload_failed", "upload", second); }
  }

  return { path: `r2:${key}`, key, fileName: file.name, mimeType: contentType, size: file.size };
}

/** Short-lived signed URL for viewing or downloading an object. */
export async function generatePublicUrl(
  key: string,
  opts: { download?: string; ttl?: number } = {},
): Promise<string> {
  const ttl = Math.min(Math.max(Math.floor(opts.ttl ?? DEFAULT_URL_TTL), MIN_URL_TTL), MAX_URL_TTL);
  const command = new GetObjectCommand({
    Bucket: getR2Bucket(),
    Key: key,
    ...(opts.download
      ? { ResponseContentDisposition: `attachment; filename="${opts.download.replace(/[^\w.\- ]/g, "_")}"` }
      : {}),
  });
  return getSignedUrl(getR2Client(), command, { expiresIn: ttl });
}

/** Object metadata (size, type, last modified). Returns null when absent. */
export async function getFile(key: string): Promise<{ key: string; size: number; mimeType: string; lastModified: string | null } | null> {
  try {
    const head = await getR2Client().send(new HeadObjectCommand({ Bucket: getR2Bucket(), Key: key }));
    return {
      key,
      size: head.ContentLength ?? 0,
      mimeType: head.ContentType ?? "application/octet-stream",
      lastModified: head.LastModified?.toISOString() ?? null,
    };
  } catch (err) {
    const status = (err as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode;
    if (status === 404) return null;
    fail("not_found", "head", err);
  }
}

/** List objects under a prefix (e.g. one user's folder). */
export async function listFiles(prefix: string, limit = 100): Promise<ListedObject[]> {
  try {
    const out = await getR2Client().send(
      new ListObjectsV2Command({ Bucket: getR2Bucket(), Prefix: prefix, MaxKeys: Math.min(Math.max(limit, 1), 1000) }),
    );
    return (out.Contents ?? []).map((o) => ({
      key: o.Key ?? "",
      size: o.Size ?? 0,
      lastModified: o.LastModified?.toISOString() ?? null,
    }));
  } catch (err) {
    fail("not_found", "list", err);
  }
}

/** Delete one object. */
export async function deleteFile(key: string): Promise<void> {
  try {
    await getR2Client().send(new DeleteObjectCommand({ Bucket: getR2Bucket(), Key: key }));
  } catch (err) {
    fail("delete_failed", "delete", err);
  }
}

/** Delete many objects in one round-trip (cleanup jobs, account deletion). */
export async function deleteFiles(keys: string[]): Promise<void> {
  if (!keys.length) return;
  try {
    await getR2Client().send(
      new DeleteObjectsCommand({ Bucket: getR2Bucket(), Delete: { Objects: keys.map((Key) => ({ Key })) } }),
    );
  } catch (err) {
    fail("delete_failed", "bulk delete", err);
  }
}
