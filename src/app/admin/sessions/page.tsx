import { Sidebar } from "@/components/admin/sidebar";
import { SessionsManager } from "@/components/admin/sessions-table";

export default function SessionsPage() {
  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <h1 className="text-xl font-semibold text-[#1a1a1a] mb-6">
          Webinar Sessions
        </h1>
        <SessionsManager />
      </main>
    </div>
  );
}
