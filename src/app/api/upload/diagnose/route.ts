import { NextResponse } from "next/server";
import { HeadBucketCommand } from "@aws-sdk/client-s3";
import { authenticate } from "@/lib/apiAuth";
import { storageErrorResponse } from "@/lib/storage/respond";
import { getR2Bucket, getR2Client, getR2Config } from "@/lib/r2";
import { StorageError } from "@/types/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* GET /api/upload/diagnose — admin-only storage health check.

   Answers "is R2 reachable from this deployment, and with which bucket?"
   without exposing a single secret: only which variables are present, the
   bucket and account id, and what R2 replies to a HeadBucket. This is what
   turns "Storage upload failed" into an actionable answer in production. */
export async function GET(req: Request) {
  try {
    const { caller } = await authenticate(req);
    if (!caller.isAdmin) throw new StorageError("forbidden", "forbidden", 403);

    const present = {
      R2_ACCOUNT_ID: !!process.env.R2_ACCOUNT_ID,
      R2_BUCKET_NAME: !!process.env.R2_BUCKET_NAME,
      R2_BUCKET_legacy: !!process.env.R2_BUCKET,
      R2_ACCESS_KEY_ID: !!process.env.R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY: !!process.env.R2_SECRET_ACCESS_KEY,
      R2_ENDPOINT: !!process.env.R2_ENDPOINT,
    };

    let config: { bucket: string; endpoint: string; accountId: string } | null = null;
    try {
      const c = getR2Config();
      config = { bucket: c.bucket, endpoint: c.endpoint, accountId: c.accountId };
    } catch (e) {
      return NextResponse.json({ ok: false, stage: "config", present, error: (e as Error).message }, { status: 200 });
    }

    // Can this deployment actually see the bucket with these credentials?
    try {
      await getR2Client().send(new HeadBucketCommand({ Bucket: getR2Bucket() }));
    } catch (e) {
      const err = e as { name?: string; Code?: string; message?: string; $metadata?: { httpStatusCode?: number } };
      return NextResponse.json({
        ok: false, stage: "bucket", present, config,
        error: err.Code || err.name || err.message, httpStatus: err.$metadata?.httpStatusCode,
        hint: "AccessDenied → the API token has no access to this bucket. NoSuchBucket → R2_BUCKET_NAME points at a bucket that does not exist. InvalidAccessKeyId / SignatureDoesNotMatch → wrong key pair.",
      }, { status: 200 });
    }

    return NextResponse.json({ ok: true, stage: "ready", present, config });
  } catch (err) {
    return storageErrorResponse(err);
  }
}
