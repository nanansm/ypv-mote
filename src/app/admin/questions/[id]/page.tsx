import { Sidebar } from "@/components/admin/sidebar";
import { QuestionEditor } from "@/components/admin/question-editor";

export default async function QuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <QuestionEditor id={id} />
      </main>
    </div>
  );
}
