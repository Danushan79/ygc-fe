import { Activity } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/coming-soon";
import { requireSession } from "@/lib/auth/session";

export default async function LabTrendsPage() {
  await requireSession();

  return (
    <ComingSoon
      icon={Activity}
      title="Lab Trends"
      description="Track how your lab results change over time. This feature is coming soon."
    />
  );
}
