import { Sidebar } from "@/components/admin/sidebar";
import Link from "next/link";

const PAGE_ITEMS = [
  { slug: "eligible-page", label: "Eligible Page", desc: "Shown to eligible applicants before they choose a webinar session." },
  { slug: "success-page", label: "Success Page", desc: "Shown to eligible applicants after submitting the form." },
  { slug: "rejected-page", label: "Rejected Page", desc: "Shown to applicants who don't meet eligibility criteria." },
];

export default function PagesAdminIndex() {
  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <h1 className="text-xl font-semibold text-[#1a1a1a] mb-6">Pages</h1>
        <div className="max-w-xl space-y-3">
          {PAGE_ITEMS.map((p) => (
            <Link
              key={p.slug}
              href={`/admin/pages/${p.slug}`}
              className="flex items-center justify-between bg-white border border-[#e5e5e5] rounded-lg px-4 py-3 hover:border-[#3c3489] transition-colors group"
            >
              <div>
                <p className="text-sm font-medium text-[#1a1a1a] group-hover:text-[#3c3489]">{p.label}</p>
                <p className="text-xs text-[#5c5c5c] mt-0.5">{p.desc}</p>
              </div>
              <span className="text-xs text-[#3c3489]">Edit →</span>
            </Link>
          ))}
          <p className="text-xs text-[#5c5c5c] pt-2">
            Supports placeholders: <code className="font-mono bg-[#f0f0f0] px-1 rounded">{`{name}`}</code>,{" "}
            <code className="font-mono bg-[#f0f0f0] px-1 rounded">{`{email}`}</code>,{" "}
            <code className="font-mono bg-[#f0f0f0] px-1 rounded">{`{wise_details_block}`}</code>,{" "}
            <code className="font-mono bg-[#f0f0f0] px-1 rounded">{`{webinar_price}`}</code>,{" "}
            <code className="font-mono bg-[#f0f0f0] px-1 rounded">{`{webinar_date}`}</code>,{" "}
            <code className="font-mono bg-[#f0f0f0] px-1 rounded">{`{rejection_reason}`}</code>.{" "}
            Markdown supported (<code className="font-mono bg-[#f0f0f0] px-1 rounded">**bold**</code>,{" "}
            <code className="font-mono bg-[#f0f0f0] px-1 rounded">## Heading</code>).
          </p>
        </div>
      </main>
    </div>
  );
}
