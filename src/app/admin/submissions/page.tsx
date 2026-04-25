import { Sidebar } from "@/components/admin/sidebar";
import { SubmissionsManager } from "@/components/admin/submissions-table";

export default function SubmissionsPage() {
  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <h1 className="text-xl font-semibold text-[#1a1a1a] mb-6">Submissions</h1>
        <SubmissionsManager />
      </main>
    </div>
  );
}
