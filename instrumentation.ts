// Point d'entrée du runtime Next.js : appelé une seule fois au démarrage du
// serveur, et il doit terminer avant que le serveur accepte des requêtes —
// d'où l'absence d'await sur startScheduler() (qui ne fait qu'armer des
// minuteries et se rend immédiatement).
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NODE_ENV !== "production") return;

  const { startScheduler } = await import("./app/lib/scheduler");
  startScheduler();
}
