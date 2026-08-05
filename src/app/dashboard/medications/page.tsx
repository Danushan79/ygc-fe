import { Pill } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/coming-soon";
import { requireSession } from "@/lib/auth/session";

export default async function MedicationsPage() {
  await requireSession();

  return (
    <ComingSoon
      icon={Pill}
      title="Medications"
      description="Manage all of your medications in one place. This feature is coming soon."
    />
  );
}
