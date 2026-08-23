import { Sidebar } from "@/components/admin/sidebar";
import { LegalPageEditor } from "@/components/admin/legal-page-editor";

export default async function LegalEditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <LegalPageEditor slug={slug} />
      </main>
    </div>
  );
}
