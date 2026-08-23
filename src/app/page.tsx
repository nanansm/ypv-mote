import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";

/**
 * Locale negotiation for "/". next-intl's middleware used to do this, but Next
 * 16 pins Proxy to the Node.js runtime and OpenNext only deploys an edge one,
 * so the redirect lives here instead. Every other route carries its locale in
 * the path already.
 */
function preferredLocale(header: string | null): string {
  if (!header) return routing.defaultLocale;

  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { tag: tag.trim().toLowerCase(), q: q ? Number(q.split("=")[1]) : 1 };
    })
    .filter((entry) => entry.tag && Number.isFinite(entry.q))
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    const base = tag.split("-")[0];
    const match = routing.locales.find((locale) => locale === base);
    if (match) return match;
  }
  return routing.defaultLocale;
}

export default async function RootPage() {
  const locale = preferredLocale((await headers()).get("accept-language"));
  redirect(`/${locale}`);
}
