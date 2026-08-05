"use client";

/* TEMPORARY — see chatDebug.ts. Delete this file and its one call site in
   StudentChat.tsx once the white-flash cause is confirmed. */

import { useState } from "react";
import { DEBUG_FLAGS, SCENARIOS, setScenario, toggleDebugFlag, useActiveDebugFlags, useDebugLog, type DebugFlagKey } from "@/lib/chatDebug";

const GROUPS = ["Scenario testing", "afGridCell breakdown", "Compositing interaction", "Other infinite animations", "Blanket (confirmatory only)"] as const;

export function ChatDebugOverlay() {
  const log = useDebugLog();
  const active = useActiveDebugFlags();
  const [showLog, setShowLog] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const start = log[0]?.t ?? Date.now();

  return (
    <div
      style={{
        position: "fixed", left: 6, bottom: 6, zIndex: 9999,
        width: "min(360px, calc(100vw - 12px))", maxHeight: "70vh", display: "flex", flexDirection: "column",
        background: "rgba(10,14,26,.94)", color: "#8ff58f", font: "11px/15px ui-monospace, monospace",
        borderRadius: 10, pointerEvents: "auto", overflow: "hidden",
      }}
    >
      <div style={{ padding: "7px 9px", color: "#fff", fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center", flex: "none" }}>
        <span>chat-debug</span>
        <span style={{ display: "flex", gap: 4 }}>
          <button type="button" onClick={() => setShowLog((v) => !v)} style={{ background: "#333", color: "#fff", border: "none", borderRadius: 6, padding: "3px 8px", font: "inherit" }}>
            {showLog ? "hide log" : `log (${log.length})`}
          </button>
          <button type="button" onClick={() => setCollapsed((v) => !v)} style={{ background: "#333", color: "#fff", border: "none", borderRadius: 6, padding: "3px 8px", font: "inherit" }}>
            {collapsed ? "expand" : "collapse"}
          </button>
        </span>
      </div>

      {!collapsed && (
        <div style={{ overflowY: "auto", flex: 1 }}>
          {/* One-tap scenario presets: A = chatmark ON + statusping OFF,
              B = chatmark OFF + statusping ON, C = both ON, D = both OFF. */}
          <div style={{ padding: "0 9px 8px", display: "flex", gap: 6 }}>
            {(Object.keys(SCENARIOS) as (keyof typeof SCENARIOS)[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScenario(s)}
                style={{ flex: 1, background: "#264d26", color: "#8ff58f", border: "1px solid #3a6b3a", borderRadius: 6, padding: "6px 0", font: "700 12px/1 ui-monospace, monospace", cursor: "pointer" }}
              >
                {s}
              </button>
            ))}
          </div>

          {GROUPS.map((group) => (
            <div key={group} style={{ padding: "2px 9px 8px" }}>
              <div style={{ color: "#7a8a9a", fontWeight: 700, marginBottom: 4 }}>{group}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {DEBUG_FLAGS.filter((f) => f.group === group).map((f) => (
                  <label key={f.key} style={{ display: "flex", alignItems: "center", gap: 8, color: active.has(f.key as DebugFlagKey) ? "#ffd166" : "#cfe8cf" }}>
                    <input
                      type="checkbox"
                      checked={active.has(f.key as DebugFlagKey)}
                      onChange={() => toggleDebugFlag(f.key as DebugFlagKey)}
                      style={{ width: 16, height: 16, flex: "none" }}
                    />
                    {f.label}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showLog && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,.15)", padding: "6px 9px", maxHeight: "34vh", overflowY: "auto", whiteSpace: "pre-wrap", flex: "none" }}>
          {log.map((e, i) => (
            <div key={i}>+{((e.t - start) / 1000).toFixed(2)}s {e.msg}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ChatDebugOverlay;
