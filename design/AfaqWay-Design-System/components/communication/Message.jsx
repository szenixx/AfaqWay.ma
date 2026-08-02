import React from "react";

/* AfaqWay Message — the row wrapper around <Bubble>: avatar, content column,
   and header/footer meta (sender name, timestamp, reactions). MessageGroup
   stacks consecutive messages from the same sender under one avatar. */

export function MessageGroup({ children, style }) {
  return <div className="msg-group" style={style}>{children}</div>;
}

export function Message({ align = "start", children, style }) {
  return (
    <div className="msg" data-align={align} style={{ flexDirection: align === "end" ? "row-reverse" : "row", ...style }}>
      {children}
    </div>
  );
}

export function MessageAvatar({ children, style }) {
  return <div className="msg-avatar" style={style}>{children}</div>;
}

export function MessageContent({ align = "start", children, style }) {
  return <div className="msg-content" data-align={align} style={style}>{children}</div>;
}

export function MessageHeader({ children, style }) {
  return <div className="msg-header" style={style}>{children}</div>;
}

export function MessageFooter({ align = "start", children, style }) {
  return <div className="msg-footer" data-align={align} style={{ justifyContent: align === "end" ? "flex-end" : "flex-start", ...style }}>{children}</div>;
}
