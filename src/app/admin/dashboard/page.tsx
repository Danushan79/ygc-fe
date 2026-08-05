import { requireAdminSession } from "@/lib/auth/session";

export default async function AdminDashboardPage() {
  await requireAdminSession();

  return null;
}
