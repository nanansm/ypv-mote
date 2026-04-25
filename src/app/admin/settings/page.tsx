import { Sidebar } from "@/components/admin/sidebar";
import { SettingsForm } from "@/components/admin/settings-form";

export default function SettingsPage() {
  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <h1 className="text-xl font-semibold text-[#1a1a1a] mb-6">Settings</h1>
        <SettingsForm />
      </main>
    </div>
  );
}
