import { serverFetch } from "@/app/lib/server-fetch";
import { RemindersView } from "@/app/components/RemindersView";

export default async function RemindersPage() {
  const [reminders, categories, user] = await Promise.all([
    serverFetch("/api/reminders"),
    serverFetch("/api/categories"),
    serverFetch("/api/user"),
  ]);

  return (
    <RemindersView
      reminders={reminders}
      categories={categories}
      currency={user.currency ?? "XOF"}
    />
  );
}

