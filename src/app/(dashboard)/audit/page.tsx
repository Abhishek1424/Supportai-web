// Screen for /audit. Only renders AuditView.
import { AuditView } from "@/features/audit/AuditView";

/** /audit: Audit log screen (all logic lives in the feature component). */
export default function Page() {
  return <AuditView />;
}
