import { Sidebar } from "@/components/admin/sidebar";
import { EmailTemplateEditor } from "@/components/admin/email-template-editor";

export default async function EmailTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <EmailTemplateEditor id={id} />
      </main>
    </div>
  );
}
