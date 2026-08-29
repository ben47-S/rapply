import { NavLinks } from "@/app/components/NavLinks";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen md:flex">
        <aside className="hidden md:sticky md:top-0 md:self-start md:h-screen md:flex md:w-56 flex-col border-r border-border-log bg-surface px-4 py-6">
          <NavLinks variant="sidebar" />
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
