/* @ds-bundle: {"format":4,"namespace":"AfaqWayDesignSystem_898d90","components":[{"name":"BubbleGroup","sourcePath":"components/communication/Bubble.jsx"},{"name":"Bubble","sourcePath":"components/communication/Bubble.jsx"},{"name":"BubbleContent","sourcePath":"components/communication/Bubble.jsx"},{"name":"BubbleReactions","sourcePath":"components/communication/Bubble.jsx"},{"name":"MessageGroup","sourcePath":"components/communication/Message.jsx"},{"name":"Message","sourcePath":"components/communication/Message.jsx"},{"name":"MessageAvatar","sourcePath":"components/communication/Message.jsx"},{"name":"MessageContent","sourcePath":"components/communication/Message.jsx"},{"name":"MessageHeader","sourcePath":"components/communication/Message.jsx"},{"name":"MessageFooter","sourcePath":"components/communication/Message.jsx"},{"name":"BentoGrid","sourcePath":"components/core/BentoGrid.jsx"},{"name":"BentoCard","sourcePath":"components/core/BentoGrid.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"FeatureCard","sourcePath":"components/core/Cards.jsx"},{"name":"InfoCard","sourcePath":"components/core/Cards.jsx"},{"name":"CompactCard","sourcePath":"components/core/Cards.jsx"},{"name":"StatCard","sourcePath":"components/core/Cards.jsx"},{"name":"Cards","sourcePath":"components/core/Cards.jsx"},{"name":"ActionCard","sourcePath":"components/core/Cards.jsx"},{"name":"Divider","sourcePath":"components/core/Divider.jsx"},{"name":"Loader","sourcePath":"components/core/Loader.jsx"},{"name":"Pill","sourcePath":"components/core/Pill.jsx"},{"name":"Status","sourcePath":"components/core/Status.jsx"},{"name":"Accordion","sourcePath":"components/feedback/Accordion.jsx"},{"name":"AlertDialog","sourcePath":"components/feedback/AlertDialog.jsx"},{"name":"AlertDialogMedia","sourcePath":"components/feedback/AlertDialog.jsx"},{"name":"AlertDialogHeader","sourcePath":"components/feedback/AlertDialog.jsx"},{"name":"AlertDialogTitle","sourcePath":"components/feedback/AlertDialog.jsx"},{"name":"AlertDialogDescription","sourcePath":"components/feedback/AlertDialog.jsx"},{"name":"AlertDialogFooter","sourcePath":"components/feedback/AlertDialog.jsx"},{"name":"AlertDialogAction","sourcePath":"components/feedback/AlertDialog.jsx"},{"name":"AlertDialogCancel","sourcePath":"components/feedback/AlertDialog.jsx"},{"name":"Dialog","sourcePath":"components/feedback/Dialog.jsx"},{"name":"DialogHeader","sourcePath":"components/feedback/Dialog.jsx"},{"name":"DialogTitle","sourcePath":"components/feedback/Dialog.jsx"},{"name":"DialogDescription","sourcePath":"components/feedback/Dialog.jsx"},{"name":"DialogFooter","sourcePath":"components/feedback/Dialog.jsx"},{"name":"DialogClose","sourcePath":"components/feedback/Dialog.jsx"},{"name":"EmptyState","sourcePath":"components/feedback/EmptyState.jsx"},{"name":"GooeyStack","sourcePath":"components/feedback/GooeyStack.jsx"},{"name":"MetricCard","sourcePath":"components/feedback/MetricCard.jsx"},{"name":"MorphingDialog","sourcePath":"components/feedback/MorphingDialog.jsx"},{"name":"MorphingDialogTrigger","sourcePath":"components/feedback/MorphingDialog.jsx"},{"name":"MorphingDialogContent","sourcePath":"components/feedback/MorphingDialog.jsx"},{"name":"MorphingDialogClose","sourcePath":"components/feedback/MorphingDialog.jsx"},{"name":"Skeleton","sourcePath":"components/feedback/Skeleton.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Toaster","sourcePath":"components/feedback/Toast.jsx"},{"name":"Input","sourcePath":"components/forms/Controls.jsx"},{"name":"TextArea","sourcePath":"components/forms/Controls.jsx"},{"name":"Select","sourcePath":"components/forms/Controls.jsx"},{"name":"Toggle","sourcePath":"components/forms/Controls.jsx"},{"name":"Controls","sourcePath":"components/forms/Controls.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Controls.jsx"},{"name":"FloatingToolbar","sourcePath":"components/navigation/FloatingToolbar.jsx"},{"name":"MegaMenu","sourcePath":"components/navigation/MegaMenu.jsx"}],"sourceHashes":{"components/communication/Bubble.jsx":"8812121ad1d5","components/communication/Message.jsx":"211b1cba36ad","components/core/BentoGrid.jsx":"7f8483030f06","components/core/Button.jsx":"fc2bed42be35","components/core/Card.jsx":"001859f66098","components/core/Cards.jsx":"48870399ddeb","components/core/Divider.jsx":"989593c98be4","components/core/Loader.jsx":"5dde3cc4aa1f","components/core/Pill.jsx":"9f692020f4a3","components/core/Status.jsx":"d079c6f8d813","components/feedback/Accordion.jsx":"01830203680e","components/feedback/AlertDialog.jsx":"102ac83e6643","components/feedback/Dialog.jsx":"9ea5628c3918","components/feedback/EmptyState.jsx":"39155a02baa3","components/feedback/GooeyStack.jsx":"d57b00451e53","components/feedback/MetricCard.jsx":"03b3b367d47f","components/feedback/MorphingDialog.jsx":"b5a0b33cd641","components/feedback/Skeleton.jsx":"afee62df7749","components/feedback/Toast.jsx":"42b95e1051e2","components/forms/Controls.jsx":"9d7d9687ea95","components/navigation/FloatingToolbar.jsx":"ba9f6307bdf5","components/navigation/MegaMenu.jsx":"2cbd8a310cde","guidelines/doc-page.js":"371bab66f42d","ui_kits/workspace/afw-workspace.jsx":"7398ca896b7a"},"inlinedExternals":[],"unexposedExports":[{"name":"dismissToast","sourcePath":"components/feedback/Toast.jsx"},{"name":"toast","sourcePath":"components/feedback/Toast.jsx"}]} */

(() => {

const __ds_ns = (window.AfaqWayDesignSystem_898d90 = window.AfaqWayDesignSystem_898d90 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/communication/Bubble.jsx
try { (() => {
/* AfaqWay Bubble — the chat message bubble family (advisor ↔ student chat).
   BubbleGroup stacks a sender's consecutive messages; Bubble picks the tone;
   BubbleContent is the actual rounded-3xl fill; BubbleReactions is the small
   pill that overlaps the bubble's corner. Adapted from a shadcn-style Bubble
   primitive onto our own tokens (no Tailwind/cva at runtime). */

const VARIANT = {
  default: {
    background: "var(--indigo-600)",
    color: "#fff",
    border: "1px solid transparent"
  },
  secondary: {
    background: "var(--subtle)",
    color: "var(--ink)",
    border: "1px solid transparent"
  },
  muted: {
    background: "var(--grey-tint)",
    color: "var(--ink)",
    border: "1px solid transparent"
  },
  tinted: {
    background: "var(--indigo-tint)",
    color: "var(--ink)",
    border: "1px solid transparent"
  },
  outline: {
    background: "var(--card)",
    color: "var(--ink)",
    border: "1px solid var(--line)"
  },
  ghost: {
    background: "transparent",
    color: "var(--ink)",
    border: "none"
  },
  destructive: {
    background: "var(--red-tint)",
    color: "var(--red)",
    border: "1px solid transparent"
  }
};
function BubbleGroup({
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "bubble-group",
    style: style
  }, children);
}
function Bubble({
  variant = "default",
  align = "start",
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "bubble",
    "data-align": align,
    "data-variant": variant,
    style: {
      alignSelf: align === "end" ? "flex-end" : "flex-start",
      ...style
    }
  }, children);
}
function BubbleContent({
  variant = "default",
  children,
  style
}) {
  const v = VARIANT[variant] ?? VARIANT.default;
  const isGhost = variant === "ghost";
  return /*#__PURE__*/React.createElement("div", {
    className: "bubble-content",
    style: {
      background: v.background,
      color: v.color,
      border: v.border,
      padding: isGhost ? 0 : "10px 14px",
      borderRadius: isGhost ? 0 : "var(--radius-dialog)",
      ...style
    }
  }, children);
}
function BubbleReactions({
  side = "bottom",
  align = "end",
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "bubble-reactions",
    style: {
      [side === "top" ? "top" : "bottom"]: 0,
      transform: side === "top" ? "translateY(-70%)" : "translateY(70%)",
      [align === "start" ? "left" : "right"]: 12,
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { BubbleGroup, Bubble, BubbleContent, BubbleReactions });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/communication/Bubble.jsx", error: String((e && e.message) || e) }); }

// components/communication/Message.jsx
try { (() => {
/* AfaqWay Message — the row wrapper around <Bubble>: avatar, content column,
   and header/footer meta (sender name, timestamp, reactions). MessageGroup
   stacks consecutive messages from the same sender under one avatar. */

function MessageGroup({
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "msg-group",
    style: style
  }, children);
}
function Message({
  align = "start",
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "msg",
    "data-align": align,
    style: {
      flexDirection: align === "end" ? "row-reverse" : "row",
      ...style
    }
  }, children);
}
function MessageAvatar({
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "msg-avatar",
    style: style
  }, children);
}
function MessageContent({
  align = "start",
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "msg-content",
    "data-align": align,
    style: style
  }, children);
}
function MessageHeader({
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "msg-header",
    style: style
  }, children);
}
function MessageFooter({
  align = "start",
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "msg-footer",
    "data-align": align,
    style: {
      justifyContent: align === "end" ? "flex-end" : "flex-start",
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { MessageGroup, Message, MessageAvatar, MessageContent, MessageHeader, MessageFooter });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/communication/Message.jsx", error: String((e && e.message) || e) }); }

// components/core/BentoGrid.jsx
try { (() => {
/* AfaqWay BentoGrid/BentoCard — an asymmetric grid of white cards (icon tile in
   indigo tint, title, description) for dashboard highlight rows. colSpan/
   rowSpan let one card stretch across the grid. */

function BentoGrid({
  children,
  className = "",
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: `bento-grid ${className}`.trim(),
    style: style
  }, children);
}
function BentoCard({
  icon,
  title,
  description,
  colSpan = 1,
  rowSpan = 1,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "bento-card",
    style: {
      gridColumn: `span ${colSpan}`,
      gridRow: `span ${rowSpan}`,
      ...style
    }
  }, icon, /*#__PURE__*/React.createElement("div", {
    className: "bento-card-title"
  }, title), description && /*#__PURE__*/React.createElement("div", {
    className: "bento-card-desc"
  }, description));
}
Object.assign(__ds_scope, { BentoGrid, BentoCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/BentoGrid.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
const {
  useState
} = React;
/* AfaqWay Button — the one button (with JrButton, the only two on the platform).
   variant: primary · ghost · neutral · destructive. Radius is a full capsule.
   Ported from the codebase Button.tsx; the loading spinner is <Loader>. */
const FILLS = {
  primary: {
    bg: "var(--indigo-600)",
    hover: "var(--indigo-500)",
    press: "var(--indigo-700)",
    color: "#FFFFFF",
    border: "none"
  },
  ghost: {
    bg: "transparent",
    hover: "var(--indigo-100)",
    press: "var(--indigo-100)",
    color: "var(--indigo-600)",
    border: "1.5px solid var(--indigo-600)"
  },
  neutral: {
    bg: "var(--subtle)",
    hover: "#EBEEF4",
    press: "#E3E8F0",
    color: "var(--ink-soft)",
    border: "1px solid var(--line)"
  },
  destructive: {
    bg: "var(--red)",
    hover: "#C04834",
    press: "#9E3322",
    color: "#FFFFFF",
    border: "none"
  },
  /* Mantine-style "light" — tinted fill in the caller's own colour; press deepens the tint. */
  light: {
    bg: "color-mix(in srgb, var(--btn-color, var(--indigo-600)) 14%, transparent)",
    hover: "color-mix(in srgb, var(--btn-color, var(--indigo-600)) 20%, transparent)",
    press: "color-mix(in srgb, var(--btn-color, var(--indigo-600)) 30%, transparent)",
    color: "var(--btn-color, var(--indigo-600))",
    border: "none"
  }
};
function Spinner({
  size,
  onDark
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: `af-loader${onDark ? " on-dark" : ""}`,
    style: {
      width: size,
      height: size
    },
    role: "status",
    "aria-label": "Loading"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 800 800",
    "aria-hidden": true
  }, /*#__PURE__*/React.createElement("circle", {
    className: "af-loader-arc",
    cx: "400",
    cy: "400",
    r: "200",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round",
    strokeWidth: "50"
  })));
}
function Button({
  variant = "primary",
  size = "md",
  icon,
  disabled,
  loading,
  fullWidth,
  type = "button",
  children,
  onClick,
  color,
  style
}) {
  const [st, setSt] = useState(0); // 0 rest · 1 hover · 2 press
  const v = FILLS[variant] ?? FILLS.primary;
  const isDisabled = disabled || loading;
  return /*#__PURE__*/React.createElement("button", {
    type: type,
    onClick: onClick,
    disabled: isDisabled,
    onMouseEnter: () => setSt(1),
    onMouseLeave: () => setSt(0),
    onMouseDown: () => setSt(2),
    onMouseUp: () => setSt(1),
    style: {
      "--btn-color": color,
      font: `600 ${size === "lg" ? "15px" : "14px"}/20px var(--font-sans)`,
      height: size === "lg" ? 44 : 40,
      padding: "0 20px",
      borderRadius: variant === "light" ? "var(--radius-xl)" : "var(--radius-control)",
      background: st === 2 ? v.press : st === 1 ? v.hover : v.bg,
      color: v.color,
      border: v.border,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      cursor: isDisabled ? "not-allowed" : "pointer",
      opacity: isDisabled ? 0.5 : 1,
      transition: "background 120ms cubic-bezier(.4,0,.2,1), transform 120ms cubic-bezier(.4,0,.2,1)",
      transform: st === 2 && !isDisabled ? "scale(.97)" : "none",
      width: fullWidth ? "100%" : undefined,
      ...style
    }
  }, loading ? /*#__PURE__*/React.createElement(Spinner, {
    size: 16,
    onDark: variant === "primary" || variant === "destructive"
  }) : icon, children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
/* AfaqWay Card — the generic 28px floating surface. Hierarchy comes from
   elevation and whitespace, not borders. Hover lifts 3px. */

function Card({
  children,
  hover = true,
  style,
  className = "",
  onClick
}) {
  const base = {
    background: "var(--card)",
    border: "var(--card-border)",
    borderRadius: "var(--radius-card)",
    boxShadow: "var(--elev-2)",
    padding: 24,
    ...style
  };
  if (onClick) {
    return /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: onClick,
      className: `card ${className}`.trim(),
      style: {
        ...base,
        textAlign: "left",
        cursor: "pointer",
        font: "inherit",
        display: "block",
        width: "100%"
      }
    }, children);
  }
  return /*#__PURE__*/React.createElement("div", {
    className: `${hover ? "card" : ""} ${className}`.trim(),
    style: base
  }, children);
}
Object.assign(__ds_scope, { Card, __ds_default_components_core_Card_pwdrbg: Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Divider.jsx
try { (() => {
/* AfaqWay Divider — a hairline separator with an optional centred label. */

function Divider({
  label,
  style
}) {
  if (!label) {
    return /*#__PURE__*/React.createElement("hr", {
      style: {
        border: "none",
        borderTop: "1px solid var(--line-soft)",
        margin: 0,
        ...style
      }
    });
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      height: 1,
      background: "var(--line-soft)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "600 11px/14px var(--font-sans)",
      letterSpacing: ".06em",
      textTransform: "uppercase",
      color: "var(--ink-faint)",
      flex: "none"
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      height: 1,
      background: "var(--line-soft)"
    }
  }));
}
Object.assign(__ds_scope, { Divider, __ds_default_components_core_Divider_1n6763d: Divider });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Divider.jsx", error: String((e && e.message) || e) }); }

// components/core/Loader.jsx
try { (() => {
/* AfaqWay Loader — the one spinner. A swirling arc in the platform blue whose
   stroke grows and shrinks while the whole circle turns. Wordless; the label is
   for assistive tech only. Keyframes live in base.css. Ported from Loader.tsx. */

function Loader({
  size = 32,
  label = "Loading",
  block,
  onDark,
  className
}) {
  const spinner = /*#__PURE__*/React.createElement("span", {
    className: `af-loader${onDark ? " on-dark" : ""}${className ? " " + className : ""}`,
    style: {
      width: size,
      height: size
    },
    role: "status",
    "aria-live": "polite",
    "aria-label": label
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 800 800",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true,
    focusable: "false"
  }, /*#__PURE__*/React.createElement("circle", {
    className: "af-loader-arc",
    cx: "400",
    cy: "400",
    r: "200",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round",
    strokeWidth: "50"
  })));
  return block ? /*#__PURE__*/React.createElement("div", {
    className: "af-loader-block"
  }, spinner) : spinner;
}
Object.assign(__ds_scope, { Loader, __ds_default_components_core_Loader_bdpop5: Loader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Loader.jsx", error: String((e && e.message) || e) }); }

// components/core/Pill.jsx
try { (() => {
/* AfaqWay Pill — the one label / badge / tag / chip. Colour arrives from the
   five tone tokens; shape, rhythm and optional slots (icon, avatar, delta) live
   in .ds-pill. Ported from the codebase Pill.tsx. */

const TONE = {
  grey: {
    text: "var(--grey)",
    tint: "var(--grey-tint)",
    line: "var(--grey-line)"
  },
  indigo: {
    text: "var(--indigo-text)",
    tint: "var(--indigo-tint)",
    line: "var(--indigo-line)"
  },
  amber: {
    text: "var(--amber)",
    tint: "var(--amber-tint)",
    line: "var(--amber-line)"
  },
  red: {
    text: "var(--red)",
    tint: "var(--red-tint)",
    line: "var(--red-line)"
  },
  green: {
    text: "var(--green)",
    tint: "var(--green-tint)",
    line: "var(--green-line)"
  }
};
function Pill({
  children,
  tone = "grey",
  size = "md",
  icon,
  avatar,
  delta,
  deltaSuffix = "",
  ghost,
  onClick,
  title,
  className = "",
  style
}) {
  const t = TONE[tone] ?? TONE.grey;
  const interactive = Boolean(onClick);
  const base = {
    color: t.text,
    background: ghost ? "transparent" : t.tint,
    borderColor: ghost ? "transparent" : t.line,
    ...style
  };
  const inner = /*#__PURE__*/React.createElement(React.Fragment, null, avatar && /*#__PURE__*/React.createElement("span", {
    className: "ds-pill-avatar"
  }, avatar), icon && /*#__PURE__*/React.createElement("span", {
    className: "ds-pill-ico"
  }, icon), children != null && children !== "" && /*#__PURE__*/React.createElement("span", {
    className: "ds-pill-text"
  }, children), typeof delta === "number" && /*#__PURE__*/React.createElement("span", {
    className: `ds-pill-delta${delta < 0 ? " down" : delta > 0 ? " up" : ""}`
  }, delta > 0 ? "▲" : delta < 0 ? "▼" : "•", Math.abs(delta), deltaSuffix));
  const cls = `ds-pill ${size}${ghost ? " ghost" : ""}${interactive ? " act" : ""} ${className}`.trim();
  return interactive ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: cls,
    style: base,
    onClick: onClick,
    title: title
  }, inner) : /*#__PURE__*/React.createElement("span", {
    className: cls,
    style: base,
    title: title
  }, inner);
}
Object.assign(__ds_scope, { Pill });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Pill.jsx", error: String((e && e.message) || e) }); }

// components/core/Cards.jsx
try { (() => {
/* AfaqWay's five card roles. Everything that presents an item on any page is one
   of these — same radius, padding, hover and typography. Ported from Cards.tsx.
   Feature · Info · Compact · Stat · Action. */

/* Inline lucide-shaped glyphs so the file is self-contained. */
const IArrow = ({
  s = 15
}) => /*#__PURE__*/React.createElement("svg", {
  width: s,
  height: s,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M5 12h14M13 6l6 6-6 6"
}));
const IBookmark = ({
  s = 16,
  filled
}) => /*#__PURE__*/React.createElement("svg", {
  width: s,
  height: s,
  viewBox: "0 0 24 24",
  fill: filled ? "currentColor" : "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
}));
const ITrendUp = ({
  s = 13
}) => /*#__PURE__*/React.createElement("svg", {
  width: s,
  height: s,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M22 7l-8.5 8.5-5-5L2 17"
}), /*#__PURE__*/React.createElement("path", {
  d: "M16 7h6v6"
}));
const ITrendDown = ({
  s = 13
}) => /*#__PURE__*/React.createElement("svg", {
  width: s,
  height: s,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M22 17l-8.5-8.5-5 5L2 7"
}), /*#__PURE__*/React.createElement("path", {
  d: "M16 17h6v-6"
}));
const CARD = {
  background: "var(--card)",
  border: "1px solid var(--line)",
  borderRadius: "var(--radius-2xl)",
  boxShadow: "var(--shadow-card)",
  overflow: "hidden"
};
function FeatureCard({
  image,
  imageNode,
  badge,
  title,
  description,
  actionLabel,
  onAction,
  bookmarked,
  onBookmark,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "af-card af-card-feature",
    style: {
      ...CARD,
      display: "flex",
      flexDirection: "column",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      height: 156,
      background: "var(--indigo-tint)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, image ? /*#__PURE__*/React.createElement("img", {
    src: image,
    alt: "",
    style: {
      width: "100%",
      height: "100%",
      objectFit: "cover"
    }
  }) : imageNode, badge && /*#__PURE__*/React.createElement(__ds_scope.Pill, {
    tone: "indigo",
    style: {
      position: "absolute",
      top: 12,
      left: 12,
      background: "var(--card)"
    }
  }, badge), onBookmark && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onBookmark,
    "aria-label": bookmarked ? "Remove bookmark" : "Bookmark",
    "aria-pressed": bookmarked,
    style: {
      position: "absolute",
      top: 10,
      right: 10,
      width: 34,
      height: 34,
      borderRadius: 999,
      border: "1px solid var(--line)",
      background: "var(--card)",
      color: bookmarked ? "var(--indigo-600)" : "var(--ink-faint)",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(IBookmark, {
    filled: bookmarked
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 20,
      display: "flex",
      flexDirection: "column",
      gap: 6,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "700 17px/23px var(--font-sans)",
      color: "var(--ink)"
    }
  }, title), description && /*#__PURE__*/React.createElement("div", {
    style: {
      font: "400 13px/20px var(--font-sans)",
      color: "var(--ink-soft)"
    }
  }, description), actionLabel && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onAction,
    style: {
      marginTop: "auto",
      alignSelf: "flex-start",
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      height: 40,
      padding: "0 18px",
      borderRadius: "var(--radius-control)",
      border: "none",
      background: "var(--indigo-600)",
      color: "#fff",
      font: "600 13.5px/1 var(--font-sans)",
      cursor: "pointer"
    }
  }, actionLabel, /*#__PURE__*/React.createElement(IArrow, null))));
}
function InfoCard({
  thumbnail,
  title,
  supporting,
  meta,
  actionLabel,
  onAction,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "af-card af-card-info",
    style: {
      ...CARD,
      padding: 16,
      display: "flex",
      gap: 14,
      alignItems: "flex-start",
      ...style
    }
  }, thumbnail && /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "none",
      width: 52,
      height: 52,
      borderRadius: 14,
      background: "var(--indigo-tint)",
      color: "var(--indigo-600)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden"
    }
  }, thumbnail), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "700 15px/21px var(--font-sans)",
      color: "var(--ink)"
    }
  }, title), supporting && /*#__PURE__*/React.createElement("div", {
    style: {
      font: "400 12.5px/18px var(--font-sans)",
      color: "var(--ink-soft)",
      marginTop: 2
    }
  }, supporting), meta && meta.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: "4px 14px",
      marginTop: 8
    }
  }, meta.map(m => /*#__PURE__*/React.createElement("span", {
    key: m,
    style: {
      font: "500 11.5px/16px var(--font-sans)",
      color: "var(--ink-faint)"
    }
  }, m)))), actionLabel && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onAction,
    style: {
      flex: "none",
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      height: 36,
      padding: "0 14px",
      borderRadius: "var(--radius-control)",
      border: "1px solid var(--indigo-line)",
      background: "var(--indigo-tint)",
      color: "var(--indigo-text)",
      font: "600 12.5px/1 var(--font-sans)",
      cursor: "pointer"
    }
  }, actionLabel, /*#__PURE__*/React.createElement(IArrow, {
    s: 14
  })));
}
function CompactCard({
  icon,
  title,
  description,
  onClick,
  style
}) {
  const inner = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "none",
      width: 34,
      height: 34,
      borderRadius: 11,
      background: "var(--indigo-tint)",
      color: "var(--indigo-600)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, icon), /*#__PURE__*/React.createElement("span", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      font: "600 13px/18px var(--font-sans)",
      color: "var(--ink)"
    }
  }, title), description && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      font: "400 11.5px/16px var(--font-sans)",
      color: "var(--ink-soft)",
      marginTop: 1
    }
  }, description)));
  const st = {
    ...CARD,
    padding: 12,
    display: "flex",
    alignItems: "center",
    gap: 11,
    textAlign: "left",
    width: "100%",
    ...style
  };
  return onClick ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "af-card af-card-compact",
    onClick: onClick,
    style: {
      ...st,
      cursor: "pointer",
      font: "inherit"
    }
  }, inner) : /*#__PURE__*/React.createElement("div", {
    className: "af-card af-card-compact",
    style: st
  }, inner);
}
function StatCard({
  value,
  title,
  icon,
  accent = "var(--indigo-600)",
  trend,
  sub,
  style,
  className
}) {
  const trendColor = trend ? trend.up ? "var(--green)" : "var(--red)" : undefined;
  return /*#__PURE__*/React.createElement("div", {
    className: `af-card af-card-stat${className ? " " + className : ""}`,
    style: {
      ...(className ? null : CARD),
      padding: 16,
      borderTop: `3px solid ${accent}`,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "600 11.5px/15px var(--font-sans)",
      color: "var(--ink-soft)"
    }
  }, title), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 30,
      height: 30,
      borderRadius: 10,
      flex: "none",
      background: `color-mix(in srgb, ${accent} 14%, transparent)`,
      color: accent,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, icon)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 8,
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "800 24px/30px var(--font-sans)",
      color: "var(--ink)",
      letterSpacing: "-.3px"
    }
  }, value), trend && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 3,
      font: "600 11.5px/16px var(--font-sans)",
      color: trendColor
    }
  }, trend.up ? /*#__PURE__*/React.createElement(ITrendUp, null) : /*#__PURE__*/React.createElement(ITrendDown, null), trend.value)), sub && /*#__PURE__*/React.createElement("div", {
    style: {
      font: "400 11.5px/16px var(--font-sans)",
      color: "var(--ink-faint)",
      marginTop: 2
    }
  }, sub));
}
const Cards = {
  FeatureCard,
  InfoCard,
  CompactCard,
  StatCard,
  ActionCard
};
function ActionCard({
  icon,
  title,
  description,
  ctaLabel,
  onAction,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "af-card af-card-action",
    style: {
      ...CARD,
      padding: 18,
      display: "flex",
      flexDirection: "column",
      gap: 8,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 38,
      height: 38,
      borderRadius: 12,
      background: "var(--indigo-tint)",
      color: "var(--indigo-600)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, icon), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "700 14.5px/20px var(--font-sans)",
      color: "var(--ink)"
    }
  }, title), description && /*#__PURE__*/React.createElement("div", {
    style: {
      font: "400 12.5px/18px var(--font-sans)",
      color: "var(--ink-soft)"
    }
  }, description), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onAction,
    style: {
      marginTop: 4,
      alignSelf: "flex-start",
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      height: 38,
      padding: "0 16px",
      borderRadius: "var(--radius-control)",
      border: "none",
      background: "var(--indigo-600)",
      color: "#fff",
      font: "600 13px/1 var(--font-sans)",
      cursor: "pointer"
    }
  }, ctaLabel, /*#__PURE__*/React.createElement(IArrow, null)));
}
Object.assign(__ds_scope, { FeatureCard, InfoCard, CompactCard, StatCard, Cards, ActionCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Cards.jsx", error: String((e && e.message) || e) }); }

// components/core/Status.jsx
try { (() => {
/* AfaqWay Status — the one status vocabulary. 24 states → five tones. The word
   always renders (colour is never the only carrier). Ported from Status.tsx. */

const GREEN = {
  color: "var(--green)",
  tint: "var(--green-tint)",
  line: "var(--green-line)"
};
const AMBER = {
  color: "var(--amber)",
  tint: "var(--amber-tint)",
  line: "var(--amber-line)"
};
const RED = {
  color: "var(--red)",
  tint: "var(--red-tint)",
  line: "var(--red-line)"
};
const INDIGO = {
  color: "var(--indigo-text)",
  tint: "var(--indigo-tint)",
  line: "var(--indigo-line)"
};
const GREY = {
  color: "var(--grey)",
  tint: "var(--grey-tint)",
  line: "var(--grey-line)",
  text: "var(--ink-soft)"
};
const STATE = {
  success: {
    label: "Success",
    ...GREEN
  },
  error: {
    label: "Error",
    ...RED
  },
  warning: {
    label: "Warning",
    ...AMBER
  },
  info: {
    label: "Info",
    ...INDIGO
  },
  neutral: {
    label: "Neutral",
    ...GREY
  },
  online: {
    label: "Online",
    ...GREEN
  },
  offline: {
    label: "Offline",
    ...GREY
  },
  busy: {
    label: "Busy",
    ...RED
  },
  away: {
    label: "Away",
    ...AMBER
  },
  typing: {
    label: "Typing…",
    ...INDIGO
  },
  pending: {
    label: "Pending",
    ...AMBER
  },
  processing: {
    label: "Processing",
    ...INDIGO
  },
  waiting: {
    label: "Waiting",
    ...AMBER
  },
  submitted: {
    label: "Submitted",
    ...INDIGO
  },
  draft: {
    label: "Draft",
    ...GREY
  },
  completed: {
    label: "Completed",
    ...GREEN
  },
  approved: {
    label: "Approved",
    ...GREEN
  },
  rejected: {
    label: "Rejected",
    ...RED
  },
  cancelled: {
    label: "Cancelled",
    ...GREY
  },
  paid: {
    label: "Paid",
    ...GREEN
  },
  failed: {
    label: "Failed",
    ...RED
  },
  refunded: {
    label: "Refunded",
    ...INDIGO
  },
  read: {
    label: "Read",
    ...GREEN
  },
  delivered: {
    label: "Delivered",
    ...GREY
  }
};
const LIVE = {
  online: "ping",
  typing: "ping",
  processing: "pulse",
  pending: "pulse",
  waiting: "pulse",
  submitted: "pulse"
};
function Status({
  state,
  label,
  variant = "outline",
  size = "sm",
  dotOnly,
  pulse,
  ping,
  className = "",
  style
}) {
  const s = STATE[state] ?? STATE.neutral;
  const text = label ?? s.label;
  const wantsPing = ping ?? LIVE[state] === "ping";
  const wantsPulse = pulse ?? LIVE[state] === "pulse";
  const animate = wantsPing ? " ping" : wantsPulse ? " pulse" : "";
  const indicator = /*#__PURE__*/React.createElement("span", {
    className: `ds-status-dot${animate}`,
    style: {
      background: s.color,
      "--ds-status": s.color
    },
    "aria-hidden": true
  });
  if (dotOnly) {
    return /*#__PURE__*/React.createElement("span", {
      className: `ds-status dot-only ${className}`.trim(),
      style: style,
      role: "img",
      "aria-label": text
    }, indicator);
  }
  return /*#__PURE__*/React.createElement("span", {
    className: `ds-status ${variant} ${size} ${className}`.trim(),
    style: {
      color: s.text ?? s.color,
      ...(variant === "outline" ? {
        borderColor: s.line
      } : null),
      ...(variant === "soft" ? {
        background: s.tint,
        borderColor: "transparent"
      } : null),
      ...style
    }
  }, indicator, /*#__PURE__*/React.createElement("span", {
    className: "ds-status-label"
  }, text));
}
Object.assign(__ds_scope, { Status });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Status.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Accordion.jsx
try { (() => {
const {
  useState,
  useRef,
  useEffect
} = React;
/* AfaqWay Accordion — the platform's expander (FAQ, support). Height is measured
   then animated, returning to auto so long answers reflow. Collapsed panels are
   inert. Ported from Accordion.tsx. */
const IChevronDown = ({
  s = 17
}) => /*#__PURE__*/React.createElement("svg", {
  width: s,
  height: s,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M6 9l6 6 6-6"
}));
const IChevronUp = ({
  s = 17
}) => /*#__PURE__*/React.createElement("svg", {
  width: s,
  height: s,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M18 15l-6-6-6 6"
}));
function Row({
  item,
  open,
  onToggle
}) {
  const panel = useRef(null);
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    if (open) {
      setHeight(el.scrollHeight);
      const done = () => setHeight("auto");
      el.addEventListener("transitionend", done, {
        once: true
      });
      return () => el.removeEventListener("transitionend", done);
    }
    setHeight(el.scrollHeight);
    const frame = requestAnimationFrame(() => setHeight(0));
    return () => cancelAnimationFrame(frame);
  }, [open]);
  return /*#__PURE__*/React.createElement("div", {
    className: `acc-item${open ? " open" : ""}`
  }, /*#__PURE__*/React.createElement("h3", {
    className: "acc-h"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "acc-trigger",
    onClick: onToggle,
    "aria-expanded": open
  }, /*#__PURE__*/React.createElement("span", {
    className: "acc-q"
  }, item.question), /*#__PURE__*/React.createElement("span", {
    className: "acc-chev"
  }, open ? /*#__PURE__*/React.createElement(IChevronUp, null) : /*#__PURE__*/React.createElement(IChevronDown, null)))), /*#__PURE__*/React.createElement("div", {
    ref: panel,
    className: "acc-panel",
    role: "region",
    style: {
      height: height === "auto" ? "auto" : height
    },
    inert: !open ? "" : undefined
  }, /*#__PURE__*/React.createElement("div", {
    className: "acc-a"
  }, item.answer)));
}
function Accordion({
  items = [],
  defaultOpen = 0,
  multiple
}) {
  const [open, setOpen] = useState(defaultOpen >= 0 ? [defaultOpen] : []);
  const toggle = i => setOpen(cur => {
    if (cur.includes(i)) return cur.filter(n => n !== i);
    return multiple ? [...cur, i] : [i];
  });
  return /*#__PURE__*/React.createElement("div", {
    className: "acc"
  }, items.map((item, i) => /*#__PURE__*/React.createElement(Row, {
    key: item.id ?? i,
    item: item,
    open: open.includes(i),
    onToggle: () => toggle(i)
  })));
}
Object.assign(__ds_scope, { Accordion, __ds_default_components_feedback_Accordion_1up8z5s: Accordion });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Accordion.jsx", error: String((e && e.message) || e) }); }

// components/feedback/AlertDialog.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  createContext,
  useContext,
  useEffect
} = React;
/* AfaqWay AlertDialog — the platform's one dialog shell. Centred popup,
   backdrop blur, fade+zoom in/out, header (optional media + title +
   description) and a footer with Cancel/Action built on <Button>. Every
   confirmation, destructive-action and simple modal uses this. */

const Ctx = createContext(null);
function AlertDialog({
  open,
  onOpenChange,
  size = "default",
  children
}) {
  useEffect(() => {
    if (!open) return;
    const onEsc = e => {
      if (e.key === "Escape") onOpenChange && onOpenChange(false);
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onOpenChange]);
  if (!open) return null;
  return /*#__PURE__*/React.createElement(Ctx.Provider, {
    value: {
      close: () => onOpenChange && onOpenChange(false)
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "ad-overlay",
    onClick: () => onOpenChange && onOpenChange(false)
  }, /*#__PURE__*/React.createElement("div", {
    className: `ad-popup${size === "sm" ? " sm" : ""}`,
    role: "alertdialog",
    "aria-modal": "true",
    onClick: e => e.stopPropagation()
  }, children)));
}
function AlertDialogMedia({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "ad-media"
  }, children);
}
function AlertDialogHeader({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "ad-header"
  }, children);
}
function AlertDialogTitle({
  children
}) {
  return /*#__PURE__*/React.createElement("h2", {
    className: "ad-title"
  }, children);
}
function AlertDialogDescription({
  children
}) {
  return /*#__PURE__*/React.createElement("p", {
    className: "ad-desc"
  }, children);
}
function AlertDialogFooter({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "ad-footer"
  }, children);
}
function AlertDialogAction({
  children,
  onClick,
  variant = "primary",
  ...rest
}) {
  return /*#__PURE__*/React.createElement(__ds_scope.Button, _extends({
    variant: variant,
    onClick: onClick
  }, rest), children);
}
function AlertDialogCancel({
  children = "Cancel",
  onClick,
  variant = "neutral",
  ...rest
}) {
  const ctx = useContext(Ctx);
  return /*#__PURE__*/React.createElement(__ds_scope.Button, _extends({
    variant: variant,
    onClick: () => {
      onClick && onClick();
      ctx && ctx.close();
    }
  }, rest), children);
}
Object.assign(__ds_scope, { AlertDialog, AlertDialogMedia, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/AlertDialog.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Dialog.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  createContext,
  useContext,
  useEffect
} = React;
/* AfaqWay Dialog — the general-purpose modal (settings panels, forms, previews)
   alongside <AlertDialog> (confirmations/destructive actions). Same overlay +
   popup shell; adds a corner close (X) and a bordered, tinted footer bar. */

const Ctx = createContext(null);
const IX = ({
  s = 16
}) => /*#__PURE__*/React.createElement("svg", {
  width: s,
  height: s,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M18 6L6 18M6 6l12 12"
}));
function Dialog({
  open,
  onOpenChange,
  showCloseButton = true,
  size = "default",
  children
}) {
  useEffect(() => {
    if (!open) return;
    const onEsc = e => {
      if (e.key === "Escape") onOpenChange && onOpenChange(false);
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onOpenChange]);
  if (!open) return null;
  return /*#__PURE__*/React.createElement(Ctx.Provider, {
    value: {
      close: () => onOpenChange && onOpenChange(false)
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "ad-overlay",
    onClick: () => onOpenChange && onOpenChange(false)
  }, /*#__PURE__*/React.createElement("div", {
    className: `ad-popup dlg-popup${size === "sm" ? " sm" : ""}`,
    role: "dialog",
    "aria-modal": "true",
    onClick: e => e.stopPropagation()
  }, children, showCloseButton && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "dlg-close-x",
    "aria-label": "Close",
    onClick: () => onOpenChange && onOpenChange(false)
  }, /*#__PURE__*/React.createElement(IX, null)))));
}
function DialogHeader({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "dlg-header"
  }, children);
}
function DialogTitle({
  children
}) {
  return /*#__PURE__*/React.createElement("h2", {
    className: "dlg-title"
  }, children);
}
function DialogDescription({
  children
}) {
  return /*#__PURE__*/React.createElement("p", {
    className: "dlg-desc"
  }, children);
}
function DialogFooter({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "dlg-footer"
  }, children);
}
function DialogClose({
  children = "Close",
  onClick,
  variant = "neutral",
  ...rest
}) {
  const ctx = useContext(Ctx);
  return /*#__PURE__*/React.createElement(__ds_scope.Button, _extends({
    variant: variant,
    onClick: () => {
      onClick && onClick();
      ctx && ctx.close();
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/feedback/EmptyState.jsx
try { (() => {
/* AfaqWay EmptyState — icon + title + description + actions, for any empty
   frame (no documents, no results, no messages…). Icon is swappable per call
   site; never invent data — pair with real copy about what's missing. */

function Actions({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "es-actions"
  }, children);
}
function EmptyState({
  icon,
  title,
  description,
  size = "default",
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: `es${size === "sm" ? " sm" : ""}`
  }, icon && /*#__PURE__*/React.createElement("span", {
    className: "es-icon"
  }, icon), title && /*#__PURE__*/React.createElement("div", {
    className: "es-title"
  }, title), description && /*#__PURE__*/React.createElement("p", {
    className: "es-desc"
  }, description), children);
}
EmptyState.Actions = Actions;
Object.assign(__ds_scope, { EmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/EmptyState.jsx", error: String((e && e.message) || e) }); }

// components/feedback/GooeyStack.jsx
try { (() => {
const {
  Children
} = React;
/* AfaqWay GooeyStack — a collapsible notification stack: collapsed shows
   peeking card edges (gooey/melded look via overlap + scale falloff);
   expanded spreads items with `expandedGap`. Used atop the notification tray. */
function GooeyStack({
  children,
  collapsed = true,
  expandedGap = 18,
  radius = 22,
  style
}) {
  const items = Children.toArray(children);
  return /*#__PURE__*/React.createElement("div", {
    className: "gstack",
    style: {
      "--gstack-radius": `${radius}px`,
      ...style
    }
  }, items.map((child, i) => {
    const back = items.length - 1 - i;
    const collapsedStyle = {
      transform: `translateY(${back * 8}px) scale(${1 - back * 0.035})`,
      zIndex: items.length - i,
      opacity: back > 2 ? 0 : 1
    };
    const expandedStyle = {
      transform: "none",
      marginBottom: i === items.length - 1 ? 0 : expandedGap,
      zIndex: items.length - i,
      opacity: 1
    };
    return /*#__PURE__*/React.createElement("div", {
      key: child.key ?? i,
      className: "gstack-item",
      style: collapsed ? collapsedStyle : expandedStyle
    }, child);
  }));
}
Object.assign(__ds_scope, { GooeyStack });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/GooeyStack.jsx", error: String((e && e.message) || e) }); }

// components/feedback/MetricCard.jsx
try { (() => {
/* AfaqWay MetricCard — one card for every statistic on the platform: a pastel
   header with a white circular icon, an oversized outline watermark behind the
   content, big number, title, description and a trend badge. Only tone/icon/
   copy/data differ. Ported from the codebase .mc system. */

const ITrendUp = ({
  s = 12
}) => /*#__PURE__*/React.createElement("svg", {
  width: s,
  height: s,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2.2",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M22 7l-8.5 8.5-5-5L2 17"
}), /*#__PURE__*/React.createElement("path", {
  d: "M16 7h6v6"
}));
const ITrendDown = ({
  s = 12
}) => /*#__PURE__*/React.createElement("svg", {
  width: s,
  height: s,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2.2",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M22 17l-8.5-8.5-5 5L2 7"
}), /*#__PURE__*/React.createElement("path", {
  d: "M16 17h6v-6"
}));
function MetricCard({
  tone = "blue",
  icon,
  watermark,
  value,
  title,
  subtitle,
  badge,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: `mc mc-${tone}`,
    style: style
  }, /*#__PURE__*/React.createElement("div", {
    className: "mc-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mc-ico"
  }, icon)), watermark && /*#__PURE__*/React.createElement("span", {
    className: "mc-watermark"
  }, watermark), /*#__PURE__*/React.createElement("div", {
    className: "mc-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mc-value"
  }, value), /*#__PURE__*/React.createElement("div", {
    className: "mc-title"
  }, title), subtitle && /*#__PURE__*/React.createElement("p", {
    className: "mc-sub"
  }, subtitle), badge && /*#__PURE__*/React.createElement("div", {
    className: "mc-foot"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mc-badge"
  }, badge.up != null && (badge.up ? /*#__PURE__*/React.createElement(ITrendUp, null) : /*#__PURE__*/React.createElement(ITrendDown, null)), badge.label))));
}
Object.assign(__ds_scope, { MetricCard, __ds_default_components_feedback_MetricCard_16d89e4: MetricCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/MetricCard.jsx", error: String((e && e.message) || e) }); }

// components/feedback/MorphingDialog.jsx
try { (() => {
const {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect
} = React;
/* AfaqWay MorphingDialog — a card that expands in place into a full dialog
   (FLIP: the trigger's own rect is the animation's start point). Use on
   dashboard cards (university, program, document…) that open into detail. */
const Ctx = createContext(null);
function MorphingDialog({
  children
}) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState(null);
  return /*#__PURE__*/React.createElement(Ctx.Provider, {
    value: {
      open,
      setOpen,
      rect,
      setRect
    }
  }, children);
}
function MorphingDialogTrigger({
  children,
  className = "",
  style,
  onClick
}) {
  const ref = useRef(null);
  const ctx = useContext(Ctx);
  return /*#__PURE__*/React.createElement("div", {
    ref: ref,
    className: `mdlg-trigger ${className}`.trim(),
    style: {
      cursor: "pointer",
      ...style
    },
    onClick: e => {
      onClick && onClick(e);
      const r = ref.current.getBoundingClientRect();
      ctx.setRect({
        top: r.top,
        left: r.left,
        width: r.width,
        height: r.height
      });
      ctx.setOpen(true);
    }
  }, children);
}
function MorphingDialogContent({
  children,
  className = "",
  style
}) {
  const ctx = useContext(Ctx);
  const [phase, setPhase] = useState("start"); // start → open → closing
  useEffect(() => {
    if (ctx.open) {
      const id = requestAnimationFrame(() => setPhase("open"));
      return () => cancelAnimationFrame(id);
    }
  }, [ctx.open]);
  useEffect(() => {
    if (!ctx.open) return;
    const onEsc = e => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [ctx.open]);
  if (!ctx.open || !ctx.rect) return null;
  const r = ctx.rect;
  const close = () => {
    setPhase("start");
    ctx.setOpen(false);
  };
  const startStyle = {
    top: r.top,
    left: r.left,
    width: r.width,
    height: r.height,
    borderRadius: "var(--radius-2xl)"
  };
  const openStyle = {
    top: "50%",
    left: "50%",
    width: "min(90vw, 28rem)",
    height: "auto",
    maxHeight: "80vh",
    transform: "translate(-50%,-50%)",
    borderRadius: "var(--radius-dialog)"
  };
  return /*#__PURE__*/React.createElement(Ctx.Provider, {
    value: {
      ...ctx,
      close
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "mdlg-overlay",
    onClick: close
  }, /*#__PURE__*/React.createElement("div", {
    className: `mdlg-popup ${className}`.trim(),
    style: {
      position: "fixed",
      ...(phase === "open" ? openStyle : startStyle),
      transition: "all 320ms var(--ease)",
      overflow: "auto",
      ...style
    },
    onClick: e => e.stopPropagation()
  }, children)));
}
function MorphingDialogClose({
  children
}) {
  const ctx = useContext(Ctx);
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "mdlg-close",
    "aria-label": "Close",
    onClick: () => ctx.close()
  }, children || /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M18 6 6 18M6 6l12 12"
  })));
}
Object.assign(__ds_scope, { MorphingDialog, MorphingDialogTrigger, MorphingDialogContent, MorphingDialogClose });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/MorphingDialog.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Skeleton.jsx
try { (() => {
/* AfaqWay Skeleton — the loading placeholder for text/avatar while content
   streams in. Shimmer matches the platform's existing dsSkel/afShimmer motion. */

function Skeleton({
  height = 12,
  width = "100%",
  circle,
  radius,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "af-skel",
    style: {
      height,
      width,
      borderRadius: circle ? "999px" : radius || "var(--radius-pill)",
      aspectRatio: circle ? "1 / 1" : undefined,
      ...style
    }
  });
}
Object.assign(__ds_scope, { Skeleton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Skeleton.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
const {
  useState,
  useEffect
} = React;
/* AfaqWay Toast — the platform's one push notification. A tiny module-level
   store (no context/provider needed) + toast()/dismissToast() to fire one from
   anywhere, and <Toaster/> mounted once to render the stack bottom-right. */
let listeners = [];
let toasts = [];
let uid = 0;
function emit() {
  listeners.forEach(l => l([...toasts]));
}
function toast({
  type = "info",
  title,
  description,
  actionLabel,
  onAction,
  duration = 4500
}) {
  const id = ++uid;
  toasts = [...toasts, {
    id,
    type,
    title,
    description,
    actionLabel,
    onAction
  }];
  emit();
  if (duration) setTimeout(() => dismissToast(id), duration);
  return id;
}
function dismissToast(id) {
  toasts = toasts.filter(t => t.id !== id);
  emit();
}
const ICONS = {
  success: /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M22 11.08V12a10 10 0 1 1-5.93-9.14"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m9 11 3 3L22 4"
  })),
  info: /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 16v-4M12 8h.01"
  })),
  warning: /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 9v4M12 17h.01"
  })),
  error: /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m15 9-6 6M9 9l6 6"
  })),
  loading: /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    style: {
      animation: "afToastSpin 1s linear infinite"
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M21 12a9 9 0 1 1-9-9"
  }))
};
const TONE = {
  success: "green",
  info: "indigo",
  warning: "amber",
  error: "red",
  loading: "grey"
};
function ToastCard({
  t
}) {
  const tone = TONE[t.type] || "indigo";
  return /*#__PURE__*/React.createElement("div", {
    className: `af-toast tone-${tone}`,
    role: "status"
  }, ICONS[t.type] && /*#__PURE__*/React.createElement("span", {
    className: "af-toast-ico"
  }, ICONS[t.type]), /*#__PURE__*/React.createElement("div", {
    className: "af-toast-body"
  }, t.title && /*#__PURE__*/React.createElement("div", {
    className: "af-toast-title"
  }, t.title), t.description && /*#__PURE__*/React.createElement("div", {
    className: "af-toast-desc"
  }, t.description)), t.actionLabel && /*#__PURE__*/React.createElement("button", {
    className: "af-toast-action",
    onClick: () => {
      t.onAction && t.onAction();
      dismissToast(t.id);
    }
  }, t.actionLabel), /*#__PURE__*/React.createElement("button", {
    className: "af-toast-close",
    "aria-label": "Close",
    onClick: () => dismissToast(t.id)
  }, /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M18 6 6 18M6 6l12 12"
  }))));
}
const Toast = ToastCard;
function Toaster() {
  const [list, setList] = useState(toasts);
  useEffect(() => {
    listeners.push(setList);
    return () => {
      listeners = listeners.filter(l => l !== setList);
    };
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    className: "af-toast-viewport"
  }, list.map(t => /*#__PURE__*/React.createElement(ToastCard, {
    key: t.id,
    t: t
  })));
}
Object.assign(__ds_scope, { toast, dismissToast, Toast, Toaster });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/forms/Controls.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState,
  useRef,
  useEffect
} = React;
/* AfaqWay Controls — one input, textarea, dropdown, toggle and checkbox for the
   whole platform. Every field carries a leading icon; the error slot is always
   reserved so validation never shifts the layout. Ported from Controls.tsx. */
const IChevron = ({
  s = 16
}) => /*#__PURE__*/React.createElement("svg", {
  width: s,
  height: s,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M6 9l6 6 6-6"
}));
const ICheck = ({
  s = 15
}) => /*#__PURE__*/React.createElement("svg", {
  width: s,
  height: s,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2.4",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M20 6L9 17l-5-5"
}));
const IX = ({
  s = 13
}) => /*#__PURE__*/React.createElement("svg", {
  width: s,
  height: s,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2.4",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M18 6L6 18M6 6l12 12"
}));
function Input({
  icon,
  label,
  error,
  hint,
  trailing,
  containerStyle,
  className,
  id,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: containerStyle
  }, label && /*#__PURE__*/React.createElement("label", {
    className: "af-label",
    htmlFor: id
  }, label), /*#__PURE__*/React.createElement("div", {
    className: `af-field${icon ? " has-icon" : ""}${trailing ? " has-trailing" : ""}`
  }, icon && /*#__PURE__*/React.createElement("span", {
    className: "af-field-ico"
  }, icon), /*#__PURE__*/React.createElement("input", _extends({
    id: id,
    className: `af${className ? " " + className : ""}`,
    "aria-invalid": error ? "true" : undefined
  }, rest)), trailing && /*#__PURE__*/React.createElement("span", {
    className: "af-field-trail"
  }, trailing)), (error || hint) && /*#__PURE__*/React.createElement("span", {
    className: "af-error",
    style: !error && hint ? {
      color: "var(--ink-faint)"
    } : undefined
  }, error || hint));
}
function TextArea({
  icon,
  label,
  error,
  hint,
  rows = 4,
  containerStyle,
  className,
  id,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: containerStyle
  }, label && /*#__PURE__*/React.createElement("label", {
    className: "af-label",
    htmlFor: id
  }, label), /*#__PURE__*/React.createElement("div", {
    className: `af-field${icon ? " has-icon" : ""}`,
    style: {
      alignItems: "flex-start"
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    className: "af-field-ico is-textarea"
  }, icon), /*#__PURE__*/React.createElement("textarea", _extends({
    id: id,
    rows: rows,
    className: `af${className ? " " + className : ""}`,
    "aria-invalid": error ? "true" : undefined
  }, rest))), (error || hint) && /*#__PURE__*/React.createElement("span", {
    className: "af-error",
    style: !error && hint ? {
      color: "var(--ink-faint)"
    } : undefined
  }, error || hint));
}
function Select({
  options = [],
  value,
  onChange,
  placeholder = "Select…",
  icon,
  label,
  disabled,
  error,
  id
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onEsc = e => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);
  const opts = options.map(o => typeof o === "string" ? {
    value: o,
    label: o
  } : o);
  const selected = opts.find(o => o.value === value);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%"
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    className: "af-label",
    htmlFor: id
  }, label), /*#__PURE__*/React.createElement("div", {
    className: `af-select${open ? " open" : ""}`,
    ref: ref
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    id: id,
    className: "af-select-btn",
    disabled: disabled,
    "data-invalid": error ? "true" : undefined,
    "aria-haspopup": "listbox",
    "aria-expanded": open,
    onClick: () => setOpen(v => !v)
  }, icon && /*#__PURE__*/React.createElement("span", {
    className: "af-select-ico"
  }, icon), /*#__PURE__*/React.createElement("span", {
    className: `af-select-val${selected ? "" : " placeholder"}`
  }, selected ? selected.label : placeholder), /*#__PURE__*/React.createElement("span", {
    className: "af-select-chev"
  }, /*#__PURE__*/React.createElement(IChevron, null))), open && /*#__PURE__*/React.createElement("div", {
    className: "af-menu",
    role: "listbox"
  }, opts.map(o => /*#__PURE__*/React.createElement("button", {
    key: o.value,
    type: "button",
    role: "option",
    "aria-selected": o.value === value,
    className: `af-opt${o.value === value ? " selected" : ""}`,
    onClick: () => {
      onChange && onChange(o.value);
      setOpen(false);
    }
  }, o.label, o.value === value && /*#__PURE__*/React.createElement("span", {
    className: "af-opt-check"
  }, /*#__PURE__*/React.createElement(ICheck, {
    s: 14
  })))))), error && /*#__PURE__*/React.createElement("span", {
    className: "af-error"
  }, error));
}
function Toggle({
  checked,
  onChange,
  disabled,
  label,
  description,
  size = "default",
  id
}) {
  const btn = /*#__PURE__*/React.createElement("button", {
    type: "button",
    id: id,
    className: `af-toggle${size === "sm" ? " sm" : ""}`,
    role: "switch",
    "aria-checked": checked,
    disabled: disabled,
    onClick: () => onChange && onChange(!checked)
  }, /*#__PURE__*/React.createElement("span", {
    className: "af-toggle-ico off"
  }, /*#__PURE__*/React.createElement(IX, {
    s: size === "sm" ? 9 : 13
  })), /*#__PURE__*/React.createElement("span", {
    className: "af-toggle-thumb"
  }));
  if (!label) return btn;
  const row = /*#__PURE__*/React.createElement("label", {
    className: "af-toggle-row",
    style: {
      cursor: disabled ? "not-allowed" : "pointer"
    }
  }, btn, label);
  if (!description) return row;
  return /*#__PURE__*/React.createElement("div", null, row, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      font: "400 12px/17px var(--font-sans)",
      color: "var(--ink-faint)",
      marginTop: 4,
      marginLeft: 62
    }
  }, description));
}
const Controls = {
  Input,
  TextArea,
  Select,
  Toggle,
  Checkbox
};
function Checkbox({
  checked,
  onChange,
  disabled,
  invalid,
  label,
  description,
  error,
  id
}) {
  const box = /*#__PURE__*/React.createElement("button", {
    type: "button",
    id: id,
    className: "af-check",
    role: "checkbox",
    "aria-checked": checked,
    disabled: disabled,
    "data-invalid": invalid || error ? "true" : undefined,
    onClick: () => onChange && onChange(!checked)
  }, checked && /*#__PURE__*/React.createElement(ICheck, {
    s: 11
  }));
  if (!label) return box;
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "af-check-row"
  }, box, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block"
    }
  }, label), description && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      font: "400 12px/17px var(--font-sans)",
      color: "var(--ink-faint)",
      marginTop: 2
    }
  }, description))), error && /*#__PURE__*/React.createElement("span", {
    className: "af-error",
    style: {
      marginLeft: 30
    }
  }, error));
}
Object.assign(__ds_scope, { Input, TextArea, Select, Toggle, Controls, Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Controls.jsx", error: String((e && e.message) || e) }); }

// components/navigation/FloatingToolbar.jsx
try { (() => {
/* AfaqWay FloatingToolbar — a floating group of icon actions (rich-text
   formatting, selection toolbars). One active state, equal spacing, minimal
   separators, matching the platform's floating-panel language. */

function FloatingToolbar({
  open = true,
  actions = [],
  style
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "ftbar",
    style: style
  }, actions.map((a, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    type: "button",
    className: `ftbar-btn${a.active ? " active" : ""}`,
    "aria-label": a.label,
    "aria-pressed": a.active,
    title: a.label,
    onClick: a.onClick,
    disabled: a.disabled
  }, a.icon)));
}
Object.assign(__ds_scope, { FloatingToolbar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/FloatingToolbar.jsx", error: String((e && e.message) || e) }); }

// components/navigation/MegaMenu.jsx
try { (() => {
const {
  useState,
  useRef,
  useEffect
} = React;
/* AfaqWay MegaMenu — top-bar nav with expandable panels (Product/Resources
   style). Items without `sections` are plain links. Adapted from a reference
   MegaMenu onto our own tokens (no external mega-menu package here). */
function MegaMenu({
  items = []
}) {
  const [open, setOpen] = useState(null);
  const ref = useRef(null);
  useEffect(() => {
    if (open == null) return;
    const onDoc = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(null);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);
  return /*#__PURE__*/React.createElement("nav", {
    className: "mmenu",
    ref: ref
  }, items.map((item, i) => /*#__PURE__*/React.createElement("div", {
    key: item.label,
    className: "mmenu-item"
  }, item.sections ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: `mmenu-trigger${open === i ? " open" : ""}`,
    onClick: () => setOpen(open === i ? null : i)
  }, item.label, /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M6 9l6 6 6-6"
  }))), open === i && /*#__PURE__*/React.createElement("div", {
    className: "mmenu-panel"
  }, item.sections.map((sec, si) => /*#__PURE__*/React.createElement("div", {
    key: si,
    className: "mmenu-section"
  }, sec.heading && /*#__PURE__*/React.createElement("div", {
    className: "mmenu-heading"
  }, sec.heading), sec.links.map(l => /*#__PURE__*/React.createElement("a", {
    key: l.label,
    href: l.href,
    className: "mmenu-link",
    onClick: () => setOpen(null)
  }, l.icon && /*#__PURE__*/React.createElement("span", {
    className: "mmenu-link-ico"
  }, l.icon), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    className: "mmenu-link-label"
  }, l.label), l.description && /*#__PURE__*/React.createElement("span", {
    className: "mmenu-link-desc"
  }, l.description)))))))) : /*#__PURE__*/React.createElement("a", {
    href: item.href,
    className: "mmenu-trigger plain"
  }, item.label))));
}
Object.assign(__ds_scope, { MegaMenu });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/MegaMenu.jsx", error: String((e && e.message) || e) }); }

// guidelines/doc-page.js
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)
// Copied omelette starter. Re-running copy_starter_component with this kind overwrites this file with the latest version (page content is unaffected).
/* BEGIN USAGE */
/**
 * <doc-page> — paged-document shell for printable HTML.
 *
 * FIRST, decide how the document paginates — up front, before building:
 *
 * - FLOWING document (the default): write the whole document as one
 *   normal HTML flow inside <doc-page>; the browser's print engine
 *   splits it onto pages at export. Use for long-form documents with a
 *   single text flow: reports, memos, letters, essays.
 * - EXPLICIT pagination: a fixed set of pre-paginated pages, one
 *   <section class="page"> child per page. Use when the user asks for a
 *   specific page count, or the design implies one: a one-page resume, a
 *   two-sided flier, a poster, a certificate, a brochure — any richly
 *   laid-out document without a single text flow.
 * - If in doubt, ask the user as part of the build.
 *
 * PAGE SIZING — paper differs by country (letter vs A4), so the printed
 * sheet is not one fixed truth:
 * - FLOWING documents pin NO paper size: the print engine paginates
 *   onto the user's real paper, and the content reflows to it.
 * - EXPLICITLY PAGINATED documents print each page at a FIXED page box
 *   with overflow hidden — letter by default, size="a4" for a clearly
 *   metric user, the user's chosen paper when they export. Design each
 *   page to FILL that box, fitting letter and A4 alike without overlap.
 * - width/height pin an explicit fixed size, ONLY when the user gives
 *   one.
 * Never write your own @page rule or hard-code paper dimensions in the
 * content.
 *
 * Sizing modes (attributes):
 *   (none)                      — portrait: flowing docs use the user's
 *           paper; explicitly paginated pages use the named size box
 *           (letter unless size="a4")
 *   orientation="landscape"     — the same, landscape
 *   width / height              — explicit fixed size, ONLY when the user
 *           gives one (e.g. width="22in" height="30in" for a 22×30
 *           poster): the page IS the design's size, printed at true
 *           dimensions (or scaled onto the user's paper at print time).
 *           Any absolute CSS length: px/in/mm/cm/pt/pc.
 * The component announces the chosen mode to the host app at runtime (a
 * meta tag it injects), so the print path can inject the user's true
 * paper size.
 *
 * On screen the document renders on a desk background: a flowing
 * document as one tall scrolling sheet (Google Docs' pageless view);
 * explicitly paginated documents as one card per page.
 *
 * EXPLICIT pagination usage:
 *   <style>doc-page:not(:defined){visibility:hidden}</style>
 *   <doc-page>
 *     <section class="page" id="p1">…one page's design…</section>
 *     <section class="page" id="p2">…</section>
 *   </doc-page>
 *   <script src="doc-page.js"></script>
 * How the page box works, concretely: each .page prints as ONE full-bleed
 * sheet at a FIXED physical size — letter by default (set size="a4" for
 * a clearly metric user), the user's chosen paper when they export —
 * with overflow hidden. Nothing scrolls and nothing reflows onto a next
 * sheet: content that misses the box is CLIPPED. Design each page to
 * FILL that page box, and to fit it — letter and A4 alike — without
 * overlap. Each page is a size container; don't size anything in
 * viewport units (they track the window, not the page), and never set
 * width or height on the .page section itself (the component sizes the
 * page box; an authored height like 100% is meaningless at print and is
 * overridden). The component owns the page box, the screen card chrome,
 * and the page breaks (never add your own break-before/after). Don't mix
 * .page sections with flowing content or header/footer slots in the same
 * document.
 *
 * FLOWING usage:
 *   <style>doc-page:not(:defined){visibility:hidden}</style>
 *   <doc-page margin="0.75in">
 *     <h1>Title</h1>
 *     <p>…body…</p>
 *   </doc-page>
 *   <script src="doc-page.js"></script>
 * There is no manual page-splitting — the browser's print engine
 * paginates at export. Standard break-hygiene rules (`break-inside:
 * avoid` on figures, code blocks, images and table rows; `orphans/
 * widows: 3`) are applied so paragraphs and groups split cleanly. On
 * screen and at print, headings default to `text-wrap: balance` and
 * body text to `text-wrap: pretty`; the defaults have zero specificity,
 * so any text-wrap you declare wins.
 *
 * Other attributes:
 *   size    — letter | a4 | legal (default letter). Flowing documents:
 *           preview proportion only — it does NOT pin their printed
 *           paper (the print dialog's paper governs); leave it alone
 *           there. Explicitly paginated documents: it sets the page box
 *           the cards and the pinned @page share (the export dialog's
 *           choice overrides both at print) — set size="a4" for a
 *           clearly metric user. Scaled-fit: names the sheet the fit is
 *           computed against, same a4-for-metric-users advice.
 *   content-width / content-height — the design's own fixed dimensions
 *           (CSS lengths), for scaling a fixed-size design ONTO the
 *           named sheet: content lays out at exactly this size, and the
 *           component scales it to fit that sheet's printable area
 *           (centered horizontally, top-aligned; the export dialog
 *           re-fits to the user's actual paper choice where available).
 *           Both must be set; they do not change the page box. For pages
 *           WITHOUT running header/footer slots.
 *   margin  — printable inset on every page of a FLOWING document
 *           (default 0.75in); margin="0" makes pages full-bleed.
 *           Explicitly paginated pages are always full-bleed.
 *
 * Running header/footer (flowing documents only): give an element
 * `slot="header"` or `slot="footer"` and it repeats on every printed
 * page via `position: fixed`. To keep body text from sliding under it,
 * the component prints inside a single-cell table whose <thead>/<tfoot>
 * are spacers sized to the header/footer height — browsers repeat
 * thead/tfoot on every page, so each sheet's content starts below the
 * header and ends above the footer. On screen the header/footer render
 * once at the top/bottom of the sheet.
 *
 * At print the component injects `@page { margin: 0 }` (which leaves
 * Chrome no margin box to draw its date/URL/page-count header in) and
 * moves the visual margin onto the sheet's own padding. It also marks
 * the document as owning its print CSS (a
 * `meta[name="omelette-owns-print"]` it injects at runtime), so the
 * PDF export never injects page-geometry CSS of its own on top.
 *
 * Print best practices for the content you author:
 * - Multi-column text: use CSS columns (`column-count` +
 *   `column-gap`), never side-by-side flex/grid columns — only real
 *   CSS columns flow and break across pages. `column-span: all` lets
 *   a heading span the columns; `hyphens: auto` (needs `lang` on
 *   the html element) keeps narrow columns readable.
 * - Page breaks in flowing documents: `break-before: page` on an
 *   element that must start a new page (a chapter, an appendix). Add
 *   your own kept-together blocks (callouts, stat tiles, cards) to a
 *   `break-inside: avoid` rule, and keep each one shorter than a page.
 * - Extend `orphans: 3; widows: 3` to any custom text blocks you add
 *   (p and li are covered by default).
 * - Give long tables a <thead> — browsers repeat it on every printed
 *   page.
 * - No `position: fixed`/`sticky` and no viewport units in content:
 *   fixed elements stamp every printed page (running headers/footers go
 *   in the component's slots) and `100vh` mis-sizes at print.
 *
 * Author content as static HTML so the user can click-to-edit any text
 * directly. Do not set width/padding/background on the document body —
 * the component owns the sheet box.
 */
/* END USAGE */

(() => {
  const PAPER = {
    letter: ['8.5in', '11in'],
    a4: ['210mm', '297mm'],
    legal: ['8.5in', '14in']
  };
  const CSS_LENGTH = /^\d+(\.\d+)?(px|in|mm|cm|pt|pc)$/;
  // Unitless "0" is a valid CSS length and the natural way to write
  // margin="0"; normalise it to 0px so max()/calc() (which reject a bare
  // number) keep working.
  const safeLen = (v, fb) => {
    v = (v || '').trim();
    return v === '0' ? '0px' : CSS_LENGTH.test(v) ? v : fb;
  };
  // WebKit (Safari and every iOS browser shell) never repeats a table's
  // thead/tfoot on printed pages (WebKit bug 17205), so the spacer-borne
  // vertical margins of a FLOWING document reach only the first page
  // there. Engine check, not browser check: vendor is 'Apple Computer,
  // Inc.' exactly for WebKit and 'Google Inc.' for Blink.
  const WK_PRINT = /apple/i.test(navigator.vendor || '');
  // CSS length → px number (CSS absolute units are exact: 1in = 96px).
  // Returns NaN for anything safeLen would reject — callers gate on it.
  const PX_PER = {
    px: 1,
    in: 96,
    mm: 96 / 25.4,
    cm: 96 / 2.54,
    pt: 96 / 72,
    pc: 16
  };
  const toPx = v => {
    const m = /^(\d+(?:\.\d+)?)(px|in|mm|cm|pt|pc)$/.exec((v || '').trim());
    return m ? parseFloat(m[1]) * PX_PER[m[2]] : NaN;
  };
  const stylesheet = `
    :host {
      position: relative;
      display: block;
      /* When the viewport is narrower than the page, grow to wrap the
       * sheet (plus this padding) instead of staying viewport-width, so
       * the desk background and right margin reach the sheet's far edge
       * in the horizontal scroll. */
      min-width: max-content;
      min-height: 100vh;
      background: #f5f5f4;
      padding: 48px 24px;
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
      --doc-page-w: 8.5in;
      --doc-page-h: 11in;
      --doc-page-margin: 0.75in;
      --doc-hdr-h: 0px;
      --doc-ftr-h: 0px;
      --doc-hdr-pad: 0px;
      --doc-ftr-pad: 0px;
    }
    .sheet {
      width: var(--doc-page-w);
      margin: 0 auto;
      background: #fff;
      box-shadow: 0 2px 10px rgba(20, 20, 19, 0.12);
      border-radius: 7px;
      box-sizing: border-box;
      padding: var(--doc-page-margin);
    }
    .frame { width: 100%; border-collapse: collapse; }
    /* Scaled-fit mode (content-width/content-height): the inner .fit box
     * lays the content out at its authored fixed size and scales it onto
     * the printable area; .fit-box reserves the scaled footprint in flow
     * (transforms don't affect layout) and centers it. Without the mode,
     * both divs are unstyled block pass-throughs. */
    /* Explicit pagination: direct .page children are the pages. The sheet
     * becomes a transparent stack and each page carries the card look on
     * screen; at print each page is exactly one full-bleed sheet. The
     * ::slotted defaults are deliberately weak (document CSS wins), so
     * authored page styling can override any of this. */
    .sheet.paginated {
      background: transparent;
      box-shadow: none;
      border-radius: 0;
      padding: 0;
    }
    .paginated ::slotted(.page) {
      position: relative;
      display: block;
      width: 100%;
      aspect-ratio: var(--doc-page-ar);
      container-type: size;
      overflow: hidden;
      box-sizing: border-box;
      background: #fff;
      border-radius: 7px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
      break-inside: avoid;
    }
    .paginated ::slotted(.page:not(:first-child)) { margin-top: 1rem; }
    @media print {
      .sheet.paginated { padding: 0; }
      /* The flowing-document vertical inset lives on the repeating
       * thead/tfoot spacers, not the sheet padding — they must go too,
       * or each full-sheet .page is pushed ~margin down and spills onto
       * a second sheet. Paginated pages are full-bleed by definition
       * (content owns its insets). */
      .sheet.paginated .hdr-space,
      .sheet.paginated .ftr-space { height: 0; }
      .paginated ::slotted(.page) {
        border-radius: 0 !important;
        box-shadow: none !important;
        margin: 0 !important;
        /* Physical page-box sizing, no viewport units: Safari resolves
         * 100vh against the window, not the page box, so a vh-sized card
         * paginates wrong there. --doc-page-w/h are the named size by
         * default and are overridden to the user's chosen paper by the
         * export path, so every card is exactly one sheet either way.
         * Width + height (same source values as @page size) rather than
         * width + aspect-ratio: the ratio is a 6-decimal rounding of the
         * same division, and a few millionths of overflow would spill a
         * blank sheet after every page. The screen-only aspect-ratio
         * (preview proportions) must not leak into print. cqh typography
         * tracks the same box.
         *
         * Every declaration is !important: per CSS Scoping, unimportant
         * shadow ::slotted rules LOSE to the document context, so a page
         * section's authored inline style would silently beat this print
         * geometry. A model-authored height:100% did exactly that — the
         * percentage resolves as auto in the all-auto print ancestry, the
         * base rule's size containment turns auto into ZERO, and
         * overflow:hidden then paints nothing: a blank PDF with perfect
         * page boxes. At print the component's geometry is the design's
         * whole contract, so it must win over any authored sizing. */
        aspect-ratio: auto !important;
        width: var(--doc-page-w) !important;
        height: var(--doc-page-h) !important;
        overflow: hidden !important;
      }
      .paginated ::slotted(.page:not(:first-child)) {
        break-before: page !important;
        margin-top: 0 !important;
      }
    }
    .fit-mode .fit-box {
      width: calc(var(--doc-fit-w) * var(--doc-fit-scale));
      height: calc(var(--doc-fit-h) * var(--doc-fit-scale));
      margin: 0 auto;
      break-inside: avoid;
    }
    .fit-mode .fit {
      width: var(--doc-fit-w);
      height: var(--doc-fit-h);
      transform: scale(var(--doc-fit-scale));
      transform-origin: top left;
    }
    .frame td, .frame th { padding: 0; text-align: left; font-weight: inherit; }
    .hdr-space { height: var(--doc-hdr-h); }
    .ftr-space { height: var(--doc-ftr-h); }
    ::slotted([slot="header"]),
    ::slotted([slot="footer"]) { display: block; box-sizing: border-box; }
    @media print {
      :host { background: none; padding: 0; min-width: 0; min-height: 0; }
      .sheet {
        width: auto; margin: 0; box-shadow: none; border-radius: 0;
        padding: 0 var(--doc-page-margin);
      }
      /* The thead/tfoot spacers repeat on every page, so they carry the
       * vertical page margin (which the sheet's own padding cannot, since
       * that padding is consumed once on the first/last page). The running
       * header/footer are fixed inside that band. */
      /* The 0.35in is breathing room between a running header/footer and
       * the body; without one the spacer is exactly the page margin, so a
       * margin="0" full-bleed document gets truly full-bleed pages. */
      .hdr-space { height: max(var(--doc-page-margin), calc(var(--doc-hdr-h) + var(--doc-hdr-pad))); }
      .ftr-space { height: max(var(--doc-page-margin), calc(var(--doc-ftr-h) + var(--doc-ftr-pad))); }
      /* WebKit flowing documents: @page carries the vertical margin (see
       * _syncPrintPageRule), so the spacers keep only whatever a running
       * header/footer needs BEYOND it — page 1 would otherwise double its
       * top inset. Paginated sheets already zero their spacers above. */
      .sheet.wk-print:not(.paginated) .hdr-space { height: max(0px, calc(max(var(--doc-page-margin), calc(var(--doc-hdr-h) + var(--doc-hdr-pad))) - var(--doc-page-margin))); }
      .sheet.wk-print:not(.paginated) .ftr-space { height: max(0px, calc(max(var(--doc-page-margin), calc(var(--doc-ftr-h) + var(--doc-ftr-pad))) - var(--doc-page-margin))); }
      ::slotted([slot="header"]) {
        position: fixed; top: 0; left: 0; right: 0; margin: 0;
        padding: calc(var(--doc-page-margin) * 0.45) var(--doc-page-margin) 0;
      }
      ::slotted([slot="footer"]) {
        position: fixed; bottom: 0; left: 0; right: 0; margin: 0;
        padding: 0 var(--doc-page-margin) calc(var(--doc-page-margin) * 0.45);
      }
    }
  `;
  class DocPage extends HTMLElement {
    static get observedAttributes() {
      return ['size', 'width', 'height', 'margin', 'orientation', 'content-width', 'content-height'];
    }
    constructor() {
      super();
      this._root = this.attachShadow({
        mode: 'open'
      });
      this._mo = typeof MutationObserver === 'function' ? new MutationObserver(() => this._scheduleMeasure()) : null;
    }

    /** The named paper's [w, h], swapped when orientation="landscape".
     *  Only the named size swaps — explicit width/height are exact values
     *  the author already oriented. */
    _paperSize() {
      const named = PAPER[(this.getAttribute('size') || '').toLowerCase()] || PAPER.letter;
      const landscape = (this.getAttribute('orientation') || '').trim().toLowerCase() === 'landscape';
      return landscape ? [named[1], named[0]] : named;
    }
    get pageWidth() {
      return safeLen(this.getAttribute('width'), this._paperSize()[0]);
    }
    get pageHeight() {
      return safeLen(this.getAttribute('height'), this._paperSize()[1]);
    }
    get pageMargin() {
      return safeLen(this.getAttribute('margin'), '0.75in');
    }

    /** Scaled-fit mode's content box [w, h] as CSS lengths, or null when
     *  the mode is off (either attribute missing/invalid/zero — a partial
     *  declaration falls back to normal flow rather than guessing). */
    _contentFit() {
      const w = safeLen(this.getAttribute('content-width'), null);
      const h = safeLen(this.getAttribute('content-height'), null);
      if (!w || !h) return null;
      const wPx = toPx(w),
        hPx = toPx(h);
      return wPx > 0 && hPx > 0 ? [w, h, wPx, hPx] : null;
    }
    connectedCallback() {
      if (!this._sheet) this._render();
      this._syncSize();
      this._syncPrintPageRule();
      this._ensureTextWrapDefaults();
      this._ensureOwnsPrintMeta();
      this._syncFixedSizeMeta();
      this._syncPrintSizingMeta();
      if (this._mo) this._mo.observe(this, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true
      });
      this._onResize = () => this._scheduleMeasure();
      window.addEventListener('resize', this._onResize);
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => this._scheduleMeasure());
      }
      this._scheduleMeasure();
    }
    disconnectedCallback() {
      window.removeEventListener('resize', this._onResize);
      if (this._mo) this._mo.disconnect();
      if (this._raf) {
        cancelAnimationFrame(this._raf);
        this._raf = null;
      }
      // Drop the head rules when the last doc-page leaves, so a deleted
      // document's @page geometry and text-wrap defaults can't apply to
      // whatever replaces it.
      const survivor = document.querySelector('doc-page');
      if (!survivor) {
        ['doc-page-print', 'doc-page-text-wrap', 'doc-page-owns-print', 'doc-page-fixed-size', 'doc-page-print-sizing'].forEach(id => {
          const tag = document.getElementById(id);
          if (tag) tag.remove();
        });
        // A live deck-stage deferred its own print-sizing meta to ours —
        // hand the page-global meta over so the deck isn't left unmarked.
        const deck = document.querySelector('deck-stage');
        if (deck && typeof deck._ensurePrintSizingMeta === 'function') {
          deck._ensurePrintSizingMeta();
        }
      } else {
        // A departed owner hands each page-global meta to whatever
        // doc-page remains (or it's removed).
        if (typeof survivor._syncFixedSizeMeta === 'function') {
          survivor._syncFixedSizeMeta();
        }
        if (typeof survivor._syncPrintSizingMeta === 'function') {
          survivor._syncPrintSizingMeta();
        }
      }
    }
    attributeChangedCallback() {
      if (!this._sheet) return;
      this._syncSize();
      this._syncPrintPageRule();
      this._syncFixedSizeMeta();
      this._syncPrintSizingMeta();
      this._scheduleMeasure();
    }
    _render() {
      this._root.innerHTML = `
        <style>${stylesheet}</style>
        <style id="vars"></style>
        <div class="sheet" data-screen-label="Document">
          <table class="frame" role="presentation">
            <thead><tr><th><div class="hdr-space"><slot name="header"></slot></div></th></tr></thead>
            <tbody><tr><td class="body"><div class="fit-box"><div class="fit"><slot></slot></div></div></td></tr></tbody>
            <tfoot><tr><td><div class="ftr-space"><slot name="footer"></slot></div></td></tr></tfoot>
          </table>
        </div>`;
      this._sheet = this._root.querySelector('.sheet');
      this._vars = this._root.getElementById('vars');
    }

    /** Runtime sizing lives in a shadow <style> :host rule, never on the
     *  light-DOM host element, so serialize-persist can't write it back. */
    _syncSize(hdrH, ftrH) {
      // Scaled-fit mode: content at its authored size, scaled onto the
      // printable area (page minus margins on both axes). The factor is a
      // plain number var so calc(length * number) stays valid; 4 decimals
      // keeps the shadow style stable across re-measures. Upscaling is
      // allowed — print transforms are vector, so text and CSS stay crisp
      // (raster images soften, which the catalog bullet warns about).
      const fit = this._contentFit();
      let fitVars = '';
      if (fit) {
        const marginPx = toPx(this.pageMargin) || 0;
        const availW = toPx(this.pageWidth) - 2 * marginPx;
        const availH = toPx(this.pageHeight) - 2 * marginPx;
        const scale = Math.min(availW / fit[2], availH / fit[3]);
        if (scale > 0 && Number.isFinite(scale)) {
          fitVars = '--doc-fit-w:' + fit[0] + ';' + '--doc-fit-h:' + fit[1] + ';' + '--doc-fit-scale:' + scale.toFixed(4) + ';';
        }
      }
      this._sheet.classList.toggle('fit-mode', !!fitVars);
      // Numeric w/h ratio for the paginated page cards' aspect-ratio —
      // aspect-ratio takes a number, not a length ratio, so compute it
      // here (CSS length division isn't portable). 6 decimals keeps the
      // shadow style stable across re-syncs.
      const arW = toPx(this.pageWidth);
      const arH = toPx(this.pageHeight);
      const ar = arW > 0 && arH > 0 ? (arW / arH).toFixed(6) : '0.772727';
      this._vars.textContent = ':host{' + fitVars + '--doc-page-ar:' + ar + ';' + '--doc-page-w:' + this.pageWidth + ';' + '--doc-page-h:' + this.pageHeight + ';' + '--doc-page-margin:' + this.pageMargin + ';' + '--doc-hdr-h:' + (hdrH || 0) + 'px;' + '--doc-ftr-h:' + (ftrH || 0) + 'px;' + '--doc-hdr-pad:' + (hdrH ? '0.35in' : '0px') + ';' + '--doc-ftr-pad:' + (ftrH ? '0.35in' : '0px') + '}';
    }

    /** @page is a no-op inside shadow DOM, so the rule lives in <head>.
     *  Re-appended on every sync so it stays last in source order — the
     *  @page cascade is source-order per descriptor, so this rule wins
     *  over any other @page rule in the document.
     *
     *  The @page SIZE is pinned where the page box IS part of the design:
     *  explicit-fixed-size mode (width + height authored), scaled-fit
     *  mode (the named sheet the fit targets), and explicit pagination
     *  (the named size the cards share — so card and sheet agree on
     *  every print path, and the export path's chosen paper overrides
     *  BOTH with one later rule). For FLOWING documents no paper size is
     *  emitted at all — the true size comes from the user's preference,
     *  injected by the export path or chosen in the print dialog — so a
     *  flowing document never fights the paper it lands on.
     *  margin: 0 is emitted in every mode: it leaves Chrome no margin box
     *  to draw its date/URL/page-count header in, and the visual margin
     *  lives on the sheet's own padding. */
    _syncPrintPageRule() {
      const id = 'doc-page-print';
      let tag = document.getElementById(id);
      if (!tag) {
        tag = document.createElement('style');
        tag.id = id;
      }
      document.head.appendChild(tag);
      // Three print-geometry regimes:
      // - true-size: the page IS the design — pin its exact size.
      // - scaled-fit (content-width/height): the fit factor is computed
      //   against the NAMED paper's printable area, so that paper must
      //   stay pinned or the scaled content overflows a smaller sheet
      //   (the export path re-fits and re-pins at print time on top).
      // - default modes: no paper size — but landscape still needs the
      //   paper-agnostic 'size: landscape' keyword, because the size
      //   descriptor is what carries orientation; without it a landscape
      //   document prints portrait whenever nothing injects a size.
      const landscape = (this.getAttribute('orientation') || '').trim().toLowerCase() === 'landscape';
      // Explicit pagination pins the page box to the SAME values that
      // size the cards (the named size by default, the export path's
      // chosen paper when its later rule overrides both) — card and
      // sheet agree on every print path, and a mismatched real paper
      // shrinks-to-fit in the dialog instead of clipping a Letter card
      // on A4. Declared before the paginated read below so both derive
      // from one check.
      const paginatedNow = this.querySelector(':scope > .page') !== null;
      const sizeDescriptor = this._trueSizePx() ? 'size: ' + this.pageWidth + ' ' + this.pageHeight + '; ' : this._contentFit() ? 'size: ' + this.pageWidth + ' ' + this.pageHeight + '; ' : paginatedNow ? 'size: ' + this.pageWidth + ' ' + this.pageHeight + '; ' : landscape ? 'size: landscape; ' : '';
      // WebKit never repeats the thead/tfoot spacers that carry a flowing
      // document's vertical page margins (see WK_PRINT above), so pages
      // after the first print edge-to-edge there. Carry the VERTICAL
      // margins on @page for WebKit instead, and the shadow print CSS
      // trims the first-page spacers by the same amount (.sheet.wk-print
      // rules). Horizontal inset stays on the sheet's own padding in
      // every engine. Blink keeps margin: 0 (a nonzero margin there
      // re-opens the box Chrome draws its header furniture in). One cost,
      // learned in testing: Safari's own date/URL headers are a USER
      // dialog setting ("Print headers and footers") that renders in the
      // margin area when room exists — margin: 0 only suppressed it by
      // leaving no room, and no CSS controls it. The export dialog's
      // Safari guide teaches turning the setting off for flowing
      // documents. Explicitly paginated and fixed-size documents keep
      // margin: 0 everywhere: their pages ARE the sheet.
      const wkFlowing = WK_PRINT && !paginatedNow && !this._trueSizePx() && !this._contentFit();
      const marginDescriptor = wkFlowing ? 'margin: ' + this.pageMargin + ' 0; ' : 'margin: 0; ';
      // Shadow-internal marker (never serialized), kept in lockstep with
      // the @page decision above: the print CSS trims the first-page
      // spacers ONLY while @page actually carries the margins — a
      // true-size or scaled-fit sheet keeps margin: 0 and must keep its
      // spacers too. Re-synced here so attribute changes and pagination
      // flips move both together.
      if (this._sheet) this._sheet.classList.toggle('wk-print', wkFlowing);
      tag.textContent = '@page { ' + sizeDescriptor + marginDescriptor + '} ' + '@media print { html, body { margin: 0 !important; padding: 0 !important; background: none !important; height: auto !important; overflow: visible !important; } ' + 'h1,h2,h3,h4,h5,h6 { break-after: avoid; } ' + 'figure,pre,blockquote,img,svg,tr { break-inside: avoid; } ' + 'p,li { orphans: 3; widows: 3; } ' + '* { -webkit-print-color-adjust: exact; print-color-adjust: exact; ' + 'backdrop-filter: none !important; -webkit-backdrop-filter: none !important; } ' + '*, *::before, *::after { animation-delay: -99s !important; animation-duration: .001s !important; ' + 'animation-iteration-count: 1 !important; animation-fill-mode: both !important; ' + 'animation-play-state: running !important; transition-duration: 0s !important; } }';
    }

    /** Typographic defaults for document text: balance headings, avoid
     *  widowed/orphaned words in body copy (browsers without text-wrap
     *  support drop the declarations). Zero-specificity via :where() so
     *  any text-wrap authored on those elements wins; document-level so the
     *  rules reach the slotted (light DOM) content — shadow styles can't.
     *  data-omelette-injected marks the tag for the host editor to strip
     *  at serialize, so it is never written back as authored source. */
    _ensureTextWrapDefaults() {
      if (document.getElementById('doc-page-text-wrap')) return;
      const tag = document.createElement('style');
      tag.id = 'doc-page-text-wrap';
      tag.setAttribute('data-omelette-injected', '');
      tag.textContent = ':where(h1,h2,h3,h4,h5,h6){text-wrap:balance}' + ':where(p,li,blockquote,figcaption){text-wrap:pretty}';
      document.head.appendChild(tag);
    }

    /** Declares that this document owns its print CSS. The instant-PDF
     *  export checks for the meta by NAME PRESENCE alone (content is
     *  ignored) and skips its automatic print-CSS injections, so the
     *  component's @page geometry is never overridden by a heuristic.
     *  data-omelette-injected keeps it out of serialized source. */
    _ensureOwnsPrintMeta() {
      if (document.getElementById('doc-page-owns-print')) return;
      const tag = document.createElement('meta');
      tag.id = 'doc-page-owns-print';
      tag.name = 'omelette-owns-print';
      tag.content = 'true';
      tag.setAttribute('data-omelette-injected', '');
      document.head.appendChild(tag);
    }

    /** This page's valid true-size page box (explicit width AND height)
     *  as [w, h] px ints, or null when the mode is off. */
    _trueSizePx() {
      if (!safeLen(this.getAttribute('width'), null) || !safeLen(this.getAttribute('height'), null)) return null;
      const w = Math.round(toPx(this.pageWidth));
      const h = Math.round(toPx(this.pageHeight));
      return w > 0 && h > 0 ? [w, h] : null;
    }

    /** True-size pages (explicit width AND height) also declare the page
     *  box as the preview size: the in-app preview reads
     *  meta[name="omelette-fixed-size"] (content "W,H" in px ints) and
     *  scales the sheet into view — without it an 18in poster previews at
     *  true size with scrollbars. Never overrides an author-set meta
     *  (only the component's own id is managed). The meta is page-global
     *  while doc-page instances are not, so every sync recomputes the
     *  page-wide owner — the first connected true-size doc-page — and a
     *  non-true-size sibling's sync can never delete the owner's meta.
     *  Removed when no true-size page remains (the owner's disconnect
     *  re-syncs via any survivor) or when an author-set meta exists. */
    _syncFixedSizeMeta() {
      const id = 'doc-page-fixed-size';
      const own = document.getElementById(id);
      const authored = document.querySelector('meta[name="omelette-fixed-size"]:not([data-omelette-injected])');
      // The page-wide owner, not this instance: an upgraded true-size page
      // anywhere in the document keeps the meta alive and sized.
      let box = null;
      for (const el of document.querySelectorAll('doc-page')) {
        box = typeof el._trueSizePx === 'function' ? el._trueSizePx() : null;
        if (box) break;
      }
      if (!box || authored) {
        if (own) own.remove();
        return;
      }
      const tag = own || document.createElement('meta');
      tag.id = id;
      tag.name = 'omelette-fixed-size';
      tag.content = box[0] + ',' + box[1];
      tag.setAttribute('data-omelette-injected', '');
      if (!own) document.head.appendChild(tag);
    }

    /** This page's print-sizing mode: 'fixed' when an explicit width AND
     *  height are authored (the page is the design's own size), else the
     *  default paper in the authored orientation. */
    _printSizingMode() {
      if (this._trueSizePx()) return 'fixed';
      const landscape = (this.getAttribute('orientation') || '').trim().toLowerCase() === 'landscape';
      return landscape ? 'default-landscape' : 'default-portrait';
    }

    /** Announces the print-sizing mode to the host app:
     *  meta[name="omelette-print-sizing"] with content 'default-portrait',
     *  'default-landscape', or 'fixed' (fixed pages also carry the
     *  omelette-fixed-size meta with the page box in px). The export path
     *  probes it to decide what true paper size to inject at print time —
     *  in the default modes the component emits no paper size of its own.
     *  Same page-global ownership rules as the fixed-size meta above:
     *  first connected doc-page owns it, an authored meta is never
     *  overridden, removed when no doc-page remains. */
    _syncPrintSizingMeta() {
      const id = 'doc-page-print-sizing';
      const own = document.getElementById(id);
      const authored = document.querySelector('meta[name="omelette-print-sizing"]:not([data-omelette-injected])');
      // A fixed page wins outright (mirroring the fixed-size loop above,
      // so the two metas can never contradict each other in a mixed
      // multi-page document); otherwise the first page's mode holds.
      let mode = null;
      for (const el of document.querySelectorAll('doc-page')) {
        if (typeof el._printSizingMode !== 'function') continue;
        const m = el._printSizingMode();
        if (m === 'fixed') {
          mode = m;
          break;
        }
        if (mode === null) mode = m;
      }
      if (!mode || authored) {
        if (own) own.remove();
        return;
      }
      // A deck-stage that connected first injected its own meta and
      // defers to any existing one — take it over, or the document ends
      // up with two conflicting injected metas (a doc-page page is the
      // document; the deck re-ensures its meta if every doc-page leaves).
      const deckMeta = document.getElementById('deck-stage-print-sizing');
      if (deckMeta) deckMeta.remove();
      const tag = own || document.createElement('meta');
      tag.id = id;
      tag.name = 'omelette-print-sizing';
      tag.content = mode;
      tag.setAttribute('data-omelette-injected', '');
      if (!own) document.head.appendChild(tag);
    }
    _scheduleMeasure() {
      if (this._raf) return;
      this._raf = requestAnimationFrame(() => {
        this._raf = null;
        this._measure();
      });
    }

    /** Slot heights feed the print spacers (--doc-hdr-h / --doc-ftr-h), so
     *  they re-measure on content mutation, resize, and font load. The
     *  same pass detects explicit pagination (direct .page children) and
     *  toggles the sheet between the flowing-document card and the
     *  page-per-card stack — content edits can add or remove pages at any
     *  time, so this tracks the same mutations the measurement does. */
    _measure() {
      const hdr = this.querySelector(':scope > [slot="header"]');
      const ftr = this.querySelector(':scope > [slot="footer"]');
      const wasPaginated = this._sheet.classList.contains('paginated');
      this._sheet.classList.toggle('paginated', this.querySelector(':scope > .page') !== null);
      // The WebKit @page margin is flowing-only, so a pagination flip
      // must re-emit the rule (content edits can add or remove .page
      // sections at any time).
      if (this._sheet.classList.contains('paginated') !== wasPaginated) {
        this._syncPrintPageRule();
      }
      this._syncSize(hdr ? hdr.offsetHeight : 0, ftr ? ftr.offsetHeight : 0);
    }
  }
  if (!customElements.get('doc-page')) {
    customElements.define('doc-page', DocPage);
  }
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "guidelines/doc-page.js", error: String((e && e.message) || e) }); }

// ui_kits/workspace/afw-workspace.jsx
try { (() => {
/* AfaqWay Workspace UI kit — icons, fake data and screens. Recreates the
   student User Workspace (design.md §18). Composes the DS primitives from the
   bundle namespace; icons are inline lucide-shaped glyphs. Exports Shell + the
   screens to window for index.html. */
const NS = window.AfaqWayDesignSystem_898d90;
const {
  Button,
  Pill,
  Status,
  StatCard,
  InfoCard,
  CompactCard,
  ActionCard,
  Accordion,
  MorphingDialog,
  MorphingDialogTrigger,
  MorphingDialogContent,
  MorphingDialogClose
} = NS;
const {
  useState
} = React;

/* ── Icons (lucide outline, currentColor) ── */
const I = p => /*#__PURE__*/React.createElement("svg", {
  width: p.s || 20,
  height: p.s || 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: p.w || 1.9,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  style: p.style
}, p.children);
const Chev = ({
  s = 26
}) => /*#__PURE__*/React.createElement("svg", {
  width: s,
  height: s,
  viewBox: "0 0 96 96"
}, /*#__PURE__*/React.createElement("g", {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "13",
  strokeLinecap: "square"
}, /*#__PURE__*/React.createElement("path", {
  d: "M29 28 48 45 67 28"
}), /*#__PURE__*/React.createElement("path", {
  d: "M29 54 48 71 67 54"
})));
const IGrid = p => /*#__PURE__*/React.createElement(I, p, /*#__PURE__*/React.createElement("rect", {
  x: "3",
  y: "3",
  width: "7",
  height: "7",
  rx: "1.5"
}), /*#__PURE__*/React.createElement("rect", {
  x: "14",
  y: "3",
  width: "7",
  height: "7",
  rx: "1.5"
}), /*#__PURE__*/React.createElement("rect", {
  x: "14",
  y: "14",
  width: "7",
  height: "7",
  rx: "1.5"
}), /*#__PURE__*/React.createElement("rect", {
  x: "3",
  y: "14",
  width: "7",
  height: "7",
  rx: "1.5"
}));
const IMap = p => /*#__PURE__*/React.createElement(I, p, /*#__PURE__*/React.createElement("path", {
  d: "M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"
}), /*#__PURE__*/React.createElement("path", {
  d: "M9 4v14M15 6v14"
}));
const IFile = p => /*#__PURE__*/React.createElement(I, p, /*#__PURE__*/React.createElement("path", {
  d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
}), /*#__PURE__*/React.createElement("path", {
  d: "M14 2v6h6"
}));
const ICal = p => /*#__PURE__*/React.createElement(I, p, /*#__PURE__*/React.createElement("rect", {
  x: "3",
  y: "4",
  width: "18",
  height: "18",
  rx: "2"
}), /*#__PURE__*/React.createElement("path", {
  d: "M3 10h18M8 2v4M16 2v4"
}));
const ICompass = p => /*#__PURE__*/React.createElement(I, p, /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "12",
  r: "10"
}), /*#__PURE__*/React.createElement("path", {
  d: "m16.2 7.8-2.9 6.6-6.6 2.9 2.9-6.6z"
}));
const IMsg = p => /*#__PURE__*/React.createElement(I, p, /*#__PURE__*/React.createElement("path", {
  d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
}));
const IBell = p => /*#__PURE__*/React.createElement(I, p, /*#__PURE__*/React.createElement("path", {
  d: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
}), /*#__PURE__*/React.createElement("path", {
  d: "M13.7 21a2 2 0 0 1-3.4 0"
}));
const ISearch = p => /*#__PURE__*/React.createElement(I, p, /*#__PURE__*/React.createElement("circle", {
  cx: "11",
  cy: "11",
  r: "8"
}), /*#__PURE__*/React.createElement("path", {
  d: "m21 21-4.3-4.3"
}));
const IUpload = p => /*#__PURE__*/React.createElement(I, p, /*#__PURE__*/React.createElement("path", {
  d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
}), /*#__PURE__*/React.createElement("path", {
  d: "M17 8l-5-5-5 5M12 3v12"
}));
const ICheck = p => /*#__PURE__*/React.createElement(I, p, /*#__PURE__*/React.createElement("path", {
  d: "M20 6 9 17l-5-5"
}));
const IClock = p => /*#__PURE__*/React.createElement(I, p, /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "12",
  r: "10"
}), /*#__PURE__*/React.createElement("path", {
  d: "M12 6v6l4 2"
}));
const IArrow = p => /*#__PURE__*/React.createElement(I, p, /*#__PURE__*/React.createElement("path", {
  d: "M5 12h14M13 6l6 6-6 6"
}));
const IPlane = p => /*#__PURE__*/React.createElement(I, p, /*#__PURE__*/React.createElement("path", {
  d: "M17.8 19.2 16 11l3.5-3.5a2.1 2.1 0 0 0-3-3L13 8 4.8 6.2a.6.6 0 0 0-.6 1l3.7 3.9-2 2-2.2-.5a.5.5 0 0 0-.5.9l2.5 1.6 1.6 2.5a.5.5 0 0 0 .9-.5l-.5-2.2 2-2 3.9 3.7a.6.6 0 0 0 1-.6z"
}));
const IHome = p => /*#__PURE__*/React.createElement(I, p, /*#__PURE__*/React.createElement("path", {
  d: "M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"
}));
const IPanel = p => /*#__PURE__*/React.createElement(I, p, /*#__PURE__*/React.createElement("rect", {
  x: "3",
  y: "3",
  width: "18",
  height: "18",
  rx: "2"
}), /*#__PURE__*/React.createElement("path", {
  d: "M9 3v18"
}));

/* ── Fake journey data ── */
const STAGES = [{
  name: "Application",
  pct: 100,
  state: "completed",
  steps: "5/5"
}, {
  name: "Admission",
  pct: 100,
  state: "completed",
  steps: "4/4"
}, {
  name: "Visa & TRP",
  pct: 62,
  state: "processing",
  steps: "5/8"
}, {
  name: "Arrival",
  pct: 0,
  state: "draft",
  steps: "0/6"
}];
const TASKS = [{
  title: "Upload translated diploma",
  due: "Due Thursday",
  state: "pending",
  icon: /*#__PURE__*/React.createElement(IFile, {
    s: 16
  })
}, {
  title: "Book VFS visa appointment",
  due: "This week",
  state: "waiting",
  icon: /*#__PURE__*/React.createElement(ICal, {
    s: 16
  })
}, {
  title: "Pay TRP state fee",
  due: "Before 12 Aug",
  state: "submitted",
  icon: /*#__PURE__*/React.createElement(ICheck, {
    s: 16
  })
}];
const DOCS = [{
  name: "Passport",
  desc: "Bio page, valid 18+ months",
  state: "approved"
}, {
  name: "Translated diploma",
  desc: "Certified EN/LT translation",
  state: "processing"
}, {
  name: "Bank statement",
  desc: "Proof of funds, last 3 months",
  state: "pending"
}, {
  name: "Health insurance",
  desc: "Valid for the full study period",
  state: "draft"
}];

/* ── Sidebar ── */
const NAV = [{
  id: "overview",
  label: "Overview",
  icon: IGrid
}, {
  id: "journey",
  label: "My Journey",
  icon: IMap
}, {
  id: "documents",
  label: "Documents",
  icon: IFile
}, {
  id: "schedule",
  label: "Schedule",
  icon: ICal
}, {
  id: "explore",
  label: "Explore Lithuania",
  icon: ICompass
}];
function Sidebar({
  nav,
  setNav,
  collapsed
}) {
  return /*#__PURE__*/React.createElement("aside", {
    style: {
      width: collapsed ? 60 : 256,
      flex: "none",
      background: "var(--surface-sidebar)",
      backdropFilter: "blur(var(--blur-lg)) saturate(1.5)",
      WebkitBackdropFilter: "blur(var(--blur-lg)) saturate(1.5)",
      border: "1px solid rgba(255,255,255,.9)",
      borderRadius: "var(--radius-2xl)",
      boxShadow: "var(--shadow-lg)",
      padding: "14px 10px",
      display: "flex",
      flexDirection: "column",
      gap: 4,
      transition: "width 200ms linear"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "8px 8px 14px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--indigo-600)",
      display: "flex"
    }
  }, /*#__PURE__*/React.createElement(Chev, {
    s: 30
  })), !collapsed && /*#__PURE__*/React.createElement("span", {
    style: {
      font: "700 20px/1 var(--font-sans)",
      color: "var(--ink)",
      letterSpacing: "-.01em"
    }
  }, "AfaqWay")), !collapsed && /*#__PURE__*/React.createElement("div", {
    style: {
      font: "600 10px/1 var(--font-sans)",
      letterSpacing: ".07em",
      textTransform: "uppercase",
      color: "var(--ink-faint)",
      padding: "6px 10px"
    }
  }, "Workspace"), NAV.map(n => {
    const active = nav === n.id;
    const Ico = n.icon;
    return /*#__PURE__*/React.createElement("button", {
      key: n.id,
      onClick: () => setNav(n.id),
      title: n.label,
      style: {
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 12,
        justifyContent: collapsed ? "center" : "flex-start",
        padding: collapsed ? "11px 0" : "11px 12px",
        borderRadius: 14,
        border: "none",
        cursor: "pointer",
        background: active ? "var(--indigo-tint)" : "transparent",
        color: active ? "var(--indigo-text)" : "var(--ink-soft)",
        font: `${active ? 600 : 500} 13px/1 var(--font-sans)`,
        textAlign: "left"
      }
    }, active && !collapsed && /*#__PURE__*/React.createElement("span", {
      style: {
        position: "absolute",
        left: 0,
        top: 10,
        bottom: 10,
        width: 3,
        borderRadius: 999,
        background: "var(--indigo-600)"
      }
    }), /*#__PURE__*/React.createElement(Ico, {
      s: 20,
      w: active ? 2.1 : 1.9
    }), !collapsed && n.label);
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "auto"
    }
  }, !collapsed && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 8px",
      borderTop: "1px solid var(--line-soft)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 34,
      height: 34,
      borderRadius: 999,
      background: "linear-gradient(180deg,#EEF2F9,#E1E8F3)",
      border: "1px solid rgba(59,65,201,.1)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      font: "700 13px/1 var(--font-sans)",
      color: "var(--indigo-600)"
    }
  }, "AE"), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "600 12.5px/16px var(--font-sans)",
      color: "var(--ink)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, "Amine El Fassi"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "400 10.5px/14px var(--font-sans)",
      color: "var(--ink-faint)"
    }
  }, "Kaunas \xB7 VMU")))));
}

/* ── Panel frame ── */
function Panel({
  title,
  action,
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("section", {
    className: "card",
    style: {
      padding: 20,
      ...style
    }
  }, (title || action) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      font: "var(--text-section-title)",
      color: "var(--ink)",
      margin: 0
    }
  }, title), action), children);
}

/* ── Screens ── */
function Overview() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(StatCard, {
    value: "65%",
    title: "Journey progress",
    icon: /*#__PURE__*/React.createElement(IMap, {
      s: 16
    }),
    trend: {
      value: "On track",
      up: true
    }
  }), /*#__PURE__*/React.createElement(StatCard, {
    value: "9/23",
    title: "Steps done",
    icon: /*#__PURE__*/React.createElement(ICheck, {
      s: 16
    }),
    accent: "var(--green)"
  }), /*#__PURE__*/React.createElement(StatCard, {
    value: "3",
    title: "Docs to upload",
    icon: /*#__PURE__*/React.createElement(IFile, {
      s: 16
    }),
    accent: "var(--amber)"
  }), /*#__PURE__*/React.createElement(StatCard, {
    value: "12 Aug",
    title: "Next deadline",
    icon: /*#__PURE__*/React.createElement(IClock, {
      s: 16
    }),
    accent: "var(--red)"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1.6fr 1fr",
      gap: 16,
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    title: "Your journey",
    action: /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      size: "md",
      onClick: () => {}
    }, "View journey")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, STAGES.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.name,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Status, {
    state: s.state,
    dotOnly: true
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "600 13.5px/18px var(--font-sans)",
      color: "var(--ink)",
      width: 120
    }
  }, s.name), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 6,
      borderRadius: 999,
      background: "var(--grey-tint)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${s.pct}%`,
      height: "100%",
      borderRadius: 999,
      background: s.pct === 100 ? "var(--green)" : "var(--indigo-600)"
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "500 11.5px/16px var(--font-sans)",
      color: "var(--ink-faint)",
      width: 34,
      textAlign: "right"
    }
  }, s.steps))))), /*#__PURE__*/React.createElement(Panel, {
    title: "Upcoming tasks"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, TASKS.map(t => /*#__PURE__*/React.createElement("div", {
    key: t.title,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 14px",
      border: "1px solid var(--line)",
      borderRadius: 14,
      background: "var(--card)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "none",
      width: 34,
      height: 34,
      borderRadius: 11,
      background: "var(--indigo-tint)",
      color: "var(--indigo-600)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, t.icon), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "600 13px/18px var(--font-sans)",
      color: "var(--ink)"
    }
  }, t.title), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "400 11px/15px var(--font-sans)",
      color: "var(--ink-faint)"
    }
  }, t.due)), /*#__PURE__*/React.createElement(Status, {
    state: t.state,
    size: "xs",
    variant: "soft"
  })))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 28,
      padding: 22,
      background: "var(--indigo-600)",
      color: "#fff",
      boxShadow: "var(--elev-2)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "600 10.5px/14px var(--font-sans)",
      letterSpacing: ".07em",
      textTransform: "uppercase",
      opacity: .8
    }
  }, "Your plan"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "700 20px/26px var(--font-sans)",
      marginTop: 8
    }
  }, "Guided \xB7 Lithuania"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "400 12.5px/18px var(--font-sans)",
      opacity: .85,
      marginTop: 4
    }
  }, "Full journey support with human document review."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "neutral",
    size: "md",
    onClick: () => {}
  }, "Manage plan"))), /*#__PURE__*/React.createElement(ActionCard, {
    icon: /*#__PURE__*/React.createElement(IUpload, {
      s: 20
    }),
    title: "Documents due",
    description: "3 documents are waiting for upload before your visa stage.",
    ctaLabel: "Upload now"
  }))));
}
function Journey() {
  const [open, setOpen] = useState("Visa & TRP");
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gap: 14
    }
  }, STAGES.map(s => /*#__PURE__*/React.createElement("button", {
    key: s.name,
    onClick: () => setOpen(s.name),
    className: "af-card af-card-compact",
    style: {
      textAlign: "left",
      padding: 16,
      borderRadius: 16,
      border: `1px solid ${open === s.name ? "var(--indigo-line)" : "var(--line)"}`,
      background: "var(--card)",
      cursor: "pointer",
      boxShadow: "var(--shadow-card)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "700 13.5px/18px var(--font-sans)",
      color: "var(--ink)"
    }
  }, s.name), /*#__PURE__*/React.createElement(Status, {
    state: s.state,
    dotOnly: true
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 5,
      borderRadius: 999,
      background: "var(--grey-tint)",
      overflow: "hidden",
      margin: "12px 0 6px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${s.pct}%`,
      height: "100%",
      background: s.pct === 100 ? "var(--green)" : "var(--indigo-600)"
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "500 11px/15px var(--font-sans)",
      color: "var(--ink-faint)"
    }
  }, s.steps, " steps")))), /*#__PURE__*/React.createElement(Panel, {
    title: `${open} — steps`
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, [{
    n: 1,
    t: "Gather visa documents",
    s: "completed"
  }, {
    n: 2,
    t: "Book VFS appointment",
    s: "processing"
  }, {
    n: 3,
    t: "Attend biometrics",
    s: "waiting"
  }, {
    n: 4,
    t: "Submit TRP application",
    s: "draft"
  }].map(st => /*#__PURE__*/React.createElement("div", {
    key: st.n,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "14px 16px",
      border: "1px solid var(--line)",
      borderRadius: 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "none",
      width: 30,
      height: 30,
      borderRadius: 999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      font: "700 13px/1 var(--font-sans)",
      background: st.s === "completed" ? "var(--green-tint)" : "var(--indigo-tint)",
      color: st.s === "completed" ? "var(--green)" : "var(--indigo-600)",
      border: `1px solid ${st.s === "completed" ? "var(--green-line)" : "var(--indigo-line)"}`
    }
  }, st.s === "completed" ? /*#__PURE__*/React.createElement(ICheck, {
    s: 15
  }) : st.n), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      font: "700 14px/20px var(--font-sans)",
      color: "var(--ink)"
    }
  }, st.t), /*#__PURE__*/React.createElement(Status, {
    state: st.s,
    size: "sm",
    variant: "outline"
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "md",
    icon: /*#__PURE__*/React.createElement(IArrow, {
      s: 15
    }),
    onClick: () => {}
  }, "Details"))))));
}
function DocRow({
  d
}) {
  return /*#__PURE__*/React.createElement(MorphingDialog, null, /*#__PURE__*/React.createElement(MorphingDialogTrigger, {
    className: "af-card af-card-compact",
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "14px 16px",
      border: "1px solid var(--line)",
      borderRadius: 16,
      background: "var(--card)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "none",
      width: 40,
      height: 40,
      borderRadius: 12,
      background: "var(--indigo-tint)",
      color: "var(--indigo-600)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(IFile, {
    s: 18
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "700 14px/20px var(--font-sans)",
      color: "var(--ink)"
    }
  }, d.name), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "400 12px/17px var(--font-sans)",
      color: "var(--ink-soft)"
    }
  }, d.desc)), /*#__PURE__*/React.createElement(Status, {
    state: d.state,
    size: "sm",
    variant: "outline"
  }), /*#__PURE__*/React.createElement(Button, {
    variant: d.state === "approved" ? "neutral" : "primary",
    size: "md",
    icon: d.state === "approved" ? null : /*#__PURE__*/React.createElement(IUpload, {
      s: 15
    }),
    onClick: e => e.stopPropagation()
  }, d.state === "approved" ? "Replace" : "Upload")), /*#__PURE__*/React.createElement(MorphingDialogContent, {
    style: {
      background: "var(--card)",
      padding: 22,
      boxShadow: "var(--shadow-lg)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 44,
      height: 44,
      borderRadius: 13,
      background: "var(--indigo-tint)",
      color: "var(--indigo-600)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(IFile, {
    s: 20
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "700 16px/22px var(--font-sans)",
      color: "var(--ink)"
    }
  }, d.name)), /*#__PURE__*/React.createElement(MorphingDialogClose, null)), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "400 13px/20px var(--font-sans)",
      color: "var(--ink-soft)",
      marginTop: 14
    }
  }, d.desc), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement(Status, {
    state: d.state,
    size: "sm",
    variant: "soft"
  }), /*#__PURE__*/React.createElement(Button, {
    variant: d.state === "approved" ? "neutral" : "primary",
    size: "md",
    icon: d.state === "approved" ? null : /*#__PURE__*/React.createElement(IUpload, {
      s: 15
    }),
    onClick: () => {}
  }, d.state === "approved" ? "Replace file" : "Upload file"))));
}
function Documents() {
  return /*#__PURE__*/React.createElement(Panel, {
    title: "Documents \u2014 Visa & TRP",
    action: /*#__PURE__*/React.createElement(Pill, {
      tone: "indigo"
    }, "Active stage")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, DOCS.map(d => /*#__PURE__*/React.createElement(DocRow, {
    key: d.name,
    d: d
  }))));
}
function Messages() {
  const {
    Bubble,
    BubbleContent,
    Message,
    MessageAvatar,
    MessageContent,
    MessageFooter,
    BubbleReactions
  } = NS;
  const [msgs, setMsgs] = useState([{
    me: false,
    t: "Hi Amine — your diploma translation has arrived and is under review. I'll confirm within a day.",
    at: "09:12"
  }, {
    me: true,
    t: "Thank you! Should I book the VFS appointment now or wait?",
    at: "09:14"
  }, {
    me: false,
    t: "Go ahead and book it — pick any slot after the 8th.",
    at: "09:15"
  }]);
  const [draft, setDraft] = useState("");
  const send = () => {
    if (!draft.trim()) return;
    setMsgs(m => [...m, {
      me: true,
      t: draft,
      at: "now"
    }]);
    setDraft("");
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: 0,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      height: 520,
      background: "#fff"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "chat-header"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 999,
      background: "var(--indigo-600)",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flex: "none"
    }
  }, /*#__PURE__*/React.createElement(Chev, {
    s: 22
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "chat-header-name"
  }, "AfaqWay Advisor"), /*#__PURE__*/React.createElement("div", {
    className: "chat-header-sub"
  }, /*#__PURE__*/React.createElement(Status, {
    state: "online",
    size: "xs",
    variant: "plain"
  })))), /*#__PURE__*/React.createElement("div", {
    className: "chat-thread",
    style: {
      flex: 1,
      background: "#fff",
      display: "flex",
      flexDirection: "column",
      gap: 12,
      padding: 18,
      overflowY: "auto"
    }
  }, msgs.map((m, i) => /*#__PURE__*/React.createElement(Message, {
    key: i,
    align: m.me ? "end" : "start"
  }, !m.me && /*#__PURE__*/React.createElement(MessageAvatar, null, "AW"), /*#__PURE__*/React.createElement(MessageContent, {
    align: m.me ? "end" : "start"
  }, /*#__PURE__*/React.createElement(Bubble, {
    align: m.me ? "end" : "start"
  }, /*#__PURE__*/React.createElement(BubbleContent, {
    variant: m.me ? "default" : "secondary"
  }, m.t)), /*#__PURE__*/React.createElement(MessageFooter, {
    align: m.me ? "end" : "start"
  }, m.at))))), /*#__PURE__*/React.createElement("div", {
    className: "chat-composer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "af-composer"
  }, /*#__PURE__*/React.createElement("input", {
    className: "af-composer-input",
    placeholder: "Message your advisor\u2026",
    value: draft,
    onChange: e => setDraft(e.target.value),
    onKeyDown: e => e.key === "Enter" && send()
  }), /*#__PURE__*/React.createElement("button", {
    className: "chat-send",
    onClick: send
  }, "Send", /*#__PURE__*/React.createElement(IArrow, {
    s: 15
  })))));
}
const TITLES = {
  overview: "Overview",
  journey: "My Journey",
  documents: "Documents",
  schedule: "Schedule",
  explore: "Explore Lithuania"
};
const SCREENS = {
  overview: Overview,
  journey: Journey,
  documents: Documents
};
function Shell() {
  const [nav, setNav] = useState("overview");
  const [collapsed, setCollapsed] = useState(false);
  const [msg, setMsg] = useState(false);
  const Screen = msg ? Messages : SCREENS[nav] || Overview;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100vh",
      background: "var(--sw-gradient)",
      position: "relative",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      width: 460,
      height: 460,
      borderRadius: 999,
      background: "var(--blob-1)",
      filter: "blur(var(--blur-xl))",
      top: -180,
      left: -120,
      zIndex: 0
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      width: 420,
      height: 420,
      borderRadius: 999,
      background: "var(--blob-2)",
      filter: "blur(var(--blur-xl))",
      bottom: -200,
      right: -140,
      zIndex: 0
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      zIndex: 1,
      display: "flex",
      gap: 18,
      padding: 18,
      minHeight: "100vh",
      boxSizing: "border-box"
    }
  }, /*#__PURE__*/React.createElement(Sidebar, {
    nav: nav,
    setNav: id => {
      setNav(id);
      setMsg(false);
    },
    collapsed: collapsed
  }), /*#__PURE__*/React.createElement("main", {
    style: {
      flex: 1,
      minWidth: 0,
      display: "flex",
      flexDirection: "column",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setCollapsed(v => !v),
    "aria-label": "Toggle sidebar",
    style: {
      width: 38,
      height: 38,
      borderRadius: 12,
      border: "1px solid var(--line)",
      background: "var(--card)",
      color: "var(--ink-soft)",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flex: "none"
    }
  }, /*#__PURE__*/React.createElement(IPanel, {
    s: 18
  })), /*#__PURE__*/React.createElement("h1", {
    style: {
      font: "var(--text-page-title)",
      color: "var(--ink)",
      margin: 0,
      flex: 1
    }
  }, msg ? "Messages" : TITLES[nav]), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setMsg(true),
    "aria-label": "Messages",
    style: {
      width: 40,
      height: 40,
      borderRadius: 999,
      border: "1px solid var(--line)",
      background: msg ? "var(--indigo-tint)" : "var(--card)",
      color: msg ? "var(--indigo-600)" : "var(--ink-soft)",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(IMsg, {
    s: 19
  })), /*#__PURE__*/React.createElement("button", {
    "aria-label": "Notifications",
    style: {
      position: "relative",
      width: 40,
      height: 40,
      borderRadius: 999,
      border: "1px solid var(--line)",
      background: "var(--card)",
      color: "var(--ink-soft)",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(IBell, {
    s: 19
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: 7,
      right: 8,
      width: 8,
      height: 8,
      borderRadius: 999,
      background: "var(--red)",
      border: "2px solid var(--card)"
    }
  })))), /*#__PURE__*/React.createElement(Screen, null))));
}
Object.assign(window, {
  AfwShell: Shell
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/workspace/afw-workspace.jsx", error: String((e && e.message) || e) }); }

__ds_ns.BubbleGroup = __ds_scope.BubbleGroup;

__ds_ns.Bubble = __ds_scope.Bubble;

__ds_ns.BubbleContent = __ds_scope.BubbleContent;

__ds_ns.BubbleReactions = __ds_scope.BubbleReactions;

__ds_ns.MessageGroup = __ds_scope.MessageGroup;

__ds_ns.Message = __ds_scope.Message;

__ds_ns.MessageAvatar = __ds_scope.MessageAvatar;

__ds_ns.MessageContent = __ds_scope.MessageContent;

__ds_ns.MessageHeader = __ds_scope.MessageHeader;

__ds_ns.MessageFooter = __ds_scope.MessageFooter;

__ds_ns.BentoGrid = __ds_scope.BentoGrid;

__ds_ns.BentoCard = __ds_scope.BentoCard;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.FeatureCard = __ds_scope.FeatureCard;

__ds_ns.InfoCard = __ds_scope.InfoCard;

__ds_ns.CompactCard = __ds_scope.CompactCard;

__ds_ns.StatCard = __ds_scope.StatCard;

__ds_ns.Cards = __ds_scope.Cards;

__ds_ns.ActionCard = __ds_scope.ActionCard;

__ds_ns.Divider = __ds_scope.Divider;

__ds_ns.Loader = __ds_scope.Loader;

__ds_ns.Pill = __ds_scope.Pill;

__ds_ns.Status = __ds_scope.Status;

__ds_ns.Accordion = __ds_scope.Accordion;

__ds_ns.AlertDialog = __ds_scope.AlertDialog;

__ds_ns.AlertDialogMedia = __ds_scope.AlertDialogMedia;

__ds_ns.AlertDialogHeader = __ds_scope.AlertDialogHeader;

__ds_ns.AlertDialogTitle = __ds_scope.AlertDialogTitle;

__ds_ns.AlertDialogDescription = __ds_scope.AlertDialogDescription;

__ds_ns.AlertDialogFooter = __ds_scope.AlertDialogFooter;

__ds_ns.AlertDialogAction = __ds_scope.AlertDialogAction;

__ds_ns.AlertDialogCancel = __ds_scope.AlertDialogCancel;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.DialogHeader = __ds_scope.DialogHeader;

__ds_ns.DialogTitle = __ds_scope.DialogTitle;

__ds_ns.DialogDescription = __ds_scope.DialogDescription;

__ds_ns.DialogFooter = __ds_scope.DialogFooter;

__ds_ns.DialogClose = __ds_scope.DialogClose;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.GooeyStack = __ds_scope.GooeyStack;

__ds_ns.MetricCard = __ds_scope.MetricCard;

__ds_ns.MorphingDialog = __ds_scope.MorphingDialog;

__ds_ns.MorphingDialogTrigger = __ds_scope.MorphingDialogTrigger;

__ds_ns.MorphingDialogContent = __ds_scope.MorphingDialogContent;

__ds_ns.MorphingDialogClose = __ds_scope.MorphingDialogClose;

__ds_ns.Skeleton = __ds_scope.Skeleton;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Toaster = __ds_scope.Toaster;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.TextArea = __ds_scope.TextArea;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Toggle = __ds_scope.Toggle;

__ds_ns.Controls = __ds_scope.Controls;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.FloatingToolbar = __ds_scope.FloatingToolbar;

__ds_ns.MegaMenu = __ds_scope.MegaMenu;

})();
