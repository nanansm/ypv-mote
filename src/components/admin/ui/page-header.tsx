type Props = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
};

export function AdminPageHeader({ title, subtitle, action }: Props) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold text-[#1a1a1a]">{title}</h1>
        {subtitle && (
          <p className="text-sm text-[#5c5c5c] mt-0.5 max-w-prose">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
