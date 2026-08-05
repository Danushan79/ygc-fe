import { TriangleAlert } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/coming-soon";
import { requireSession } from "@/lib/auth/session";

export default async function SafetyAlertsPage() {
  await requireSession();

  return (
    <ComingSoon
      icon={TriangleAlert}
      title="Safety Alerts"
      description="A full view of drug interactions and allergy conflicts is coming soon."
    />
  );
}
