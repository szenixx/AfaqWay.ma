import { NextResponse } from "next/server";
import { uploadFile } from "@/services/storage.service";
import { requireCaller, resolveOwner } from "@/lib/storage/auth";
import { storageErrorResponse } from "@/lib/storage/respond";
import { isStorageFolder } from "@/lib/storage/validation";
import { StorageError } from "@/types/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* POST /api/upload — multipart/form-data { file, folder, ownerId? }
   The single upload endpoint for the whole platform. Credentials stay here. */
export async function POST(req: Request) {
  try {
    const caller = await requireCaller(req);

    const form = await req.formData().catch(() => null);
    if (!form) throw new StorageError("invalid_file", "Expected multipart/form-data.", 400);

    const file = form.get("file");
    if (!(file instanceof File)) throw new StorageError("invalid_file", "No file was provided.", 400);

    const folder = form.get("folder");
    if (!isStorageFolder(folder)) throw new StorageError("invalid_file", "Unknown upload folder.", 400);

    const ownerId = resolveOwner(caller, typeof form.get("ownerId") === "string" ? String(form.get("ownerId")) : null);

    const stored = await uploadFile({ file, folder, ownerId });
    return NextResponse.json(stored, { status: 201 });
  } catch (err) {
    return storageErrorResponse(err);
  }
}
