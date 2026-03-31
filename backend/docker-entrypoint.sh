#!/bin/sh
set -e
npx prisma migrate deploy
node <<'NODE'
const { PrismaClient } = require("@prisma/client");
(async () => {
  const p = new PrismaClient();
  await p.appSettings.upsert({
    where: { id: 1 },
    create: { id: 1, currencyCode: "THB" },
    update: {},
  });
  await p.$disconnect();
})();
NODE
exec "$@"
