export type PaymentMethodLabel = {
  displayName: string;
  currency: string;
  key: string;
} | null | undefined;

type Props = {
  method: PaymentMethodLabel;
};

export function PaymentMethodBadge({ method }: Props) {
  if (!method) {
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium text-[#5c5c5c] bg-[#f0f0f0]">
        —
      </span>
    );
  }
  const isIndonesia = method.currency.toUpperCase() === "IDR";
  const cls = isIndonesia
    ? "text-[#0f6e56] bg-green-50"
    : "text-[#3c3489] bg-[#f0effe]";
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${cls}`}>
      {method.displayName} · {method.currency}
    </span>
  );
}
