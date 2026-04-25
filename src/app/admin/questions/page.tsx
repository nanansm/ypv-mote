import { Sidebar } from "@/components/admin/sidebar";
import { QuestionsManager } from "@/components/admin/questions-manager";

export default function QuestionsPage() {
  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-semibold text-[#1a1a1a]">Form Questions</h1>
          <a href="/en/form" target="_blank" className="text-sm text-[#3c3489] hover:underline">Preview public form ↗</a>
        </div>
        <QuestionsManager />
      </main>
    </div>
  );
}
