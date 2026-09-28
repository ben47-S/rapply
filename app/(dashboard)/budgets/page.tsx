import { serverFetch } from "@/app/lib/server-fetch";
import { BudgetsView } from "@/app/components/BudgetsView";

export default async function BudgetsPage() {
  const [budgets, categories, user] = await Promise.all([
    serverFetch("/api/budgets"),
    serverFetch("/api/categories"),
    serverFetch("/api/user"),
  ]);

  return (
    <BudgetsView
      budgets={budgets}
      categories={categories}
      defaultCurrency={user.currency}
    />
  );
}
