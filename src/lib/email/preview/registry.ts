import type { ReactElement } from "react";
import type { TemplateMeta } from "../types";

import VerificationEmail, { meta as verificationMeta } from "../templates/auth/VerificationEmail";
import ResetPasswordEmail, { meta as resetPasswordMeta } from "../templates/auth/ResetPasswordEmail";
import ChangeEmailEmail, { meta as changeEmailMeta } from "../templates/auth/ChangeEmailEmail";
import MagicLinkEmail, { meta as magicLinkMeta } from "../templates/auth/MagicLinkEmail";
import InviteEmail, { meta as inviteMeta } from "../templates/auth/InviteEmail";
import ReauthenticationEmail, { meta as reauthenticationMeta } from "../templates/auth/ReauthenticationEmail";
import WelcomeEmail, { meta as welcomeMeta } from "../templates/auth/WelcomeEmail";
import AnnouncementEmail, { meta as announcementMeta } from "../templates/notifications/AnnouncementEmail";
import AdvisorMessageEmail, { meta as advisorMeta } from "../templates/advisor/AdvisorMessageEmail";
import JourneyDecisionEmail, { meta as journeyDecisionMeta } from "../templates/advisor/JourneyDecisionEmail";
import PaymentReceiptEmail, { meta as paymentReceiptMeta } from "../templates/billing/PaymentReceiptEmail";

/* The one registry /dev/emails reads. Adding a template to this list is
 * what makes it show up in the preview UI — nothing about the preview
 * route itself needs to change. Mock data here is illustrative only, never
 * sent anywhere. */

export type PreviewEntry = {
  id: string;
  meta: TemplateMeta;
  label: string;
  render: () => ReactElement;
};

export const PREVIEW_REGISTRY: PreviewEntry[] = [
  {
    id: "auth-verification", meta: verificationMeta, label: "Confirm signup (verification)",
    render: () => VerificationEmail({ confirmationUrl: "https://afaqway.com/auth/callback?token=preview" }),
  },
  {
    id: "auth-reset-password", meta: resetPasswordMeta, label: "Reset password",
    render: () => ResetPasswordEmail({ confirmationUrl: "https://afaqway.com/auth/callback?token=preview" }),
  },
  {
    id: "auth-change-email", meta: changeEmailMeta, label: "Change email address",
    render: () => ChangeEmailEmail({ confirmationUrl: "https://afaqway.com/auth/callback?token=preview", oldEmail: "hamza.old@example.com", newEmail: "hamza.new@example.com" }),
  },
  {
    id: "auth-magic-link", meta: magicLinkMeta, label: "Magic link",
    render: () => MagicLinkEmail({ confirmationUrl: "https://afaqway.com/auth/callback?token=preview" }),
  },
  {
    id: "auth-invite", meta: inviteMeta, label: "Invite user",
    render: () => InviteEmail({ confirmationUrl: "https://afaqway.com/auth/callback?token=preview", inviterName: "Sara" }),
  },
  {
    id: "auth-reauthentication", meta: reauthenticationMeta, label: "Reauthentication code",
    render: () => ReauthenticationEmail({ token: "482913" }),
  },
  {
    id: "auth-welcome", meta: welcomeMeta, label: "Welcome",
    render: () => WelcomeEmail({ studentName: "Hamza" }),
  },
  {
    id: "notifications-announcement", meta: announcementMeta, label: "Platform announcement",
    render: () => AnnouncementEmail({ message: "Your document review is complete.\n\nThe visa application checklist for your file has been updated — two items were approved and one needs a re-upload. Open your workspace to see which one." }),
  },
  {
    id: "advisor-message", meta: advisorMeta, label: "Advisor message",
    render: () => AdvisorMessageEmail({ message: "I reviewed your latest submission and it looks great. One small thing: could you re-upload page 2 of your transcript, it was slightly cropped.", recipientName: "Hamza" }),
  },
  {
    id: "advisor-journey-decision", meta: journeyDecisionMeta, label: "Journey decision",
    render: () => JourneyDecisionEmail({ studentName: "Hamza", outcome: "changes_requested", stageTitle: "Document preparation", stepTitle: "Upload transcript", note: "Page 2 is cropped, please re-upload a full scan." }),
  },
  {
    id: "billing-payment-receipt", meta: paymentReceiptMeta, label: "Payment receipt",
    render: () => PaymentReceiptEmail({ studentName: "Hamza", planName: "Full Service", amount: "12,000 DH", method: "Bank transfer", reference: "AFW-2026-0042", reviewedDate: "August 9, 2026" }),
  },
];

export function findPreviewEntry(id: string): PreviewEntry | undefined {
  return PREVIEW_REGISTRY.find((e) => e.id === id);
}

/* Supabase's dashboard email templates use Go template syntax
 * ({{ .ConfirmationURL }}, {{ .Token }}, ...) for the dynamic parts, filled
 * in by Supabase itself at send time — not something this app's own send
 * path ever calls. This map renders the same 6 auth components with those
 * literal placeholder strings as props, so the output HTML can be copied
 * straight into Authentication → Email Templates in the Supabase
 * dashboard. Used only by /dev/emails/[id]?supabase=1. */
export const SUPABASE_EXPORT: Record<string, () => ReactElement> = {
  "auth-verification": () => VerificationEmail({ confirmationUrl: "{{ .ConfirmationURL }}" }),
  "auth-reset-password": () => ResetPasswordEmail({ confirmationUrl: "{{ .ConfirmationURL }}" }),
  "auth-change-email": () => ChangeEmailEmail({ confirmationUrl: "{{ .ConfirmationURL }}", oldEmail: "{{ .Email }}", newEmail: "{{ .NewEmail }}" }),
  "auth-magic-link": () => MagicLinkEmail({ confirmationUrl: "{{ .ConfirmationURL }}" }),
  "auth-invite": () => InviteEmail({ confirmationUrl: "{{ .ConfirmationURL }}" }),
  "auth-reauthentication": () => ReauthenticationEmail({ token: "{{ .Token }}" }),
};
