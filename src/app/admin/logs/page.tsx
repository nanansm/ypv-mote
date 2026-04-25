import { Sidebar } from "@/components/admin/sidebar";
import { LogsDashboard } from "@/components/admin/logs-dashboard";

export default function LogsPage() {
  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <h1 className="text-xl font-semibold text-[#1a1a1a] mb-6">Logs</h1>
        <LogsDashboard />
      </main>
    </div>
  );
}
