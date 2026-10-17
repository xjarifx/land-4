import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Demo@1234", 12);

  await prisma.user.upsert({
    where: { nid: "1987654321098" },
    update: { name: "Demo Citizen", passwordHash },
    create: {
      nid: "1987654321098",
      name: "Demo Citizen",
      passwordHash
    }
  });

  console.log("Seeded demo user: NID 1987654321098 / password Demo@1234");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
