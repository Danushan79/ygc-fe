import { DocumentsLibrary } from "@/components/dashboard/documents-library";
import { requireSession } from "@/lib/auth/session";
import { getDocuments } from "@/services/document.service";

export default async function DocumentsPage() {
  const session = await requireSession();

  let documentsData = null;
  try {
    documentsData = await getDocuments(session.sub);
  } catch (error) {
    console.error("Failed to load documents:", error);
    documentsData = null;
  }

  return <DocumentsLibrary visits={documentsData?.timeline?.visits ?? []} />;
}
