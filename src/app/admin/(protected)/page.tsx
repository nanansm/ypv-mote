import { Sidebar } from "@/components/admin/sidebar";
import { DashboardContent } from "@/components/admin/dashboard-content";

export default function AdminDashboard() {
  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <h1 className="text-xl font-semibold text-[#1a1a1a] mb-6">Dashboard</h1>
        <DashboardContent />
      </main>
    </div>
  );
}
