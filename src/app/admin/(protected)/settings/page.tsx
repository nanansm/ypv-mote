import { Sidebar } from "@/components/admin/sidebar";
import { SettingsForm } from "@/components/admin/settings-form";
import { AdminPageHeader } from "@/components/admin/ui/page-header";

export default function SettingsPage() {
  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <AdminPageHeader
          title="Settings"
          subtitle="Configure payment methods, integrations, and outbound email."
        />
        <SettingsForm />
      </main>
    </div>
  );
}
