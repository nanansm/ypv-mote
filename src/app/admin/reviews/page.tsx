import { Sidebar } from "@/components/admin/sidebar";
import { ReviewsTable } from "@/components/admin/reviews-table";
import { AdminPageHeader } from "@/components/admin/ui/page-header";

export default function ReviewsPage() {
  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <AdminPageHeader
          title="Reviews"
          subtitle="Approve, hide, or delete public reviews. Only approved reviews appear on the landing page."
        />
        <ReviewsTable />
      </main>
    </div>
  );
}
