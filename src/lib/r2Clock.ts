import "server-only";
import type { S3Client } from "@aws-sdk/client-s3";

/* Clock synchronisation for request signing.

   Every SigV4 signature carries a timestamp, and S3-compatible services reject
   anything more than 15 minutes from their own clock with RequestTimeTooSkewed.
   The AWS SDK corrects for this automatically, but only after a real request
   comes back with the error, and a presigned URL is generated locally without
   any request at all. So a machine with a drifting clock produces URLs that
   look fine and fail the moment they are opened.

   Rather than trusting the local clock, we ask the service what time it thinks
   it is and hand the difference to the SDK as `systemClockOffset`, which is the
   same field the SDK sets itself. The offset is measured once and refreshed
   periodically, so this costs one lightweight request every few minutes. */

const REFRESH_MS = 5 * 60 * 1000;
/** Below this, the local clock is fine and no correction is applied. */
const IGNORE_MS = 5_000;

let offsetMs = 0;
let checkedAt = 0;
let inFlight: Promise<number> | null = null;

/** Difference between the service's clock and ours, in milliseconds. */
export function currentOffset(): number {
  return offsetMs;
}

/**
 * The timestamp a signature should carry.
 *
 * Presigning never touches the network, so the SDK's own skew correction never
 * fires; the date has to be passed in explicitly or the URL is signed with the
 * wrong clock and fails on first use.
 */
export function signingDate(): Date {
  return new Date(Date.now() + offsetMs);
}

async function measure(endpoint: string): Promise<number> {
  try {
    /* Any response carries a Date header, and an unauthenticated request is
       rejected quickly without touching a bucket, which is all we need. */
    const started = Date.now();
    const res = await fetch(endpoint, { method: "HEAD", cache: "no-store" });
    const header = res.headers.get("date");
    if (!header) return offsetMs;

    const serverMs = Date.parse(header);
    if (Number.isNaN(serverMs)) return offsetMs;

    // Split the round trip so the offset is not skewed by network latency.
    const localMs = started + (Date.now() - started) / 2;
    const drift = serverMs - localMs;

    offsetMs = Math.abs(drift) < IGNORE_MS ? 0 : drift;
    checkedAt = Date.now();

    if (offsetMs !== 0) {
      const seconds = Math.abs(offsetMs / 1000).toFixed(0);
      console.warn(
        `[r2] system clock is ${seconds}s ${offsetMs < 0 ? "ahead of" : "behind"} the storage service; ` +
        "signing with the corrected time. Fix the host clock (NTP) to remove this.",
      );
    }
    return offsetMs;
  } catch {
    // Never let a clock probe break an upload; sign with what we have.
    return offsetMs;
  }
}

/**
 * Applies the measured offset to the client before it signs anything.
 * Cheap after the first call: the measurement is cached and refreshed on a
 * timer, and concurrent callers share one in-flight probe.
 */
export async function syncClock(client: S3Client, endpoint: string): Promise<void> {
  const stale = Date.now() - checkedAt > REFRESH_MS;
  if (stale) {
    inFlight = inFlight ?? measure(endpoint).finally(() => { inFlight = null; });
    await inFlight;
  }
  // The same field the SDK sets when it detects skew on a live request.
  client.config.systemClockOffset = offsetMs;
}
