import { serverFetch } from "@/app/lib/server-fetch";
import { RemindersView } from "@/app/components/RemindersView";

export default async function RemindersPage() {
  const reminders = await serverFetch("/api/reminders");

  return <RemindersView reminders={reminders} />;
}
