import logger from "./config/logger.js";
import { pool } from "./db/client.js";
import { initDb } from "./db/init.js";
import { startCronScheduler, stopCronScheduler } from "./scheduler/cron.js";

async function main() {
  await initDb();
  startCronScheduler();
  logger.info("Cron worker started.");
}

async function shutdown(signal) {
  logger.info({ signal }, "Stopping cron worker.");
  stopCronScheduler();
  await pool.end();
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

main().catch(async (error) => {
  logger.error({ error }, "Cron worker failed.");
  await pool.end();
  process.exit(1);
});
