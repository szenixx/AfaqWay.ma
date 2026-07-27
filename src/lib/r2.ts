import "server-only";
import { S3Client } from "@aws-sdk/client-s3";
import { StorageError } from "@/types/storage";
import { syncClock } from "@/lib/r2Clock";

/* Cloudflare R2 client (S3-compatible, AWS SDK v3).
   Server-only: these credentials must never reach the browser. Every upload,
   delete and signed read on the platform goes through this one client.
   Browser code uses `@/lib/storage/client` instead. */

export type R2Config = {
  accountId: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
};

let cachedClient: S3Client | null = null;
let cachedConfig: R2Config | null = null;

const env = (name: string): string => (process.env[name] ?? "").trim();

/** Reads and validates R2 config from the environment. Throws a typed error
    (never a raw stack, never the credential values) when something is missing. */
export function getR2Config(): R2Config {
  if (cachedConfig) return cachedConfig;

  const accountId = env("R2_ACCOUNT_ID");
  const bucket = env("R2_BUCKET_NAME") || env("R2_BUCKET");
  const accessKeyId = env("R2_ACCESS_KEY_ID");
  const secretAccessKey = env("R2_SECRET_ACCESS_KEY");

  // The endpoint is always derivable from the account id; an explicit
  // R2_ENDPOINT only wins when it is a well-formed https origin.
  const raw = env("R2_ENDPOINT");
  const endpoint = /^https:\/\/[^/\s:]+$/.test(raw) ? raw : `https://${accountId}.r2.cloudflarestorage.com`;

  const missing = (
    [
      ["R2_ACCOUNT_ID", accountId],
      ["R2_BUCKET_NAME", bucket],
      ["R2_ACCESS_KEY_ID", accessKeyId],
      ["R2_SECRET_ACCESS_KEY", secretAccessKey],
    ] as const
  ).filter(([, v]) => !v).map(([k]) => k);

  if (missing.length) throw new StorageError("not_configured", `Missing R2 configuration: ${missing.join(", ")}`, 500);

  cachedConfig = { accountId, bucket, accessKeyId, secretAccessKey, endpoint };
  return cachedConfig;
}

/** The shared R2 client, built once per server process. */
export function getR2Client(): S3Client {
  if (!cachedClient) {
    const cfg = getR2Config();
    cachedClient = new S3Client({
      region: "auto",
      endpoint: cfg.endpoint,
      credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
    });
  }
  return cachedClient;
}

/**
 * The client with its signing clock corrected against the service.
 *
 * Use this for anything that signs: uploads, deletes and presigned URLs. A
 * machine whose clock drifts more than 15 minutes otherwise produces
 * signatures the service rejects with RequestTimeTooSkewed, and for presigned
 * URLs the failure only appears when the link is opened.
 */
export async function getSyncedR2Client(): Promise<S3Client> {
  const client = getR2Client();
  await syncClock(client, getR2Config().endpoint);
  return client;
}

export function getR2Bucket(): string {
  return getR2Config().bucket;
}
