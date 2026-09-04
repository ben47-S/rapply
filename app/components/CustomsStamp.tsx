"use client";

export function CustomsStamp() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 pointer-events-none">
      <span className="stamp-impact inline-block border-4 border-double border-rust text-rust px-6 py-3 font-mono-log uppercase tracking-[0.2em] text-2xl sm:text-3xl font-bold rotate-[-8deg] shadow-[0_0_0_2px_var(--color-rust)] rounded-sm">
        Suspect
        <br className="sm:hidden" /> non identifié
      </span>
    </div>
  );
}
