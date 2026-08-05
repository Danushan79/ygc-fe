import { FileText } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/coming-soon";
import { requireSession } from "@/lib/auth/session";

export default async function DocumentsPage() {
  await requireSession();

  return (
    <ComingSoon
      icon={FileText}
      title="Documents"
      description="Upload and browse your medical documents here soon."
    />
  );
}
