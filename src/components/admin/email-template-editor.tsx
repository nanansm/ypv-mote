"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Template = {
  id: number;
  slug: string;
  subject: string;
  bodyText: string;
  updatedAt: string | null;
};

const VARIABLES = [
  { name: "{{name}}", desc: "Recipient full name" },
  { name: "{{email}}", desc: "Recipient email" },
  { name: "{{country}}", desc: "Country of residence" },
  { name: "{{webinar_date}}", desc: "Webinar date" },
  { name: "{{webinar_time}}", desc: "Webinar time" },
  { name: "{{zoom_link}}", desc: "Zoom meeting URL" },
  { name: "{{payment_link}}", desc: "Payment URL" },
  { name: "{{submission_id}}", desc: "Submission ID" },
];

export function EmailTemplateEditor({ id }: { id: string }) {
  const router = useRouter();
  const [template, setTemplate] = useState<Template | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/emails/${id}`)
      .then((r) => r.json())
      .then((d: Template) => {
        setTemplate(d);
        setSubject(d.subject);
        setBody(d.bodyText);
      });
  }, [id]);

  async function save() {
    setSaving(true);
    await fetch(`/api/admin/emails/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, bodyText: body }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function insertVariable(v: string) {
    setBody((b) => b + v);
  }

  if (!template) return <p className="text-sm text-[#5c5c5c]">Loading…</p>;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push("/admin/emails")} className="text-sm text-[#5c5c5c] hover:text-[#1a1a1a]">← Email Templates</button>
        <h1 className="text-xl font-semibold text-[#1a1a1a]">{template.slug}</h1>
      </div>

      <div className="grid lg:grid-cols-[1fr_220px] gap-4">
        <div className="space-y-4">
          <label className="block">
            <span className="text-xs text-[#5c5c5c] block mb-1">Subject</span>
            <input value={subject} onChange={(e) => setSubject(e.target.value)}
              className="w-full h-9 px-3 border border-[#e5e5e5] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3c3489]" />
          </label>

          <label className="block">
            <span className="text-xs text-[#5c5c5c] block mb-1">Body</span>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={20}
              className="w-full px-3 py-2 border border-[#e5e5e5] rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#3c3489] resize-y" />
          </label>

          <div className="flex gap-3 items-center">
            <button onClick={save} disabled={saving}
              className="px-4 py-2 rounded-md bg-[#3c3489] text-white text-sm hover:bg-[#2e2770] disabled:opacity-60">
              {saving ? "Saving…" : "Save"}
            </button>
            <button onClick={() => setPreview((p) => !p)}
              className="px-4 py-2 rounded-md border border-[#e5e5e5] text-sm hover:bg-[#fafaf9]">
              {preview ? "Hide preview" : "Preview"}
            </button>
            {saved && <span className="text-sm text-[#0f6e56]">Saved!</span>}
          </div>

          {preview && (
            <div className="border border-[#e5e5e5] rounded-lg p-4 bg-white">
              <p className="text-xs text-[#5c5c5c] mb-2 font-medium">Subject: {subject}</p>
              <pre className="text-sm text-[#1a1a1a] whitespace-pre-wrap font-sans">{body}</pre>
            </div>
          )}
        </div>

        {/* Variable reference */}
        <div className="bg-white border border-[#e5e5e5] rounded-lg p-4 self-start">
          <h2 className="text-xs font-semibold text-[#1a1a1a] mb-3">Variables</h2>
          <div className="space-y-2">
            {VARIABLES.map((v) => (
              <div key={v.name}>
                <button onClick={() => insertVariable(v.name)}
                  className="font-mono text-xs text-[#3c3489] hover:underline text-left">
                  {v.name}
                </button>
                <p className="text-[10px] text-[#5c5c5c]">{v.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-[#5c5c5c] mt-3 pt-3 border-t border-[#e5e5e5]">Click a variable to insert it at the end of the body.</p>
        </div>
      </div>
    </div>
  );
}
