import { serverFetch } from "@/app/lib/server-fetch";
import Link from "next/link";

export default async function NotesPage() {
  const notes = await serverFetch("/api/notes");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-parchment">Notes</h1>
        <Link
          href="/notes/new"
          className="border border-brass text-brass text-sm px-3 py-1.5 rounded hover:bg-brass hover:text-ink transition-colors"
        >
          + nouvelle note
        </Link>
      </div>

      {notes.length === 0 && (
        <p className="text-sm text-muted mb-4">Aucune note pour le moment.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {notes.map((n: any) => (
          <div key={n.id} className="bg-surface border border-border-log rounded-md p-4">
            <p className="font-mono-log text-xs text-muted mb-2">
              {new Date(n.updatedAt).toLocaleDateString("fr-FR")}
            </p>
            <p className="text-parchment font-medium mb-1">{n.title}</p>
            <p className="text-sm text-muted line-clamp-3">{n.content}</p>
            {n.reminderId && (
              <span className="inline-block mt-3 text-[11px] font-mono-log text-brass border border-dashed border-brass px-2 py-0.5 -rotate-3">
                liée à un rappel
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}