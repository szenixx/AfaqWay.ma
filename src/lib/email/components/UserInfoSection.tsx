import { InformationCard, type InfoRow } from "./InformationCard";

/** The recurring "who this email is about" block — student name, email,
 *  profile ID, plan — used in admin/advisor notification emails so the
 *  recipient doesn't have to cross-reference the app to know who triggered
 *  the message. Any field left out is simply omitted, not blanked. */
export function UserInfoSection({ name, email, profileId, plan, country }: {
  name?: string;
  email?: string;
  profileId?: string;
  plan?: string;
  country?: string;
}) {
  const rows: InfoRow[] = [
    name && { label: "Name", value: name },
    email && { label: "Email", value: email },
    profileId && { label: "Profile ID", value: profileId },
    plan && { label: "Plan", value: plan },
    country && { label: "Destination", value: country },
  ].filter((r): r is InfoRow => Boolean(r));

  return <InformationCard title="Student" rows={rows} />;
}
