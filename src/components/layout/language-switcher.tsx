"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(next: string) {
    // Replace current locale prefix with new one
    const segments = pathname.split("/");
    segments[1] = next;
    router.push(segments.join("/"));
  }

  return (
    <div className="flex items-center gap-1 text-sm">
      <button
        onClick={() => switchLocale("en")}
        className={`px-2 py-1 rounded transition-colors ${
          locale === "en"
            ? "text-[#3c3489] font-semibold"
            : "text-[#5c5c5c] hover:text-[#1a1a1a]"
        }`}
        aria-label="Switch to English"
      >
        EN
      </button>
      <span className="text-[#e5e5e5]">|</span>
      <button
        onClick={() => switchLocale("zh")}
        className={`px-2 py-1 rounded transition-colors ${
          locale === "zh"
            ? "text-[#3c3489] font-semibold"
            : "text-[#5c5c5c] hover:text-[#1a1a1a]"
        }`}
        aria-label="切换到中文"
      >
        中文
      </button>
    </div>
  );
}
