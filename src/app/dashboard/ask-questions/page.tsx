import { MessageCircle } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/coming-soon";
import { requireSession } from "@/lib/auth/session";

export default async function AskQuestionsPage() {
  await requireSession();

  return (
    <ComingSoon
      icon={MessageCircle}
      title="Ask Questions"
      description="Chat with the AI assistant about your health records here soon."
    />
  );
}
