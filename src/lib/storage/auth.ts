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

/** A user may only touch objects under their own prefix; admins may touch any
    object under the users/ tree (they review documents and receipts). */
export function assertCanAccess(caller: Caller, key: string): void {
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
