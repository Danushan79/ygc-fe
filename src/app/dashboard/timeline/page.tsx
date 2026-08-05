import { History } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/coming-soon";
import { requireSession } from "@/lib/auth/session";

export default async function TimelinePage() {
  await requireSession();

  return (
    <ComingSoon
      icon={History}
      title="Timeline"
      description="A detailed timeline of your full health history is coming soon."
    />
  );
}
