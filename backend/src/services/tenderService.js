import { env } from "../config/env.js";
import logger from "../config/logger.js";
import { withRetry } from "../utils/retry.js";
import { scrapeKpppTenders } from "../scraper/kpppScraper.js";
import { finishScrapeRun, startScrapeRun, upsertTenders } from "../db/repository.js";
import { sendHighValueAlerts } from "./alertService.js";

let isScrapeInProgress = false;

export async function runScrapeCycle(reason = "manual") {
  if (isScrapeInProgress) {
    logger.warn({ reason }, "Scrape skipped because another run is already in progress.");
    return {
      skipped: true,
      reason: "already-running"
    };
  }

  isScrapeInProgress = true;
  const runId = await startScrapeRun(reason);

  try {
    logger.info({ reason }, "Starting scrape cycle.");

    const scrapeResult = await withRetry(
      async () => scrapeKpppTenders(),
      {
        attempts: env.SCRAPE_RETRY_ATTEMPTS,
        baseDelayMs: 3000,
        onRetry: (error, attempt) => {
          logger.warn(
            { error, attempt },
            "Scrape failed, retrying."
          );
        }
      }
    );

    const { tenders } = scrapeResult;
    const upsertResult = await upsertTenders(tenders);

    await sendHighValueAlerts(upsertResult.insertedTenders);

    const payload = {
      status: "success",
      message: `Scraped ${tenders.length} rows.`,
      rowCount: tenders.length,
      insertedCount: upsertResult.insertedCount,
      updatedCount: upsertResult.updatedCount
    };

    await finishScrapeRun(runId, payload);
    logger.info(payload, "Scrape cycle completed.");

    return {
      ...payload,
      skipped: false
    };
  } catch (error) {
    logger.error({ error }, "Scrape cycle failed.");
    await finishScrapeRun(runId, {
      status: "failed",
      message: error.message || "Unknown error",
      rowCount: 0,
      insertedCount: 0,
      updatedCount: 0
    });
    throw error;
  } finally {
    isScrapeInProgress = false;
  }
}
