import { Sidebar } from "@/components/admin/sidebar";
import { EligibilityForm } from "@/components/admin/eligibility-form";

export default function EligibilityPage() {
  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <h1 className="text-xl font-semibold text-[#1a1a1a] mb-6">Eligibility Thresholds</h1>
        <EligibilityForm />
      </main>
    </div>
  );
}
