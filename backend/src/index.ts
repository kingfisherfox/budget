import { config } from "dotenv";
config();

import { createApp } from "./app.js";
import { syncEnvUser } from "./lib/envUser.js";

const port = Number(process.env.PORT ?? 4000);

async function main() {
  await syncEnvUser();
  const app = createApp();
  app.listen(port, () => {
    console.log(`API listening on ${port}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
