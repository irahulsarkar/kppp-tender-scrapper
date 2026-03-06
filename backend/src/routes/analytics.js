import { Router } from "express";
import { env } from "../config/env.js";
import { getLatestScrapeRun, getSummary } from "../db/repository.js";

const router = Router();

router.get("/summary", async (req, res, next) => {
  try {
    const [summary, latestRun] = await Promise.all([
      getSummary(env.HIGH_VALUE_ALERT_THRESHOLD),
      getLatestScrapeRun()
    ]);

    res.json({
      success: true,
      ...summary,
      latestRun
    });
  } catch (error) {
    next(error);
  }
});

export default router;
