export function formatSessionDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function statusBadgeClasses(status: string): string {
  switch (status) {
    case "published":
      return "text-[#0f6e56] bg-green-50";
    case "draft":
      return "text-[#5c5c5c] bg-[#f0f0f0]";
    case "closed":
      return "text-[#5c5c5c] bg-[#e5e5e5]";
    default:
      return "text-[#5c5c5c] bg-[#f0f0f0]";
  }
}

export function paymentStatusBadgeClasses(status: string): string {
  switch (status) {
    case "pending":
      return "text-[#996e00] bg-amber-50";
    case "paid":
      return "text-[#3c3489] bg-[#f0effe]";
    case "confirmed":
      return "text-[#0f6e56] bg-green-50";
    case "expired":
      return "text-[#5c5c5c] bg-[#f0f0f0]";
    case "cancelled":
      return "text-[#a32d2d] bg-red-50";
    default:
      return "text-[#5c5c5c] bg-[#f0f0f0]";
  }
}
