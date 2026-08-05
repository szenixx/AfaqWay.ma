"use client";

/* TEMPORARY — see chatDebug.ts. Delete this file and its one call site in
   StudentChat.tsx once the white-flash cause is confirmed. */

import { useState } from "react";
import { DEBUG_FLAGS, toggleDebugFlag, useActiveDebugFlags, useDebugLog } from "@/lib/chatDebug";

export function ChatDebugOverlay() {
  const log = useDebugLog();
  const active = useActiveDebugFlags();
  const [showLog, setShowLog] = useState(false);
  const start = log[0]?.t ?? Date.now();

  return (
    <div
      style={{
        position: "fixed", left: 6, bottom: 6, zIndex: 9999,
        width: "min(360px, calc(100vw - 12px))",
        background: "rgba(10,14,26,.94)", color: "#8ff58f", font: "11px/15px ui-monospace, monospace",
        borderRadius: 10, pointerEvents: "auto", overflow: "hidden",
      }}
    >
      <div style={{ padding: "7px 9px", color: "#fff", fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>chat-debug</span>
        <button type="button" onClick={() => setShowLog((v) => !v)} style={{ background: "#333", color: "#fff", border: "none", borderRadius: 6, padding: "3px 8px", font: "inherit" }}>
          {showLog ? "hide log" : `log (${log.length})`}
        </button>
      </div>

      {/* Toggle exactly ONE of these at a time, then reproduce the flash.
          The one that stops it is the cause. */}
      <div style={{ padding: "2px 9px 8px", display: "flex", flexDirection: "column", gap: 6 }}>
        {DEBUG_FLAGS.map((f) => (
          <label key={f.key} style={{ display: "flex", alignItems: "center", gap: 8, color: active.has(f.key) ? "#ffd166" : "#cfe8cf" }}>
            <input
              type="checkbox"
              checked={active.has(f.key)}
              onChange={() => toggleDebugFlag(f.key)}
              style={{ width: 16, height: 16, flex: "none" }}
            />
            {f.label}
          </label>
        ))}
      </div>

      {showLog && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,.15)", padding: "6px 9px", maxHeight: "34vh", overflowY: "auto", whiteSpace: "pre-wrap" }}>
          {log.map((e, i) => (
            <div key={i}>+{((e.t - start) / 1000).toFixed(2)}s {e.msg}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ChatDebugOverlay;
