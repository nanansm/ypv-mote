import { Sidebar } from "@/components/admin/sidebar";
import { AiLogsTable } from "@/components/admin/ai-logs-table";

export default function AiLogsPage() {
  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <h1 className="text-xl font-semibold text-[#1a1a1a] mb-6">AI Analysis Logs</h1>
        <AiLogsTable />
      </main>
    </div>
  );
}
