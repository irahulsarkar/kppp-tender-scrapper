import cors from "cors";
import express from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { env } from "./config/env.js";
import logger from "./config/logger.js";
import { pool } from "./db/client.js";
import { initDb } from "./db/init.js";
import analyticsRoutes from "./routes/analytics.js";
import healthRoutes from "./routes/health.js";
import tenderRoutes from "./routes/tenders.js";
import { startCronScheduler, stopCronScheduler } from "./scheduler/cron.js";
import { runScrapeCycle } from "./services/tenderService.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(",").map((v) => v.trim())
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(pinoHttp({ logger }));

app.use("/api/health", healthRoutes);
app.use("/api/tenders", tenderRoutes);
app.use("/api/analytics", analyticsRoutes);

app.post("/api/scrape/trigger", async (req, res, next) => {
  try {
    const result = await runScrapeCycle("api-trigger");
    res.json({
      success: true,
      result
    });
  } catch (error) {
    next(error);
  }
});

app.use((error, req, res, next) => {
  req.log.error({ error }, "Unhandled request error.");
  res.status(500).json({
    success: false,
    message: error.message || "Internal server error."
  });
});

let server;

async function bootstrap() {
  await initDb();

  if (env.SCRAPE_ON_START) {
    try {
      await runScrapeCycle("startup");
    } catch (error) {
      logger.error({ error }, "Startup scrape failed.");
    }
  }

  startCronScheduler();

  server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, "Backend server started.");
  });
}

async function shutdown(signal) {
  logger.info({ signal }, "Shutdown signal received.");
  stopCronScheduler();

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  await pool.end();
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

bootstrap().catch((error) => {
  logger.error({ error }, "Failed to bootstrap backend.");
  process.exit(1);
});
