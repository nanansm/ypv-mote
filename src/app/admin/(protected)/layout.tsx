import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, getSessionFromHeader } from "@/lib/auth";

/**
 * Auth gate for every admin screen except /admin/login, which sits outside
 * this route group. This used to live in src/proxy.ts, but Next 16 pins Proxy
 * to the Node.js runtime and OpenNext only accepts an edge one, so the check
 * moved into the tree it protects. The /api/admin/* handlers each call
 * requireAdmin() as well — that is the boundary that actually guards data.
 */
export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionId = (await cookies()).get(SESSION_COOKIE)?.value;
  const user = sessionId ? await getSessionFromHeader(sessionId) : null;

  if (!user) redirect("/admin/login");

  return <>{children}</>;
}
