export const QUEUE_EVENT = "rapply:queue-changed";

const QUEUE_KEY = "rapply:reminders-queue";
const SNAPSHOT_KEY = "rapply:reminders-snapshot";

export type QueuedOp =
  | { kind: "create"; reminder: any; body: Record<string, unknown> }
  | { kind: "setStatus"; reminderId: string; status: "DONE" }
  | { kind: "checkItem"; reminderId: string; itemId: string };

export function newId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return "c" + Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // stockage indisponible (navigation privée, quota) : rien à faire de mieux
  }
}

export function loadQueue(): QueuedOp[] {
  return read<QueuedOp[]>(QUEUE_KEY, []);
}

export function enqueue(op: QueuedOp) {
  write(QUEUE_KEY, [...loadQueue(), op]);
  window.dispatchEvent(new Event(QUEUE_EVENT));
}

export function loadSnapshot(): any[] | null {
  return read<any[] | null>(SNAPSHOT_KEY, null);
}

export function saveSnapshot(list: any[]) {
  write(SNAPSHOT_KEY, list);
}

function endpointFor(op: QueuedOp): { url: string; method: string; body: unknown } {
  if (op.kind === "create") {
    return { url: "/api/reminders", method: "POST", body: op.body };
  }
  if (op.kind === "setStatus") {
    return { url: `/api/reminders/${op.reminderId}`, method: "PUT", body: { status: op.status } };
  }
  return {
    url: `/api/reminders/${op.reminderId}/items/${op.itemId}`,
    method: "PUT",
    body: { checked: true },
  };
}

export type FlushResult = { sent: number; stoppedBy: "network" | "auth" | "server" | null };

// Envoie la file dans l'ordre. S'arrête (et garde le reste) sur coupure réseau,
// erreur serveur ou session expirée. Une réponse 4xx définitive (ressource
// disparue, validation) retire l'opération : la rejouer ne réussirait jamais.
export async function flushQueue(): Promise<FlushResult> {
  let sent = 0;
  while (loadQueue().length > 0) {
    const op = loadQueue()[0];
    const { url, method, body } = endpointFor(op);

    let res: Response;
    try {
      res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      return { sent, stoppedBy: "network" };
    }

    if (res.status === 401) return { sent, stoppedBy: "auth" };
    if (res.status >= 500) return { sent, stoppedBy: "server" };
    if (!res.ok) console.warn("[offline-queue] opération rejetée", res.status, op);

    write(QUEUE_KEY, loadQueue().slice(1));
    sent++;
  }
  return { sent, stoppedBy: null };
}

export function applyQueue(list: any[], ops: QueuedOp[]): any[] {
  let next = list;
  for (const op of ops) {
    if (op.kind === "create") {
      if (!next.some((r) => r.id === op.reminder.id)) next = [...next, op.reminder];
    } else if (op.kind === "setStatus") {
      next = next.map((r) =>
        r.id === op.reminderId
          ? { ...r, status: "DONE", completedAt: new Date().toISOString() }
          : r
      );
    } else {
      next = next.map((r) => {
        if (r.id !== op.reminderId) return r;
        const items = (r.items ?? []).map((i: any) =>
          i.id === op.itemId ? { ...i, checked: true } : i
        );
        const allChecked = items.length > 0 && items.every((i: any) => i.checked);
        return {
          ...r,
          items,
          ...(allChecked ? { status: "DONE", completedAt: new Date().toISOString() } : {}),
        };
      });
    }
  }
  return next;
}

export function buildLocalReminder(body: any, categories: any[]): any {
  const now = new Date().toISOString();
  return {
    id: body.id,
    title: body.title,
    description: body.description ?? null,
    type: body.type,
    startDate: body.startDate ?? null,
    dueDate: body.dueDate,
    completedAt: null,
    status: "PENDING",
    estimatedAmount: body.estimatedAmount ?? null,
    categoryId: body.categoryId ?? null,
    category: categories.find((c) => c.id === body.categoryId) ?? null,
    isRecurring: !!body.isRecurring,
    frequency: body.frequency ?? null,
    customIntervalDays: body.customIntervalDays ?? null,
    recurrenceEndDate: body.recurrenceEndDate ?? null,
    notifyTiming: body.notifyTiming ?? "REALTIME",
    sentStages: 0,
    createdAt: now,
    updatedAt: now,
    items: (body.items ?? []).map((i: any, idx: number) => ({
      id: i.id,
      label: i.label,
      checked: false,
      order: idx,
      reminderId: body.id,
    })),
    _pending: true,
  };
}
