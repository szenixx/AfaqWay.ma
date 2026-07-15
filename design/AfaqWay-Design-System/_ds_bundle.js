/* @ds-bundle: {"format":4,"namespace":"AfaqWayDesignSystem_b3fe60","components":[{"name":"Button","sourcePath":"components/buttons/Button.jsx"},{"name":"TopBar","sourcePath":"components/chrome/TopBar.jsx"},{"name":"Flag","sourcePath":"components/flags/Flag.jsx"},{"name":"Field","sourcePath":"components/forms/Field.jsx"},{"name":"ICON_NAMES","sourcePath":"components/icons/Icon.jsx"},{"name":"Icon","sourcePath":"components/icons/Icon.jsx"},{"name":"STATUS","sourcePath":"components/status/StatusBadge.jsx"},{"name":"StatusBadge","sourcePath":"components/status/StatusBadge.jsx"},{"name":"StatusPill","sourcePath":"components/status/StatusPill.jsx"},{"name":"Card","sourcePath":"components/surfaces/Card.jsx"},{"name":"Divider","sourcePath":"components/surfaces/Card.jsx"}],"sourceHashes":{"components/buttons/Button.jsx":"2b43c2a91d14","components/chrome/TopBar.jsx":"6a69be3e295e","components/flags/Flag.jsx":"5998e761a9df","components/forms/Field.jsx":"294a43744ad2","components/icons/Icon.jsx":"562d400aae02","components/status/StatusBadge.jsx":"8130adabd5bb","components/status/StatusPill.jsx":"608afd0e3698","components/surfaces/Card.jsx":"e69d26129bd0"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.AfaqWayDesignSystem_b3fe60 = window.AfaqWayDesignSystem_b3fe60 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/buttons/Button.jsx
try { (() => {
const {
  useState
} = React;
const FILLS = {
  primary: {
    bg: 'var(--indigo-600)',
    hover: 'var(--indigo-500)',
    press: 'var(--indigo-700)',
    color: '#FFFFFF',
    border: 'none'
  },
  ghost: {
    bg: 'transparent',
    hover: 'var(--indigo-100)',
    press: 'var(--indigo-100)',
    color: 'var(--indigo-600)',
    border: '1.5px solid var(--indigo-600)'
  },
  neutral: {
    bg: 'var(--subtle)',
    hover: '#EBEEF4',
    press: '#E3E8F0',
    color: 'var(--ink-soft)',
    border: '1px solid var(--line)'
  },
  destructive: {
    bg: 'var(--red)',
    hover: '#C04834',
    press: '#9E3322',
    color: '#FFFFFF',
    border: 'none'
  }
};
function Button({
  variant = 'primary',
  size = 'md',
  icon,
  disabled,
  children,
  onClick,
  style
}) {
  const [st, setSt] = useState(0); // 0 rest, 1 hover, 2 press
  const v = FILLS[variant] || FILLS.primary;
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    disabled: disabled,
    onMouseEnter: () => setSt(1),
    onMouseLeave: () => setSt(0),
    onMouseDown: () => setSt(2),
    onMouseUp: () => setSt(1),
    style: {
      font: '600 ' + (size === 'lg' ? '15px' : '14px') + '/20px var(--font-sans)',
      height: size === 'lg' ? 44 : 40,
      padding: '0 20px',
      borderRadius: 'var(--radius-md)',
      background: st === 2 ? v.press : st === 1 ? v.hover : v.bg,
      color: v.color,
      border: v.border,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.4 : 1,
      transition: 'background 120ms cubic-bezier(.4,0,.2,1)',
      ...style
    }
  }, icon, children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/Button.jsx", error: String((e && e.message) || e) }); }

// components/flags/Flag.jsx
try { (() => {
const SIZES = {
  lg: {
    w: 42,
    h: 30,
    r: 5
  },
  md: {
    w: 24,
    h: 18,
    r: 3
  },
  sm: {
    w: 16,
    h: 12,
    r: 2
  }
};
function Flag({
  src,
  stripes,
  emoji,
  size = 'md',
  unavailable,
  selected,
  style
}) {
  const s = SIZES[size] || SIZES.md;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      width: s.w,
      height: s.h,
      borderRadius: s.r,
      overflow: 'hidden',
      display: 'inline-flex',
      flexDirection: 'column',
      flex: 'none',
      border: selected ? '1.5px solid var(--indigo-600)' : '1px solid rgba(0,0,0,.08)',
      filter: unavailable ? 'grayscale(.55)' : 'none',
      opacity: unavailable ? 0.72 : 1,
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: s.h * 0.8,
      lineHeight: 1,
      background: '#fff',
      ...style
    }
  }, src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: "",
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: 'block'
    }
  }) : stripes ? stripes.map((c, i) => /*#__PURE__*/React.createElement("i", {
    key: i,
    style: {
      flex: 1,
      alignSelf: 'stretch',
      background: c
    }
  })) : emoji);
}
Object.assign(__ds_scope, { Flag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/flags/Flag.jsx", error: String((e && e.message) || e) }); }

// components/forms/Field.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Field({
  label,
  optional,
  hint,
  as = 'input',
  children,
  style,
  ...rest
}) {
  const Tag = as;
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      ...style
    }
  }, label ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 13px/20px var(--font-sans)',
      color: 'var(--ink)'
    }
  }, label, optional ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--ink-faint)',
      fontWeight: 400
    }
  }, " (", optional, ")") : null) : null, /*#__PURE__*/React.createElement(Tag, _extends({
    className: "af"
  }, rest), as === 'select' || as === 'textarea' ? children : undefined), hint ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 12px/17px var(--font-sans)',
      color: 'var(--ink-faint)'
    }
  }, hint) : null);
}
Object.assign(__ds_scope, { Field });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Field.jsx", error: String((e && e.message) || e) }); }

// components/icons/Icon.jsx
try { (() => {
const P = {
  'status-not-started': '<circle cx="10" cy="10" r="7"/>',
  'status-applied': '<path d="M17.5 2.5 2 9.6l6 2.3 2.3 6L17.5 2.5Z"/><path d="M10.3 11.9 13.7 8.5"/>',
  'status-under-review': '<circle cx="10" cy="10" r="7"/><path d="M10 6.5v3.7l2.6 1.7"/>',
  'status-needs-changes': '<circle cx="10" cy="10" r="7"/><path d="M10 6.7v4M10 13.6h.01"/>',
  'status-approved': '<circle cx="10" cy="10" r="7"/><path d="M7 10.3 9.2 12.5 13.3 7.8"/>',
  document: '<path d="M6 2.5h6l3 3v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-14a1 1 0 0 1 1-1Z"/><path d="M12 2.5V6h3.5"/>',
  upload: '<path d="M10 13V4M6.5 7.5 10 4l3.5 3.5"/><path d="M4 14v2a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-2"/>',
  passport: '<rect x="5" y="2.5" width="10" height="15" rx="2"/><circle cx="10" cy="8" r="2"/><path d="M8 13h4"/>',
  diploma: '<path d="M2 8l8-4 8 4-8 4-8-4Z"/><path d="M6 10v4c0 1 1.8 2 4 2s4-1 4-2v-4"/>',
  calendar: '<rect x="3" y="4" width="14" height="13" rx="2"/><path d="M3 8h14M7 2.5v3M13 2.5v3"/><circle cx="10" cy="12.5" r="1.3"/>',
  chat: '<path d="M3 4.5h14v9H8l-4 3.5v-3.5H3Z"/>',
  phone: '<path d="M4 3.5c0-.6.4-1 1-1h2.3c.5 0 .9.3 1 .8l.7 2.6c.1.4 0 .8-.3 1.1L7.4 8.3a11 11 0 0 0 4.3 4.3l1.3-1.3c.3-.3.7-.4 1.1-.3l2.6.7c.5.1.8.5.8 1V15c0 .6-.4 1-1 1h-1C9.8 16 4 10.2 4 4.5Z"/>',
  email: '<rect x="2.5" y="4.5" width="15" height="11" rx="1.5"/><path d="M3 5.5 10 11l7-5.5"/>',
  payment: '<rect x="2.5" y="5" width="15" height="10" rx="2"/><path d="M2.5 8.5h15"/>',
  search: '<circle cx="9" cy="9" r="6"/><path d="M17.5 17.5 14 14"/>',
  bell: '<path d="M10 2.5a5 5 0 0 0-5 5v3l-1.5 3h13L15 10.5v-3a5 5 0 0 0-5-5Z"/><path d="M8 16.5a2 2 0 0 0 4 0"/>',
  settings: '<circle cx="10" cy="10" r="2.6"/><path d="M10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15.4 4.6l-1.4 1.4M6 12.6l-1.4 1.4M15.4 15.4l-1.4-1.4M6 7.4 4.6 6"/>',
  'chevron-down': '<path d="M5 8l5 5 5-5"/>',
  logout: '<path d="M8 3H4.5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1H8M12 6l4 4-4 4M16 10H8"/>'
};
const ICON_NAMES = Object.keys(P);
function Icon({
  name,
  size = 20,
  color,
  style
}) {
  const body = P[name] || '';
  const sw = size < 16 ? 1.5 : 1.75;
  return /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 20 20",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: sw,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: {
      color: color,
      flex: 'none',
      ...style
    },
    dangerouslySetInnerHTML: {
      __html: body
    }
  });
}
Object.assign(__ds_scope, { ICON_NAMES, Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/icons/Icon.jsx", error: String((e && e.message) || e) }); }

// components/chrome/TopBar.jsx
try { (() => {
const {
  useState
} = React;
function IconBtn({
  name,
  dot,
  label
}) {
  const [h, setH] = useState(false);
  return /*#__PURE__*/React.createElement("button", {
    "aria-label": label,
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      position: 'relative',
      width: 36,
      height: 36,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: h ? 'var(--indigo-100)' : 'transparent',
      border: 'none',
      borderRadius: 8,
      cursor: 'pointer',
      color: h ? 'var(--ink)' : 'var(--ink-soft)',
      transition: 'background 120ms cubic-bezier(.4,0,.2,1)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: name,
    size: 20
  }), dot ? /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 6,
      right: 7,
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: 'var(--indigo-600)'
    }
  }) : null);
}
function MenuRow({
  icon,
  children,
  danger,
  right
}) {
  const [h, setH] = useState(false);
  return /*#__PURE__*/React.createElement("button", {
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      width: '100%',
      height: 36,
      padding: '0 12px',
      borderRadius: 8,
      border: 'none',
      cursor: 'pointer',
      background: h ? 'var(--indigo-100)' : 'transparent',
      font: '500 13px/20px var(--font-sans)',
      color: danger ? 'var(--red)' : h ? 'var(--ink)' : 'var(--ink-soft)',
      transition: 'background 120ms cubic-bezier(.4,0,.2,1)'
    }
  }, icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 16,
    color: danger ? 'var(--red)' : undefined
  }) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      textAlign: 'left'
    }
  }, children), right);
}
function TopBar({
  name = 'Student name',
  role = 'Student',
  avatar,
  unreadBell = true,
  unreadMail = false,
  defaultOpen = false
}) {
  const [open, setOpen] = useState(defaultOpen);
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: 'relative',
      height: 60,
      background: 'var(--card)',
      borderBottom: '1px solid var(--line)',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '0 20px',
      fontFamily: 'var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "28",
    height: "28",
    viewBox: "0 0 96 96",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("rect", {
    width: "96",
    height: "96",
    rx: "24",
    fill: "var(--indigo-600)"
  }), /*#__PURE__*/React.createElement("g", {
    fill: "none",
    stroke: "#FFFFFF",
    strokeWidth: "13",
    strokeLinecap: "square",
    strokeLinejoin: "miter"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M29 28 48 45 67 28"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M29 54 48 71 67 54"
  }))), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '700 17px/24px var(--font-sans)',
      color: 'var(--ink)',
      letterSpacing: '-0.01em'
    }
  }, "AfaqWay")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 360,
      height: 38,
      background: 'var(--subtle)',
      borderRadius: 10,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '0 12px',
      color: 'var(--ink-faint)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "search",
    size: 16
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 13px/20px var(--font-sans)'
    }
  }, "Search"))), /*#__PURE__*/React.createElement(IconBtn, {
    name: "bell",
    dot: unreadBell,
    label: "Notifications"
  }), /*#__PURE__*/React.createElement(IconBtn, {
    name: "email",
    dot: unreadMail,
    label: "Messages"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 1,
      height: 24,
      background: 'var(--line)',
      margin: '0 12px'
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => setOpen(!open),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: 4,
      borderRadius: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 36,
      height: 36,
      borderRadius: '50%',
      background: 'var(--indigo-100)',
      color: 'var(--indigo-600)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      font: '600 13px/1 var(--font-sans)',
      boxShadow: '0 0 0 2px var(--card)',
      overflow: 'hidden'
    }
  }, avatar ? /*#__PURE__*/React.createElement("img", {
    src: avatar,
    alt: "",
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }) : name.split(' ').map(w => w[0]).slice(0, 2).join('')), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '600 13px/16px var(--font-sans)',
      color: 'var(--ink)'
    }
  }, name), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 11px/14px var(--font-sans)',
      color: 'var(--ink-soft)'
    }
  }, role)), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-down",
    size: 12,
    color: "var(--ink-faint)"
  })), open ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 60,
      right: 20,
      marginTop: 6,
      minWidth: 200,
      background: 'var(--card)',
      border: '1px solid var(--line)',
      borderRadius: 12,
      boxShadow: 'var(--shadow-card)',
      padding: 6,
      zIndex: 20
    }
  }, /*#__PURE__*/React.createElement(MenuRow, {
    icon: "passport"
  }, "My profile"), /*#__PURE__*/React.createElement(MenuRow, {
    icon: "settings"
  }, "Settings"), /*#__PURE__*/React.createElement(MenuRow, {
    right: /*#__PURE__*/React.createElement(__ds_scope.Flag, {
      size: "sm",
      emoji: "\uD83C\uDDEC\uD83C\uDDE7"
    })
  }, "Language"), /*#__PURE__*/React.createElement("hr", {
    style: {
      border: 'none',
      borderTop: '1px solid var(--line-soft)',
      margin: '6px 0'
    }
  }), /*#__PURE__*/React.createElement(MenuRow, {
    icon: "logout",
    danger: true
  }, "Log out")) : null);
}
Object.assign(__ds_scope, { TopBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/chrome/TopBar.jsx", error: String((e && e.message) || e) }); }

// components/status/StatusBadge.jsx
try { (() => {
const STATUS = {
  'not-started': {
    label: 'Not started',
    text: 'var(--grey)',
    tint: 'var(--grey-tint)',
    line: 'var(--grey-line)',
    icon: 'status-not-started'
  },
  applied: {
    label: 'Applied',
    text: 'var(--indigo-text)',
    tint: 'var(--indigo-tint)',
    line: 'var(--indigo-line)',
    icon: 'status-applied'
  },
  'under-review': {
    label: 'Under review',
    text: 'var(--amber)',
    tint: 'var(--amber-tint)',
    line: 'var(--amber-line)',
    icon: 'status-under-review'
  },
  'needs-changes': {
    label: 'Needs changes',
    text: 'var(--red)',
    tint: 'var(--red-tint)',
    line: 'var(--red-line)',
    icon: 'status-needs-changes'
  },
  approved: {
    label: 'Approved',
    text: 'var(--green)',
    tint: 'var(--green-tint)',
    line: 'var(--green-line)',
    icon: 'status-approved'
  }
};
function StatusBadge({
  status = 'not-started',
  size = 32,
  label,
  caption
}) {
  const s = STATUS[status] || STATUS['not-started'];
  const badge = /*#__PURE__*/React.createElement("span", {
    style: {
      width: size,
      height: size,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 'none',
      background: s.tint,
      color: s.text,
      border: '1.5px solid ' + s.line
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: s.icon,
    size: Math.round(size * 0.62)
  }));
  if (!label) return badge;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 12
    }
  }, badge, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 13.5px/20px var(--font-sans)',
      color: 'var(--ink)'
    }
  }, label), caption ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 12px/17px var(--font-sans)',
      color: 'var(--ink-faint)'
    }
  }, caption) : null));
}
Object.assign(__ds_scope, { STATUS, StatusBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/status/StatusBadge.jsx", error: String((e && e.message) || e) }); }

// components/status/StatusPill.jsx
try { (() => {
function StatusPill({
  status = 'not-started',
  children
}) {
  const s = __ds_scope.STATUS[status] || __ds_scope.STATUS['not-started'];
  return /*#__PURE__*/React.createElement("span", {
    style: {
      font: '600 10.5px/1 var(--font-sans)',
      letterSpacing: '.05em',
      textTransform: 'uppercase',
      padding: '5px 12px',
      borderRadius: 999,
      border: '1px solid ' + s.line,
      color: s.text,
      background: s.tint,
      display: 'inline-flex',
      alignItems: 'center'
    }
  }, children || s.label);
}
Object.assign(__ds_scope, { StatusPill });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/status/StatusPill.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/Card.jsx
try { (() => {
function Card({
  eyebrow,
  title,
  children,
  padding = 24,
  style
}) {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--card)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-card)',
      padding,
      ...style
    }
  }, eyebrow ? /*#__PURE__*/React.createElement("div", {
    style: {
      font: '600 10.5px/14px var(--font-sans)',
      letterSpacing: '.08em',
      textTransform: 'uppercase',
      color: 'var(--ink-faint)',
      marginBottom: 8
    }
  }, eyebrow) : null, title ? /*#__PURE__*/React.createElement("h3", {
    style: {
      font: '600 18px/24px var(--font-sans)',
      color: 'var(--ink)',
      margin: '0 0 12px'
    }
  }, title) : null, children);
}
function Divider({
  margin = 16
}) {
  return /*#__PURE__*/React.createElement("hr", {
    style: {
      border: 'none',
      borderTop: '1px solid var(--line-soft)',
      margin: margin + 'px 0'
    }
  });
}
Object.assign(__ds_scope, { Card, Divider });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/Card.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.TopBar = __ds_scope.TopBar;

__ds_ns.Flag = __ds_scope.Flag;

__ds_ns.Field = __ds_scope.Field;

__ds_ns.ICON_NAMES = __ds_scope.ICON_NAMES;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.STATUS = __ds_scope.STATUS;

__ds_ns.StatusBadge = __ds_scope.StatusBadge;

__ds_ns.StatusPill = __ds_scope.StatusPill;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Divider = __ds_scope.Divider;

})();
