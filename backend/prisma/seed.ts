import { config } from "dotenv";
config();

import { prisma } from "../src/lib/prisma.js";
import { syncEnvUser } from "../src/lib/envUser.js";

/**
 * Ensures the env-configured user exists (same as API startup).
 * Requires `BUDGET_ADMIN_USERNAME` and `BUDGET_ADMIN_PASSWORD` in `.env` or the environment.
 */
async function main() {
  await syncEnvUser();
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
