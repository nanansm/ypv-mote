import { Sidebar } from "@/components/admin/sidebar";
import { BookingsTable } from "@/components/admin/bookings-table";

export default function BookingsPage() {
  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <h1 className="text-xl font-semibold text-[#1a1a1a] mb-6">Bookings</h1>
        <BookingsTable />
      </main>
    </div>
  );
}
