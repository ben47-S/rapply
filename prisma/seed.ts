import "dotenv/config";
import prisma from "../app/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const email = "test@gmail.com";
  const password = "12345678";

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      password: hashed,
    },
  });

  console.log(`Seeded user: ${user.email} (id=${user.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
