import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";
import { getCurrentUser, requireSession } from "@/lib/auth/session";
import { getDocuments } from "@/services/document.service";

export default async function DashboardPage() {
  const session = await requireSession();
  const user = await getCurrentUser();

  let documentsData = null;
  try {
    documentsData = await getDocuments(session.sub);
  } catch (error) {
    console.error("Failed to load dashboard document data:", error);
    documentsData = null;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex flex-shrink-0 items-end justify-between">
        <div>
          <h2 className="text-2xl leading-tight font-bold text-slate-900">
            Welcome, <span className="text-blue-800">{user?.fullName ?? "there"}</span>
          </h2>
          <p className="mt-1 text-sm text-slate-500">Here&apos;s your health timeline overview.</p>
        </div>
      </div>

      <DashboardTabs documentsData={documentsData} />
    </div>
  );
}
