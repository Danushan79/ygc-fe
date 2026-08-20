import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";
import { UploadDocumentButton } from "@/components/dashboard/upload-document-button";
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
      <div className="mb-4 flex flex-shrink-0 items-stretch justify-between">
        <div>
          <h2 className="text-2xl leading-tight font-bold text-slate-900">
            Welcome, <span className="text-blue-800">{user?.fullName ?? "there"}</span>
          </h2>
          <p className="mt-1 text-sm text-slate-500">Stay informed about your health and medications.</p>
        </div>

        <UploadDocumentButton />
      </div>

      <DashboardTabs documentsData={documentsData} />
    </div>
  );
}
