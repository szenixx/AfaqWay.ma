import { notFound } from "next/navigation";
import { EmailPreviewClient } from "./EmailPreviewClient";

export const dynamic = "force-dynamic";

/* /dev/emails — visual index of every email template with mock data.
 * Nothing here ever sends mail; it only calls the read-only render route
 * at /dev/emails/[id]. Dev-only, same gate as the render route itself. */
export default function DevEmailsPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <EmailPreviewClient />;
}
