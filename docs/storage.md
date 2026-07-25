# Storage — Cloudflare R2

Every file uploaded anywhere on the platform is stored in Cloudflare R2. Nothing
is written to the project, to the server's disk, or (for new uploads) to Supabase
storage. There is exactly one upload path.

## Layers

| File | Role |
| --- | --- |
| `src/lib/r2.ts` | Server-only R2 client (AWS SDK v3, S3-compatible). Reads credentials from env, never exposes them. |
| `src/services/storage.service.ts` | The upload gateway: `uploadFile`, `deleteFile`, `deleteFiles`, `getFile`, `listFiles`, `generatePublicUrl`, `generateUniqueFilename`. |
| `src/lib/storage/validation.ts` | Allowed types, per-folder size caps, MIME/extension checks. |
| `src/lib/storage/auth.ts` | Verifies the caller's Supabase token, resolves owner, enforces prefix access. |
| `src/lib/storage/client.ts` | The only thing browser code imports: `uploadUserFile`, `fileUrl`, `deleteUserFile`. |
| `src/types/storage.ts` | Shared types, folder list, `StorageError`. |

## API routes (Node runtime, always dynamic)

| Route | Body | Returns |
| --- | --- | --- |
| `POST /api/upload` | multipart: `file`, `folder`, optional `ownerId` (admins only) | `{ path, key, fileName, mimeType, size }` |
| `POST /api/file-url` | `{ key, download?, ttl? }` | `{ url }` — signed, 60s–7d |
| `POST /api/delete` | `{ key }` | `{ ok: true, key }` |

All three require an `Authorization: Bearer <supabase access token>` header.
Credentials never leave the server; the browser never signs anything.

## Keys and folders

```
users/<ownerId>/<folder>/<uuid>.<ext>
```

The original filename is never used as a key (it is kept as object metadata and
in the database for display). Folders are the `STORAGE_FOLDERS` list in
`src/types/storage.ts`: avatars, payments, receipts, documents, applications,
certificates, cv, transcripts, chat, blogs, learning, reports, exports, imports,
admin, temp. Add a folder there and it works everywhere immediately.

## Access control

- A user may read/delete only objects under `users/<their id>/`.
- Admins (non-banned row in `admins`) may read/delete anything under `users/`,
  and may upload on behalf of a student via `ownerId` (used when an admin sends
  a chat attachment, so the student can read it back).

## Database

Rows store `r2:<key>` in their path column, plus file name / MIME / size where
relevant. Bytes are never stored in Postgres. Rows written before the migration
hold a bare Supabase path; `fileUrl` still resolves those, so old files keep
working.

## Adding an upload to a new feature

```ts
import { uploadUserFile, fileUrl } from "@/lib/storage/client";

const stored = await uploadUserFile(file, { folder: "documents" });
// save stored.path / stored.fileName / stored.mimeType / stored.size
const url = await fileUrl(stored.path, "documents"); // short-lived view URL
```

No new upload logic, no new route, no new bucket.

## Environment

`.env.local` (server-only, git-ignored — never prefix these with `NEXT_PUBLIC_`):

```
R2_ACCOUNT_ID=…
R2_BUCKET_NAME=afaqway-storage
R2_ACCESS_KEY_ID=…
R2_SECRET_ACCESS_KEY=…
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
```

The same four values must be set in the hosting provider (Vercel) for
production. `R2_ENDPOINT` is optional: it is derived from the account id when
absent or malformed.

## Legacy

`supabase/functions/storage-sign` (presigned-URL edge function) is no longer used
by the app — uploads and signed reads now go through the API routes above. It is
left deployed only so any older client build keeps working, and can be removed
once none are in circulation.
