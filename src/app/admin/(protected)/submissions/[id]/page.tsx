import { Sidebar } from "@/components/admin/sidebar";
import { SubmissionDetail } from "@/components/admin/submission-detail";

export default async function SubmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <SubmissionDetail id={id} />
      </main>
    </div>
  );
}
