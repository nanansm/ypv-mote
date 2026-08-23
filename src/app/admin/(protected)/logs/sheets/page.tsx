import { Sidebar } from "@/components/admin/sidebar";
import { SheetsLogsTable } from "@/components/admin/sheets-logs-table";

export default function SheetsLogsPage() {
  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <h1 className="text-xl font-semibold text-[#1a1a1a] mb-6">Sheets Sync Logs</h1>
        <SheetsLogsTable />
      </main>
    </div>
  );
}
