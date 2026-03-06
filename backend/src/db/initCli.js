import { initDb } from "./init.js";
import logger from "../config/logger.js";
import { pool } from "./client.js";

async function main() {
  await initDb();
  logger.info("Database initialized.");
}

main()
  .catch((error) => {
    logger.error({ error }, "Failed to initialize database");
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
