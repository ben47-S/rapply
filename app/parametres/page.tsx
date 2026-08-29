import { serverFetch } from "@/app/lib/server-fetch";
import { SettingsView } from "@/app/components/SettingsView";

export default async function ParametresPage() {
  const [{ currency }, transactions, categories] = await Promise.all([
    serverFetch("/api/user"),
    serverFetch("/api/transactions"),
    serverFetch("/api/categories"),
  ]);

  const totalIncome = transactions
    .filter((t: any) => t.type === "INCOME")
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
  const totalExpense = transactions
    .filter((t: any) => t.type === "EXPENSE")
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

  return (
    <div className="min-h-screen px-4 py-6 md:px-8 md:py-6">
      <SettingsView
        currency={currency}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        categories={categories}
      />
    </div>
  );
}
