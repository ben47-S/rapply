import { serverFetch } from "@/app/lib/server-fetch";
import { FinancesView } from "@/app/components/FinancesView";

export default async function FinancesPage() {
  const [transactions, categories, user, stats] = await Promise.all([
    serverFetch("/api/transactions"),
    serverFetch("/api/categories"),
    serverFetch("/api/user"),
    serverFetch("/api/stats/finances"),
  ]);

  return (
    <FinancesView
      transactions={transactions}
      categories={categories}
      defaultCurrency={user.currency}
      initialStats={stats}
    />
  );
}

