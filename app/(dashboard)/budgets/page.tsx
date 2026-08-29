import { serverFetch } from "@/app/lib/server-fetch";
import { BudgetsView } from "@/app/components/BudgetsView";

export default async function BudgetsPage() {
  const [budgets, transactions, categories, user] = await Promise.all([
    serverFetch("/api/budgets"),
    serverFetch("/api/transactions"),
    serverFetch("/api/categories"),
    serverFetch("/api/user"),
  ]);

  return (
    <BudgetsView
      budgets={budgets}
      transactions={transactions}
      categories={categories}
      defaultCurrency={user.currency}
    />
  );
}
