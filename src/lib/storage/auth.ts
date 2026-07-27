import "server-only";
import { StorageError } from "@/types/storage";
import { ownerPrefix } from "@/services/storage.service";
import { authenticate, type Caller } from "@/lib/apiAuth";

/* Access rules for the storage API routes. Authentication itself is shared
   with every other API route (see @/lib/apiAuth). */

export type { Caller };

/** Verifies the Authorization header. Throws 401 when it is missing/invalid. */
export async function requireCaller(req: Request): Promise<Caller> {
  const { caller } = await authenticate(req);
  return caller;
}

/**
 * Rejects a key that is not a plain, forward-only object path.
 *
 * Ownership is decided by a prefix match, and a prefix match is only meaningful
 * on a key that cannot climb out of its own prefix: "users/<me>/../../x" starts
 * with the caller's prefix yet names something outside it. R2 treats keys as
 * literal strings so this is not exploitable on its own, but the check must not
 * depend on that.
 */
function assertSafeKey(key: string): void {
  const bad =
    !key
    || key.length > 1024
    || key.startsWith("/")
    || key.includes("..")
    || key.includes("\\")
    || key.includes("//")
    // Control characters have no place in an object key.
    || /[\u0000-\u001f\u007f]/.test(key);
  if (bad) throw new StorageError("invalid_file", "Invalid object key.", 400);
}

/** A user may only touch objects under their own prefix; admins may touch any
    object under the users/ tree (they review documents and receipts). */
export function assertCanAccess(caller: Caller, key: string): void {
  assertSafeKey(key);
  if (key.startsWith(ownerPrefix(caller.id))) return;
  if (caller.isAdmin && key.startsWith("users/")) return;
  throw new StorageError("forbidden", "forbidden", 403);
}

/** Resolves which user an upload is filed under. Only admins may file an
    object under someone else (e.g. an attachment sent to a student). */
export function resolveOwner(caller: Caller, requested: string | null): string {
  if (!requested || requested === caller.id) return caller.id;
  if (!caller.isAdmin) throw new StorageError("forbidden", "forbidden", 403);
  if (!/^[0-9a-f-]{36}$/i.test(requested)) throw new StorageError("invalid_file", "Invalid ownerId.", 400);
  return requested;
}
