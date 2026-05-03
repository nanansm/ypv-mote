type Props = {
  paid: number;
  capacity: number;
  showBar?: boolean;
};

export function CapacityBadge({ paid, capacity, showBar = true }: Props) {
  const pct = capacity > 0 ? Math.min(100, (paid / capacity) * 100) : 0;
  const isFull = paid >= capacity;
  const tone =
    isFull
      ? { text: "text-[#a32d2d]", bg: "bg-red-50", bar: "bg-[#a32d2d]" }
      : pct >= 95
      ? { text: "text-[#a32d2d]", bg: "bg-red-50", bar: "bg-[#a32d2d]" }
      : pct >= 80
      ? { text: "text-[#996e00]", bg: "bg-amber-50", bar: "bg-[#d99100]" }
      : { text: "text-[#0f6e56]", bg: "bg-green-50", bar: "bg-[#0f6e56]" };

  return (
    <div className="inline-flex flex-col gap-1 min-w-[90px]">
      <span
        className={`px-1.5 py-0.5 rounded text-[10px] font-medium w-fit ${tone.text} ${tone.bg}`}
      >
        {paid} / {capacity}
        {isFull && " · full"}
      </span>
      {showBar && (
        <div className="w-full h-1 bg-[#f0f0f0] rounded-full overflow-hidden">
          <div
            className={`h-full ${tone.bar} transition-all`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
