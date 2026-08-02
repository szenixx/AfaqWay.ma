import React from "react";

/* AfaqWay MetricCard — one card for every statistic on the platform: a pastel
   header with a white circular icon, an oversized outline watermark behind the
   content, big number, title, description and a trend badge. Only tone/icon/
   copy/data differ. Ported from the codebase .mc system. */

const ITrendUp = ({ s = 12 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 7l-8.5 8.5-5-5L2 17" /><path d="M16 7h6v6" /></svg>);
const ITrendDown = ({ s = 12 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 17l-8.5-8.5-5 5L2 7" /><path d="M16 17h6v-6" /></svg>);

export function MetricCard({ tone = "blue", icon, watermark, value, title, subtitle, badge, style }) {
  return (
    <div className={`mc mc-${tone}`} style={style}>
      <div className="mc-head">
        <span className="mc-ico">{icon}</span>
      </div>
      {watermark && <span className="mc-watermark">{watermark}</span>}
      <div className="mc-body">
        <div className="mc-value">{value}</div>
        <div className="mc-title">{title}</div>
        {subtitle && <p className="mc-sub">{subtitle}</p>}
        {badge && (
          <div className="mc-foot">
            <span className="mc-badge">
              {badge.up != null && (badge.up ? <ITrendUp /> : <ITrendDown />)}
              {badge.label}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default MetricCard;
