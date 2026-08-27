type Status = "PENDING" | "DONE" | "OVERDUE";

const STYLES: Record<Status, { label: string; color: string; border: string }> = {
  PENDING: { label: "en cours", color: "text-brass", border: "border-brass" },
  DONE: { label: "fait", color: "text-teal-log", border: "border-teal-log" },
  OVERDUE: { label: "en retard", color: "text-rust", border: "border-rust" },
};

export function StatusStamp({ status }: { status: Status }) {
  const s = STYLES[status];
  return (
    <span
      className={`inline-block -rotate-6 border border-dashed ${s.border} ${s.color} px-2 py-0.5 text-[11px] font-mono-log uppercase tracking-widest`}
    >
      {s.label}
    </span>
  );
}