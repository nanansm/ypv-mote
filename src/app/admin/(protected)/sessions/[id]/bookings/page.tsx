import { Sidebar } from "@/components/admin/sidebar";
import { SessionBookingsView } from "@/components/admin/session-bookings-view";

export default async function SessionBookingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <SessionBookingsView sessionId={id} />
      </main>
    </div>
  );
}
