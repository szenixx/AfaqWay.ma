import { StorageError, STORAGE_FOLDERS, type StorageFolder } from "@/types/storage";

/* File rules for every upload on the platform. To support a new file type,
   add one row to ALLOWED_TYPES — nothing else changes. */

type TypeRule = { ext: string; mime: string[] };

export const ALLOWED_TYPES: TypeRule[] = [
  // Images
  { ext: "png", mime: ["image/png"] },
  { ext: "jpg", mime: ["image/jpeg"] },
  { ext: "jpeg", mime: ["image/jpeg"] },
  { ext: "webp", mime: ["image/webp"] },
  { ext: "svg", mime: ["image/svg+xml"] },
  { ext: "gif", mime: ["image/gif"] },
  // Documents
  { ext: "pdf", mime: ["application/pdf"] },
  { ext: "doc", mime: ["application/msword"] },
  { ext: "docx", mime: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"] },
  { ext: "txt", mime: ["text/plain"] },
  { ext: "rtf", mime: ["application/rtf", "text/rtf"] },
  { ext: "odt", mime: ["application/vnd.oasis.opendocument.text"] },
  // Spreadsheets
  { ext: "xls", mime: ["application/vnd.ms-excel"] },
  { ext: "xlsx", mime: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"] },
  { ext: "csv", mime: ["text/csv", "application/csv"] },
  // Presentations
  { ext: "ppt", mime: ["application/vnd.ms-powerpoint"] },
  { ext: "pptx", mime: ["application/vnd.openxmlformats-officedocument.presentationml.presentation"] },
  // Archives
  { ext: "zip", mime: ["application/zip", "application/x-zip-compressed"] },
  { ext: "rar", mime: ["application/vnd.rar", "application/x-rar-compressed"] },
  { ext: "7z", mime: ["application/x-7z-compressed"] },
  // Video
  { ext: "mp4", mime: ["video/mp4"] },
  { ext: "mov", mime: ["video/quicktime"] },
  { ext: "webm", mime: ["video/webm"] },
  // Audio
  { ext: "mp3", mime: ["audio/mpeg", "audio/mp3"] },
  { ext: "wav", mime: ["audio/wav", "audio/x-wav"] },
  { ext: "ogg", mime: ["audio/ogg", "application/ogg"] },
];

/** Per-folder size ceilings, in bytes. Anything not listed uses DEFAULT.
    Student-facing uploads are capped at 4 MB: it keeps scans reasonable and
    matches the limit shown in the upload dialogs. */
const MB = 1024 * 1024;
export const DEFAULT_MAX_SIZE_MB = 4;
const DEFAULT_MAX_SIZE = DEFAULT_MAX_SIZE_MB * MB;
const MAX_SIZE_BY_FOLDER: Partial<Record<StorageFolder, number>> = {
  avatars: 4 * MB,
  receipts: 4 * MB,
  payments: 4 * MB,
  documents: 4 * MB,
  chat: 50 * MB,
  learning: 500 * MB,
  exports: 200 * MB,
  imports: 200 * MB,
};

export function maxSizeFor(folder: StorageFolder): number {
  return MAX_SIZE_BY_FOLDER[folder] ?? DEFAULT_MAX_SIZE;
}

export function isStorageFolder(value: unknown): value is StorageFolder {
  return typeof value === "string" && (STORAGE_FOLDERS as readonly string[]).includes(value);
}

export function extensionOf(fileName: string): string {
  const i = fileName.lastIndexOf(".");
  return i > 0 ? fileName.slice(i + 1).toLowerCase() : "";
}

/** Validates size, extension and MIME type. Throws a typed StorageError. */
export function validateFile(input: { name: string; size: number; type: string }, folder: StorageFolder): void {
  if (!input.name || input.size <= 0) throw new StorageError("invalid_file", "The file is empty or has no name.");

  const limit = maxSizeFor(folder);
  if (input.size > limit) {
    throw new StorageError("file_too_large", `File is larger than ${Math.round(limit / MB)} MB.`, 413);
  }

  const ext = extensionOf(input.name);
  const rule = ALLOWED_TYPES.find((r) => r.ext === ext);
  if (!rule) throw new StorageError("unsupported_type", `".${ext || "?"}" files are not allowed.`, 415);

  // Browsers sometimes send an empty or generic MIME type; the extension rule
  // already constrains the file, so only a *conflicting* MIME type is rejected.
  const mime = (input.type || "").toLowerCase();
  if (mime && mime !== "application/octet-stream" && !rule.mime.includes(mime)) {
    throw new StorageError("unsupported_type", `File type "${mime}" does not match ".${ext}".`, 415);
  }
}

/** Best-known MIME type for a file, falling back to its extension rule. */
export function resolveContentType(fileName: string, given: string): string {
  const mime = (given || "").toLowerCase();
  if (mime && mime !== "application/octet-stream") return mime;
  return ALLOWED_TYPES.find((r) => r.ext === extensionOf(fileName))?.mime[0] ?? "application/octet-stream";
}
