export { Layout } from "./Layout";
export { Header } from "./Header";
export { Footer } from "./Footer";
export { Button } from "./Button";
export { StatusBanner, type StatusTone } from "./StatusBanner";
export { AlertBox, type AlertKind } from "./AlertBox";
export { InformationCard, type InfoRow } from "./InformationCard";
export { UserInfoSection } from "./UserInfoSection";
export { JourneyStatusCard } from "./JourneyStatusCard";
export { PaymentSummary, type PaymentLine } from "./PaymentSummary";
export { Divider } from "./Divider";
export { SocialLinks } from "./SocialLinks";

/* Body copy: use @react-email/components' own Text/Heading directly in
 * templates with the shared tokens (src/lib/email/tokens.ts) — there's no
 * value in wrapping them, they already have no chrome of their own. */
