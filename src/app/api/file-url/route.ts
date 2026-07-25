import { NextResponse } from "next/server";
import { generatePublicUrl } from "@/services/storage.service";
import { assertCanAccess, requireCaller } from "@/lib/storage/auth";
import { storageErrorResponse } from "@/lib/storage/respond";
import { StorageError } from "@/types/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* POST /api/file-url — { key, download?, ttl? }
   Returns a short-lived signed URL so the browser can view or download an
   object without ever seeing R2 credentials. */
export async function POST(req: Request) {
  try {
    const caller = await requireCaller(req);
    const body = (await req.json().catch(() => null)) as { key?: unknown; download?: unknown; ttl?: unknown } | null;
    const key = typeof body?.key === "string" ? body.key : "";
    if (!key) throw new StorageError("invalid_file", "A file key is required.", 400);

    assertCanAccess(caller, key);
    const url = await generatePublicUrl(key, {
      download: typeof body?.download === "string" ? body.download : undefined,
      ttl: typeof body?.ttl === "number" ? body.ttl : undefined,
    });
    return NextResponse.json({ url, key });
  } catch (err) {
    return storageErrorResponse(err);
  }
}
