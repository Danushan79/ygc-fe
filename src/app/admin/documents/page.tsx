import { requireAdminSession } from "@/lib/auth/session";

export default async function AdminDocumentsPage() {
  await requireAdminSession();

  return null;
}
