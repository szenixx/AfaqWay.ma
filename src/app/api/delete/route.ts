import { NextResponse } from "next/server";
import { deleteFile } from "@/services/storage.service";
import { assertCanAccess, requireCaller } from "@/lib/storage/auth";
import { storageErrorResponse } from "@/lib/storage/respond";
import { StorageError } from "@/types/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* POST /api/delete — { key } — removes one object from R2. */
export async function POST(req: Request) {
  try {
    const caller = await requireCaller(req);
    const body = (await req.json().catch(() => null)) as { key?: unknown } | null;
    const key = typeof body?.key === "string" ? body.key : "";
    if (!key) throw new StorageError("invalid_file", "A file key is required.", 400);

    assertCanAccess(caller, key);
    await deleteFile(key);
    return NextResponse.json({ ok: true, key });
  } catch (err) {
    return storageErrorResponse(err);
  }
}
