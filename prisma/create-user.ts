import "dotenv/config";
import prisma from "../app/lib/prisma";
import bcrypt from "bcryptjs";
import readline from "readline";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (q: string) => new Promise<string>((r) => rl.question(q, r));

async function main() {
  const email = await question("Email : ");
  const password = await question("Mot de passe : ");
  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, password: hashed },
  });

  console.log(`User créé : ${user.email} (id=${user.id})`);
  rl.close();
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
