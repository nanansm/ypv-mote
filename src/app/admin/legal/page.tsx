import { Sidebar } from "@/components/admin/sidebar";
import { LegalPagesList } from "@/components/admin/legal-pages-list";

export default function LegalListPage() {
  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <h1 className="text-xl font-semibold text-[#1a1a1a] mb-6">Legal Pages</h1>
        <LegalPagesList />
      </main>
    </div>
  );
}
