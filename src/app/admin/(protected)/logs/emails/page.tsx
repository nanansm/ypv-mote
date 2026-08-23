import { Sidebar } from "@/components/admin/sidebar";
import { EmailLogsTable } from "@/components/admin/email-logs-table";

export default function EmailLogsPage() {
  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <h1 className="text-xl font-semibold text-[#1a1a1a] mb-6">Email Logs</h1>
        <EmailLogsTable />
      </main>
    </div>
  );
}
