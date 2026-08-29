import { serverFetch } from "@/app/lib/server-fetch";
import { NotesView } from "@/app/components/NotesView";

export default async function NotesPage() {
  const [notes, reminders] = await Promise.all([
    serverFetch("/api/notes"),
    serverFetch("/api/reminders").catch(() => []),
  ]);

  return <NotesView notes={notes} reminders={reminders} />;
}
