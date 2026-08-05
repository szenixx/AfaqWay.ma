"use client";

/* TEMPORARY — see chatDebug.ts. Delete this file and its one call site in
   StudentChat.tsx once the white-flash cause is confirmed. */

import { useDebugLog } from "@/lib/chatDebug";

export function ChatDebugOverlay() {
  const log = useDebugLog();
  const start = log[0]?.t ?? Date.now();
  return (
    <div
      style={{
        position: "fixed", left: 6, bottom: 6, zIndex: 9999,
        width: "min(360px, calc(100vw - 12px))", maxHeight: "40vh", overflowY: "auto",
        background: "rgba(10,14,26,.92)", color: "#8ff58f", font: "10px/14px ui-monospace, monospace",
        padding: "6px 8px", borderRadius: 8, pointerEvents: "auto", whiteSpace: "pre-wrap",
      }}
    >
      <div style={{ color: "#fff", fontWeight: 700, marginBottom: 2 }}>chat-debug ({log.length})</div>
      {log.map((e, i) => (
        <div key={i}>+{((e.t - start) / 1000).toFixed(2)}s {e.msg}</div>
      ))}
    </div>
  );
}

export default ChatDebugOverlay;
