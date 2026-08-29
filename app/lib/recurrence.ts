import dayjs from "@/app/lib/dayjs";

export const TYPE_LABELS: Record<string, string> = {
  SUBSCRIPTION: "Abonnement",
  PURCHASE: "Achat",
  TASK: "Tâche",
  ONLINE_PROGRAM: "Programme en ligne",
  OTHER: "Autre",
};

export const FREQ_LABELS: Record<string, string> = {
  DAILY: "Quotidien",
  WEEKLY: "Hebdomadaire",
  MONTHLY: "Mensuel",
  QUARTERLY: "Trimestriel",
  YEARLY: "Annuel",
  CUSTOM: "Personnalisé",
};

export const STATUS_LABELS: Record<string, string> = {
  PENDING: "À venir",
  OVERDUE: "En retard",
  DONE: "Fait",
};

export type ReminderLike = {
  type?: string | null;
  frequency?: string | null;
  customIntervalDays?: number | null;
  dueDate?: string | Date | null;
  recurrenceEndDate?: string | Date | null;
  isRecurring?: boolean | null;
  status?: string | null;
  createdAt?: string | Date | null;
  notifyTiming?: string | null;
};

export function derivedStatus(r: ReminderLike): "PENDING" | "DONE" | "OVERDUE" {
  if (r.status === "DONE") return "DONE";
  return dayjs(r.dueDate).isBefore(dayjs()) ? "OVERDUE" : "PENDING";
}

export function nextDue(base: dayjs.Dayjs, r: ReminderLike): dayjs.Dayjs {
  switch (r.frequency ?? "MONTHLY") {
    case "DAILY":
      return base.add(1, "day");
    case "WEEKLY":
      return base.add(7, "day");
    case "QUARTERLY":
      return base.add(3, "month");
    case "YEARLY":
      return base.add(1, "year");
    case "CUSTOM":
      return base.add(Number(r.customIntervalDays) || 1, "day");
    case "MONTHLY":
    default:
      return base.add(1, "month");
  }
}

export function prevOccurrence(dueDate: dayjs.Dayjs, r: ReminderLike): dayjs.Dayjs {
  switch (r.frequency ?? "MONTHLY") {
    case "DAILY":
      return dueDate.subtract(1, "day");
    case "WEEKLY":
      return dueDate.subtract(1, "week");
    case "QUARTERLY":
      return dueDate.subtract(3, "month");
    case "YEARLY":
      return dueDate.subtract(1, "year");
    case "CUSTOM":
      return dueDate.subtract(Number(r.customIntervalDays) || 1, "day");
    case "MONTHLY":
    default:
      return dueDate.subtract(1, "month");
  }
}

// Ancre de début de la fenêtre d'anticipation :
// - récurrent : occurrence précédente (dueDate - intervalle)
// - ponctuel  : création du rappel
export function windowStart(r: ReminderLike): dayjs.Dayjs {
  const due = dayjs(r.dueDate);
  if (r.isRecurring || r.type === "SUBSCRIPTION") {
    return prevOccurrence(due, r);
  }
  return dayjs(r.createdAt ?? r.dueDate);
}

// Seuils d'anticipation selon la durée totale de la fenêtre :
// > 3 mois -> [70, 90, 100], sinon [50, 80, 100]
export function stagesFor(durMs: number): number[] {
  const THREE_MONTHS_MS = 90 * 24 * 60 * 60 * 1000;
  return durMs > THREE_MONTHS_MS ? [70, 90, 100] : [50, 80, 100];
}

function behaviorLine(r: ReminderLike): string {
  if (!r.isRecurring && r.type !== "SUBSCRIPTION") {
    return "Rappel ponctuel : ne se répète pas.";
  }
  const freq = FREQ_LABELS[r.frequency ?? ""] ?? r.frequency ?? "—";
  let s = `Se renouvelle ${freq.toLowerCase()}`;
  if (r.frequency === "CUSTOM" && r.customIntervalDays) {
    s += ` (tous les ${r.customIntervalDays} jours)`;
  }
  const nd = nextDue(dayjs(), r).format("DD/MM/YYYY");
  s += ` — prochaine occurrence le ${nd}`;
  if (r.recurrenceEndDate) {
    s += `, jusqu'au ${dayjs(r.recurrenceEndDate).format("DD/MM/YYYY")}.`;
  } else {
    s += ".";
  }
  return s;
}

export function reminderSummary(r: ReminderLike) {
  const typeLabel = TYPE_LABELS[r.type ?? ""] ?? "Rappel";
  const statusLabel = STATUS_LABELS[derivedStatus(r)];
  const due = r.dueDate ? dayjs(r.dueDate).format("DD/MM/YYYY") : null;
  return {
    typeLabel,
    statusLabel,
    due,
    behavior: behaviorLine(r),
    isLinked: !!(r.isRecurring || r.type === "SUBSCRIPTION"),
  };
}
