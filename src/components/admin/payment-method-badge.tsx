type Props = {
  method: "bca" | "wise" | null | undefined;
};

export function PaymentMethodBadge({ method }: Props) {
  if (!method) {
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium text-[#5c5c5c] bg-[#f0f0f0]">
        —
      </span>
    );
  }
  if (method === "bca") {
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium text-[#0f6e56] bg-green-50">
        BCA · IDR
      </span>
    );
  }
  return (
    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium text-[#3c3489] bg-[#f0effe]">
      Wise · USD
    </span>
  );
}
