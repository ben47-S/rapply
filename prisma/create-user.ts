import "dotenv/config";
import prisma from "../app/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const MIN_PASSWORD = 8;
// bcrypt ignore silencieusement tout ce qui dépasse 72 octets : le suffixe
// change du mot de passe ne change donc plus le hash, et bcrypt.compare()
// rejette la saisie. La borne est en octets, pas en caractères, parce
// qu'un caractère accentué en pèse deux.
const MAX_PASSWORD_BYTES = 72;

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Adresse e-mail invalide."));

const passwordSchema = z
  .string()
  .min(MIN_PASSWORD, `Le mot de passe doit contenir au moins ${MIN_PASSWORD} caractères.`);

const interactive = Boolean(process.stdin.isTTY);

// Caractères déjà reçus mais non encore consommés par une question. Un pipe
// envoie toutes les lignes d'un seul chunk : sans cette file, la fin du chunk
// serait perdue après la première question et la confirmation n'arriverait
// jamais. Le mode terminal n'a jamais de file, un humain valide ligne à ligne.
let queue = "";
let attached = false;
// Consommateur de caractères de la question en cours. Retourne false quand la
// ligne est terminée, ce qui libère la file pour la question suivante.
let active: ((char: string) => boolean) | null = null;

const onData = (chunk: string) => {
  for (const char of chunk) {
    if (active === null) {
      queue += char;
      continue;
    }
    if (active(char)) continue;
    active = null;
  }
};

/**
 * Lit une ligne sur stdin.
 *
 * En mode terminal on passe le TTY en raw et on gere l'echo nous-memes :
 * c'est la seule facon de masquer la saisie sans dependre de l'API privee
 * `_writeToOutput` de readline, dont le comportement change selon la version
 * de Node. Hors terminal (pipe, fichier, `docker exec` sans -t) le masquage
 * est impossible, donc on le dit au lieu de laisser croire que c'est masque.
 */
function ask(label: string, options: { secret?: boolean } = {}): Promise<string> {
  const secret = options.secret === true;

  if (!interactive && secret) {
    process.stdout.write(`${label}(terminal absent : la saisie ne sera pas masquée)\n`);
  } else {
    process.stdout.write(label);
  }

  return new Promise<string>((resolve) => {
    let value = "";

    const handle = (char: string): boolean => {
      if (char === "\r" || char === "\n") {
        active = null;
        process.stdout.write("\n");
        resolve(value);
        return false;
      }
      // Ctrl+C et Ctrl+D : abandon, plutot que valider une saisie partielle
      if (char === "\u0003" || char === "\u0004") {
        process.exit(130);
      }
      if (char === "\u007f" || char === "\b") {
        if (value.length === 0) return true;
        value = value.slice(0, -1);
        if (interactive) process.stdout.write("\b \b");
        return true;
      }
      if (char < " ") return true; // fleches, tabulations, sequences d'echappement
      value += char;
      if (interactive) process.stdout.write(secret ? "*" : char);
      return true;
    };

    active = handle;

    if (!attached) {
      attached = true;
      process.stdin.setEncoding("utf8");
      if (interactive) process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on("data", onData);
    }

    const buffered = queue;
    queue = "";
    let i = 0;
    for (; i < buffered.length; i += 1) {
      if (!handle(buffered[i])) {
        i += 1;
        break;
      }
    }
    queue = buffered.slice(i) + queue;
  });
}

/** Une seule ligne lisible : le JSON d/issues de zod est le format de l'API, pas celui d'une CLI. */
function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Saisie invalide.";
}

async function askEmail(): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parsed = emailSchema.safeParse(await ask("Email : "));
    if (parsed.success) return parsed.data;
    console.error(firstIssue(parsed.error));
  }
  throw new Error("Abandon : trop de saisies invalides.");
}

/** Demande le mot de passe deux fois, parce qu'aucun lien de reinitialisation n'existe. */
async function askNewPassword(): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const first = await ask("Mot de passe : ", { secret: true });
    const second = await ask("Confirmation   : ", { secret: true });

    if (first !== second) {
      console.error("Les deux saisies diffèrent, recommence.");
      continue;
    }

    const parsed = passwordSchema.safeParse(first);
    if (!parsed.success) {
      console.error(firstIssue(parsed.error));
      continue;
    }

    const bytes = Buffer.byteLength(first, "utf8");
    if (bytes > MAX_PASSWORD_BYTES) {
      console.error(
        `Mot de passe trop long : ${bytes} octets, maximum ${MAX_PASSWORD_BYTES}.`
      );
      continue;
    }

    return first;
  }
  throw new Error("Abandon : trop de saisies invalides.");
}

const COMMANDS = ["create", "password", "delete"] as const;
type Command = (typeof COMMANDS)[number];

const USAGE = [
  "Usage :",
  "  pnpm create-user                        crée un compte (email et mot de passe demandés)",
  "  pnpm create-user create <email>         crée un compte",
  "  pnpm create-user password <email>       réinitialise le mot de passe et révoque les sessions",
  "  pnpm create-user delete <email>         supprime le compte et toutes ses données (irréversible)",
].join("\n");

// Les 8 relations `user` du modèle User, toutes en onDelete: Cascade : supprimer
// un compte efface ses données sans que la base ne demande rien.
const CHILDREN = {
  reminders: "rappels",
  notes: "notes",
  transactions: "transactions",
  categories: "catégories",
  budgets: "budgets",
  pushSubscriptions: "abonnements push",
  scheduleEvents: "événements de planning",
  recipes: "recettes",
} as const;

async function createUser(email: string): Promise<void> {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error(
      `Un compte existe déjà pour ${email} (créé le ${existing.createdAt.toLocaleString("fr-FR")}). ` +
        `Ce script ne modifie rien. Pour réinitialiser son mot de passe :\n` +
        `  pnpm create-user password ${email}`
    );
  }

  const hashed = await bcrypt.hash(await askNewPassword(), 10);
  const user = await prisma.user.create({ data: { email, password: hashed } });

  console.log(`Compte créé : ${user.email} (id=${user.id})`);
}

async function resetPassword(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error(`Aucun compte pour ${email}.`);
  }

  const hashed = await bcrypt.hash(await askNewPassword(), 10);
  // Même champ et même mécanisme que app/api/auth/revoke : le proxy compare
  // tokenVersion à chaque requête, donc l'incrément invalide les JWT émis.
  const updated = await prisma.user.update({
    where: { email },
    data: { password: hashed, tokenVersion: { increment: 1 } },
  });

  console.log(`Mot de passe réinitialisé pour ${updated.email}.`);
  console.log(
    `tokenVersion ${user.tokenVersion} → ${updated.tokenVersion} : toutes les sessions ouvertes sont déconnectées.`
  );
}

async function deleteUser(email: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      _count: {
        select: {
          reminders: true,
          notes: true,
          transactions: true,
          categories: true,
          budgets: true,
          pushSubscriptions: true,
          scheduleEvents: true,
          recipes: true,
        },
      },
    },
  });
  if (!user) {
    throw new Error(`Aucun compte pour ${email}.`);
  }

  const counts = user._count;
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

  console.log(
    `Compte : ${user.email} (id=${user.id}, créé le ${user.createdAt.toLocaleString("fr-FR")})`
  );
  for (const [field, label] of Object.entries(CHILDREN)) {
    const count = counts[field as keyof typeof counts];
    if (count > 0) console.log(`  - ${label} : ${count}`);
  }
  console.log(
    total > 0
      ? `\n${total} élément(s) seront supprimés en cascade, sans retour possible.`
      : "\nAucune donnée rattachée, la suppression ne supprimera que le compte."
  );
  if (total > 0) {
    console.log("Pense à télécharger une sauvegarde via GET /api/export avant de continuer.");
  }

  // Pas de --yes : c'est la seule chose qui distingue une intention d'une faute
  // de frappe, sur une opération où les 8 relations sont en Cascade. POST
  // /api/import peut réinjecter une sauvegarde sur un autre compte, mais sous
  // de nouveaux id et un nouveau compte : ça n'annule pas cette suppression.
  const typed = await ask(`Pour confirmer, tape exactement l'email (${email}) : `);
  if (typed.trim() !== email) {
    throw new Error("Confirmation incorrecte : aucun compte n'a été supprimé.");
  }

  await prisma.user.delete({ where: { email } });
  console.log(`Compte supprimé : ${email}`);
}

async function main(): Promise<void> {
  const [first, second] = process.argv.slice(2);
  const command = (first ?? "create") as Command;

  if (!COMMANDS.includes(command)) {
    console.error(USAGE);
    process.exit(1);
  }

  let email: string;
  if (second === undefined) {
    email = await askEmail();
  } else {
    const parsed = emailSchema.safeParse(second);
    if (!parsed.success) {
      console.error(firstIssue(parsed.error));
      process.exit(1);
    }
    email = parsed.data;
  }

  if (command === "create") await createUser(email);
  else if (command === "password") await resetPassword(email);
  else await deleteUser(email);
}

main()
  .catch((e: unknown) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(async () => {
    process.stdin.pause();
    await prisma.$disconnect();
  });
