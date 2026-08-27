import { serverFetch } from "@/app/lib/server-fetch";

export default async function FinancesPage() {
  const transactions = await serverFetch("/api/transactions");

  const totalIncome = transactions
    .filter((t: any) => t.type === "INCOME")
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
  const totalExpense = transactions
    .filter((t: any) => t.type === "EXPENSE")
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

  return (
    <div>
      <h1 className="font-display text-2xl text-parchment mb-6">Finances</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        <div className="bg-surface border border-border-log rounded-md px-4 py-5">
          <p className="text-[11px] uppercase tracking-widest text-muted mb-1">Entrées</p>
          <p className="font-mono-log text-2xl text-teal-log">
            +{totalIncome.toLocaleString("fr-FR")} XOF
          </p>
        </div>
        <div className="bg-surface border border-border-log rounded-md px-4 py-5">
          <p className="text-[11px] uppercase tracking-widest text-muted mb-1">Dépenses</p>
          <p className="font-mono-log text-2xl text-rust">
            -{totalExpense.toLocaleString("fr-FR")} XOF
          </p>
        </div>
      </div>

      <div className="border-l border-border-log pl-6">
        {transactions.map((t: any) => (
          <div key={t.id} className="relative pb-6">
            <div
              className={`absolute -left-[29px] top-1.5 w-2.5 h-2.5 rounded-full ${
                t.type === "INCOME" ? "bg-teal-log" : "bg-rust"
              }`}
            />
            <div className="flex items-center justify-between bg-surface border border-border-log rounded-md px-4 py-3">
              <div className="min-w-0">
                <p className="font-mono-log text-xs text-muted mb-1">
                  {new Date(t.date).toLocaleDateString("fr-FR")}
                  {t.category ? ` · ${t.category.name}` : ""}
                </p>
                <p className="text-parchment truncate">{t.note ?? "Sans description"}</p>
              </div>
              <p className={`font-mono-log ${t.type === "INCOME" ? "text-teal-log" : "text-rust"}`}>
                {t.type === "INCOME" ? "+" : "-"}
                {Number(t.amount).toLocaleString("fr-FR")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}