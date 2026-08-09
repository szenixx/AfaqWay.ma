"use client";

/* TEMPORARY. See src/lib/perfDebug.ts for the full explanation — delete both
   files and this component's mount point once the mobile-lag culprit is
   found and permanently fixed in CSS/components, not left toggled off here. */

import { Fragment, useState } from "react";
import { Activity, X } from "lucide-react";
import {
  PERF_FLAGS, togglePerfFlag, setAllPerfFlags, useActivePerfFlags, useApplyPerfFlags,
} from "@/lib/perfDebug";

const GROUP_ORDER = ["Background", "Navigation", "Loading", "Journey", "Right panel", "Explore", "Chat", "Misc"];

export function PerfDebugPanel() {
  useApplyPerfFlags();
  const active = useActivePerfFlags();
  const [open, setOpen] = useState(false);
  const allOn = active.size === PERF_FLAGS.length;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Performance debug panel"
        style={{
          position: "fixed", left: 12, bottom: 12, zIndex: 99998,
          width: 40, height: 40, borderRadius: 999, border: "none", cursor: "pointer",
          background: active.size > 0 ? "#B23B27" : "#162E8C", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 20px rgba(0,0,0,.3)",
        }}
      >
        <Activity size={18} />
        {active.size > 0 && (
          <span style={{
            position: "absolute", top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 999,
            background: "#fff", color: "#B23B27", font: "700 10px/16px sans-serif", textAlign: "center",
          }}>{active.size}</span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 99999, background: "rgba(0,0,0,.55)",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 480, maxHeight: "82vh", overflowY: "auto",
              background: "#fff", borderRadius: "18px 18px 0 0", padding: "14px 14px 24px",
              font: "400 13px/1.4 -apple-system,system-ui,sans-serif", color: "#17233A",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <b style={{ font: "700 15px/20px sans-serif" }}>Mobile lag debug</b>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" style={{ border: "none", background: "none", cursor: "pointer", padding: 4 }}>
                <X size={20} />
              </button>
            </div>
            <p style={{ margin: "0 0 10px", color: "#5A6B85" }}>
              Check a box to turn that effect off right now, no reload needed. Navigate around and feel for the lag.
              Whichever box, once checked, makes it smooth again — that's the cause. Uncheck to restore it.
            </p>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <button type="button" onClick={() => setAllPerfFlags(!allOn)} style={{
                flex: 1, padding: "9px 12px", borderRadius: 10, border: "1px solid #E8E9ED",
                background: allOn ? "#B23B27" : "#F7F8F9", color: allOn ? "#fff" : "#17233A",
                font: "600 12.5px/1 sans-serif", cursor: "pointer",
              }}>
                {allOn ? "Turn everything back on" : "Turn OFF everything (quick check)"}
              </button>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {GROUP_ORDER.map((group) => (
                  <Fragment key={group}>
                    <tr>
                      <td colSpan={2} style={{ padding: "10px 0 4px", font: "700 10.5px/14px sans-serif", letterSpacing: ".04em", textTransform: "uppercase", color: "#8695AB" }}>{group}</td>
                    </tr>
                    {PERF_FLAGS.filter((f) => f.group === group).map((f) => {
                      const on = active.has(f.id);
                      return (
                        <tr key={f.id} style={{ borderTop: "1px solid #EFF0F2" }}>
                          <td style={{ padding: "8px 8px 8px 0", width: 34, verticalAlign: "top" }}>
                            <input
                              type="checkbox" checked={on}
                              onChange={() => togglePerfFlag(f.id)}
                              style={{ width: 20, height: 20 }}
                            />
                          </td>
                          <td style={{ padding: "8px 0" }}>
                            <div style={{ font: "600 13px/17px sans-serif", color: on ? "#B23B27" : "#17233A" }}>{f.label}</div>
                            <div style={{ font: "400 11.5px/16px sans-serif", color: "#8695AB", marginTop: 1 }}>{f.note}</div>
                          </td>
                        </tr>
                      );
                    })}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

export default PerfDebugPanel;
