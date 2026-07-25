import "server-only";
import { NextResponse } from "next/server";
import { StorageError } from "@/types/storage";

/** One consistent error shape for every storage endpoint. Internal details are
    logged, never returned. */
export function storageErrorResponse(err: unknown): NextResponse {
  if (err instanceof StorageError) {
    if (err.status >= 500) console.error("[storage]", err.code, err.message);
    return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
  }
  console.error("[storage] unexpected error:", err);
  return NextResponse.json({ error: "Something went wrong. Please try again.", code: "internal" }, { status: 500 });
}
