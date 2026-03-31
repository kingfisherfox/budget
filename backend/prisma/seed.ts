import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const n = await prisma.user.count();
  if (n > 0) return;
  const passwordHash = await bcrypt.hash("password123", 12);
  await prisma.user.create({
    data: {
      username: "owner",
      passwordHash,
      appSettings: { create: { currencyCode: "THB", domainName: "" } },
    },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
