import { AdminUsersTable } from "@/components/admin/admin-users-table";
import { requireAdminUser } from "@/lib/auth/session";

export default async function AdminUsersPage() {
  await requireAdminUser();

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">Users</h2>
      <p className="mt-1 text-sm text-slate-500">Search, filter, and manage patient accounts.</p>

      <div className="mt-6">
        <AdminUsersTable />
      </div>
    </div>
  );
}
