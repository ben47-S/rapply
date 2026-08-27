import { NavLinks } from "@/app/components/NavLinks";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden md:flex md:w-56 flex-col border-r border-border-log bg-surface px-4 py-6">
        <p className="font-display text-lg text-parchment mb-8">Rapply</p>
        <nav className="flex flex-col gap-1">
          <NavLinks variant="sidebar" />
        </nav>
      </aside>

      <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:py-6 md:pb-6">
        {children}
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-50 flex border-t border-border-log bg-surface md:hidden">
        <NavLinks variant="bottom" />
      </nav>
    </div>
  );
}
