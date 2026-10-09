import { runDigestJob, runRealtimePushJob } from "@/app/lib/push-jobs";

// Granularité de l'envoi automatique : le passage de trop-plein arrive donc
// jusqu'à REALTIME_INTERVAL_MS après l'heure exacte d'un palier.
const REALTIME_INTERVAL_MS = 3 * 60 * 1000;
const FIRST_REALTIME_DELAY_MS = 30 * 1000;
const DIGEST_INTERVAL_MS = 24 * 60 * 60 * 1000;
const DIGEST_HOUR_UTC = 7;

const STARTED_FLAG = "__rapplyPushSchedulerStarted";

type SchedulerGlobal = typeof globalThis & { [STARTED_FLAG]?: boolean };

// Instant du prochain résumé du matin : 07:00 UTC (le serveur tourne en UTC,
// donc c'est aussi 07:00 pour un utilisateur UTC comme une devise XOF).
function nextDigestRunAt(): number {
  const now = new Date();
  const next = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), DIGEST_HOUR_UTC)
  );
  if (next.getTime() <= now.getTime()) {
    next.setUTCDate(next.getUTCDate() + 1);
  }
  return next.getTime();
}

export function startScheduler(): void {
  if (process.env.NODE_ENV !== "production") {
    console.log("[scheduler] ignoré hors production (dev/HMR).");
    return;
  }

  // Le flag sur globalThis survit au HMR : jamais deux minuteries pour le même
  // process, même si register() est rappelé.
  const g = globalThis as SchedulerGlobal;
  if (g[STARTED_FLAG]) return;
  g[STARTED_FLAG] = true;

  let realtimeBusy = false;
  const runRealtime = async () => {
    if (realtimeBusy) return;
    realtimeBusy = true;
    try {
      const { reminders, budgets } = await runRealtimePushJob();
      console.log(
        `[scheduler] ${new Date().toISOString()} temps-reel rappels=${reminders} budgets=${budgets}`
      );
    } catch (error) {
      console.error("[scheduler] echec du passage temps-reel:", error);
    } finally {
      realtimeBusy = false;
    }
  };

  let digestBusy = false;
  const runDigest = async () => {
    if (digestBusy) return;
    digestBusy = true;
    try {
      const { digest } = await runDigestJob();
      console.log(
        `[scheduler] ${new Date().toISOString()} digest envoyes=${digest}`
      );
    } catch (error) {
      console.error("[scheduler] echec du resume du matin:", error);
    } finally {
      digestBusy = false;
    }
  };

  setTimeout(runRealtime, FIRST_REALTIME_DELAY_MS);
  setInterval(runRealtime, REALTIME_INTERVAL_MS);

  // Premier résumé au prochain 07:00 UTC, puis une fois par jour.
  setTimeout(() => {
    void runDigest();
    setInterval(runDigest, DIGEST_INTERVAL_MS);
  }, nextDigestRunAt() - Date.now());

  console.log(
    `[scheduler] demarre: temps-reel toutes les ${REALTIME_INTERVAL_MS / 60000} min, ` +
      `resume du matin a ${DIGEST_HOUR_UTC}:00 UTC.`
  );
}
