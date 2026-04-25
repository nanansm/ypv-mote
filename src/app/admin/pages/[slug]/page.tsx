import { Sidebar } from "@/components/admin/sidebar";
import { LegalPageEditor } from "@/components/admin/legal-page-editor";

const PAGE_LABELS: Record<string, string> = {
  "success-page": "Success Page",
  "rejected-page": "Rejected Page",
};

export default async function PageEditorRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <LegalPageEditor slug={slug} backHref="/admin/pages" backLabel="Pages" title={PAGE_LABELS[slug]} />
      </main>
    </div>
  );
}
