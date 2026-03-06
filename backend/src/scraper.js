import logger from "./config/logger.js";
import { pool } from "./db/client.js";
import { initDb } from "./db/init.js";
import { runScrapeCycle } from "./services/tenderService.js";

async function main() {
  await initDb();
  const result = await runScrapeCycle("manual-cli");
  logger.info({ result }, "Manual scrape completed.");
}

main()
  .catch((error) => {
    logger.error({ error }, "Manual scrape failed.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
