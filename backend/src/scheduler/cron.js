import cron from "node-cron";
import { env } from "../config/env.js";
import logger from "../config/logger.js";
import { runScrapeCycle } from "../services/tenderService.js";

let task;

function buildExpression(intervalMinutes) {
  if (intervalMinutes >= 60) {
    const hourStep = Math.max(1, Math.floor(intervalMinutes / 60));
    return `0 */${hourStep} * * *`;
  }

  return `*/${intervalMinutes} * * * *`;
}

export function startCronScheduler() {
  const expression = buildExpression(env.SCRAPE_INTERVAL_MINUTES);

  task = cron.schedule(
    expression,
    async () => {
      try {
        await runScrapeCycle("cron");
      } catch (error) {
        logger.error({ error }, "Scheduled scrape run failed.");
      }
    },
    { timezone: "Asia/Kolkata" }
  );

  logger.info(
    { expression, intervalMinutes: env.SCRAPE_INTERVAL_MINUTES },
    "Scraper schedule started."
  );
}

export function stopCronScheduler() {
  if (task) {
    task.stop();
    task = null;
  }
}
