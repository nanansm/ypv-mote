import { Sidebar } from "@/components/admin/sidebar";
import { EmailTemplatesList } from "@/components/admin/email-templates-list";

export default function EmailsPage() {
  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <h1 className="text-xl font-semibold text-[#1a1a1a] mb-6">Email Templates</h1>
        <EmailTemplatesList />
      </main>
    </div>
  );
}
