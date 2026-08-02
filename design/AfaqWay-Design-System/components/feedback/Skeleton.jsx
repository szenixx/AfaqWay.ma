import React from "react";

/* AfaqWay Skeleton — the loading placeholder for text/avatar while content
   streams in. Shimmer matches the platform's existing dsSkel/afShimmer motion. */

export function Skeleton({ height = 12, width = "100%", circle, radius, style }) {
  return (
    <div
      className="af-skel"
      style={{
        height, width,
        borderRadius: circle ? "999px" : radius || "var(--radius-pill)",
        aspectRatio: circle ? "1 / 1" : undefined,
        ...style,
      }}
    />
  );
}
