"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type NavItem = { href: string; label: string; icon: string; badgeKey?: BadgeKey };
type NavGroup = { title?: string; items: NavItem[] };
type BadgeKey = "pendingBookings" | "pendingReviews";

const GROUPS: NavGroup[] = [
  {
    items: [{ href: "/admin", label: "Dashboard", icon: "⊞" }],
  },
  {
    title: "Applicants",
    items: [
      { href: "/admin/submissions", label: "Submissions", icon: "≡" },
      {
        href: "/admin/bookings",
        label: "Bookings",
        icon: "▤",
        badgeKey: "pendingBookings",
      },
    ],
  },
  {
    title: "Webinar",
    items: [
      { href: "/admin/sessions", label: "Sessions", icon: "◷" },
      { href: "/admin/eligibility", label: "Eligibility", icon: "✓" },
      { href: "/admin/questions", label: "Questions", icon: "?" },
    ],
  },
  {
    title: "Content",
    items: [
      { href: "/admin/pages", label: "Pages", icon: "◻" },
      { href: "/admin/legal", label: "Legal Pages", icon: "§" },
      { href: "/admin/emails", label: "Email Templates", icon: "✉" },
      {
        href: "/admin/reviews",
        label: "Reviews",
        icon: "★",
        badgeKey: "pendingReviews",
      },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/admin/settings", label: "Settings", icon: "⚙" },
      { href: "/admin/logs", label: "Logs", icon: "⏲" },
    ],
  },
];

function NavContent({ onNav }: { onNav?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [badges, setBadges] = useState<Record<BadgeKey, number>>({
    pendingBookings: 0,
    pendingReviews: 0,
  });

  useEffect(() => {
    let active = true;
    async function loadBadges() {
      try {
        const [reviewsRes, bookingsRes] = await Promise.all([
          fetch("/api/admin/reviews?status=pending").catch(() => null),
          fetch("/api/admin/bookings?payment_status=pending").catch(() => null),
        ]);
        if (!active) return;
        let pendingReviews = 0;
        let pendingBookings = 0;
        if (reviewsRes?.ok) {
          const d = (await reviewsRes.json()) as { pendingCount?: number };
          pendingReviews = d.pendingCount ?? 0;
        }
        if (bookingsRes?.ok) {
          const d = (await bookingsRes.json()) as {
            bookings?: Array<{ booking: { paymentStatus: string } }>;
          };
          pendingBookings = (d.bookings ?? []).filter(
            (b) => b.booking.paymentStatus === "pending"
          ).length;
        }
        if (active) setBadges({ pendingReviews, pendingBookings });
      } catch {
        /* silent */
      }
    }
    void loadBadges();
    const i = setInterval(loadBadges, 60_000);
    return () => {
      active = false;
      clearInterval(i);
    };
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <>
      <div className="px-4 py-4 border-b border-[#e5e5e5]">
        <p className="text-xs font-semibold text-[#3c3489] tracking-widest uppercase">
          Admin
        </p>
        <p className="text-xs text-[#5c5c5c] mt-0.5">YPV Switzerland</p>
      </div>
      <nav className="flex-1 py-2 overflow-y-auto">
        {GROUPS.map((g, gi) => (
          <div key={gi} className={gi > 0 ? "mt-2" : ""}>
            {g.title && (
              <p className="px-4 pt-2 pb-1 text-[10px] font-semibold text-[#a0a0a0] uppercase tracking-widest">
                {g.title}
              </p>
            )}
            {g.items.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNav}
                  className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                    active
                      ? "bg-[#f0effe] text-[#3c3489] font-medium border-l-2 border-[#3c3489] pl-[14px]"
                      : "text-[#5c5c5c] hover:text-[#1a1a1a] hover:bg-[#fafaf9] border-l-2 border-transparent pl-[14px]"
                  }`}
                >
                  <span className="text-base w-4 text-center" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {badgeCount > 0 && (
                    <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-[#3c3489] text-white text-[10px] font-semibold">
                      {badgeCount > 99 ? "99+" : badgeCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="px-4 py-3 border-t border-[#e5e5e5]">
        <button
          onClick={handleLogout}
          className="text-xs text-[#5c5c5c] hover:text-[#a32d2d] transition-colors"
        >
          Sign out
        </button>
      </div>
    </>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <aside className="hidden md:flex w-56 bg-white border-r border-[#e5e5e5] flex-col h-full shrink-0">
        <NavContent />
      </aside>

      <button
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        className="fixed top-3 left-3 z-40 md:hidden flex items-center justify-center w-11 h-11 rounded-md bg-white border border-[#e5e5e5] shadow-sm"
      >
        <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true">
          <path
            d="M1 1h16M1 7h16M1 13h16"
            stroke="#1a1a1a"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white flex flex-col h-full shadow-xl md:hidden transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e5e5]">
          <span className="text-xs font-semibold text-[#3c3489] tracking-widest uppercase">
            Menu
          </span>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-[#f0f0f0]"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path
                d="M1 1l12 12M13 1L1 13"
                stroke="#5c5c5c"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <NavContent onNav={() => setOpen(false)} />
      </aside>
    </>
  );
}
