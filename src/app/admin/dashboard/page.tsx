import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { requireAdminUser } from "@/lib/auth/session";

export default async function AdminDashboardPage() {
  await requireAdminUser();

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h2>
      <p className="mt-1 text-sm text-slate-500">
        Patients, uploaded documents, and cross-check safety flags at a glance.
      </p>

      <div className="mt-6">
        <AdminDashboard />
      </div>
    </div>
  );
}
