/* Shared storage types. Every module that uploads a file speaks this vocabulary,
   so no feature ever needs its own upload shape. */

/** Top-level folders inside the R2 bucket. Add a new one here and it is
    immediately usable everywhere — no other change is needed. */
export const STORAGE_FOLDERS = [
  "avatars",
  "payments",
  "receipts",
  "documents",
  "applications",
  "certificates",
  "cv",
  "transcripts",
  "chat",
  "blogs",
  "learning",
  "reports",
  "exports",
  "imports",
  "admin",
  "temp",
] as const;

export type StorageFolder = (typeof STORAGE_FOLDERS)[number];

/** What the database stores about a file. The bytes always stay in R2. */
export type StoredFileMeta = {
  /** Application-level path: "r2:<key>". Legacy rows may hold a bare Supabase path. */
  path: string;
  /** Raw R2 object key. */
  key: string;
  /** Original filename, kept for display only — never used as the key. */
  fileName: string;
  mimeType: string;
  size: number;
};

export type UploadInput = {
  file: File;
  folder: StorageFolder;
  /** Owner the object is filed under (defaults to the caller). */
  ownerId: string;
};

export type ListedObject = {
  key: string;
  size: number;
  lastModified: string | null;
};

/** Consistent error surface for every storage failure. */
export class StorageError extends Error {
  constructor(
    public readonly code:
      | "not_configured"
      | "invalid_file"
      | "file_too_large"
      | "unsupported_type"
      | "upload_failed"
      | "delete_failed"
      | "not_found"
      | "forbidden",
    message: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = "StorageError";
  }
}
