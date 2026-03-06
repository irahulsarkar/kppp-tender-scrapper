import dotenv from "dotenv";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRootDir = resolve(__dirname, "../..");

// Always load backend/.env when present, even if command is run from repo root.
dotenv.config({
  path: resolve(backendRootDir, ".env")
});

const defaultDatabaseUrl = "postgres://postgres:postgres@localhost:5432/kppp_tenders";
const localhostRegex = /(localhost|127\.0\.0\.1)/i;
const rawNodeEnv = process.env.NODE_ENV ?? "development";
const nodeEnv = z.enum(["development", "test", "production"]).parse(rawNodeEnv);

const buildDatabaseUrlFromPgVars = () => {
  const host = process.env.PGHOST;
  const port = process.env.PGPORT ?? "5432";
  const user = process.env.PGUSER;
  const password = process.env.PGPASSWORD;
  const database = process.env.PGDATABASE;

  if (!host || !user || !database) {
    return undefined;
  }

  const encodedUser = encodeURIComponent(user);
  const auth =
    password && password.length > 0
      ? `${encodedUser}:${encodeURIComponent(password)}`
      : encodedUser;

  return `postgres://${auth}@${host}:${port}/${database}`;
};

const dbCandidates = [
  process.env.INTERNAL_DATABASE_URL,
  process.env.RENDER_DATABASE_URL,
  process.env.POSTGRES_INTERNAL_URL,
  process.env.POSTGRES_URL,
  process.env.DATABASE_URL,
  buildDatabaseUrlFromPgVars()
].filter((value) => typeof value === "string" && value.length > 0);

const resolvedDatabaseUrl =
  nodeEnv === "production"
    ? dbCandidates.find((value) => !localhostRegex.test(value)) ?? dbCandidates[0]
    : process.env.DATABASE_URL ?? dbCandidates[0] ?? defaultDatabaseUrl;

if (nodeEnv === "production" && !resolvedDatabaseUrl) {
  throw new Error(
    "Missing DATABASE_URL in production. Set DATABASE_URL to your managed Postgres connection string " +
      "(for Render, use Internal Database URL)."
  );
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  CORS_ORIGIN: z.string().default("*"),
  DATABASE_URL: z.string().min(1),
  SCRAPE_URL: z.string().url().default("https://kppp.karnataka.gov.in"),
  SCRAPE_HEADLESS: z.string().default("true"),
  SCRAPE_TIMEOUT_MS: z.coerce.number().int().positive().default(120000),
  SCRAPE_RETRY_ATTEMPTS: z.coerce.number().int().positive().default(3),
  SCRAPE_INTERVAL_MINUTES: z.coerce.number().int().positive().default(30),
  SCRAPE_ON_START: z.string().default("true"),
  CAPTCHA_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  CAPTCHA_PROVIDER: z.enum(["tesseract", "2captcha", "manual"]).default("tesseract"),
  CAPTCHA_API_KEY: z.string().optional(),
  PUPPETEER_EXECUTABLE_PATH: z.string().optional(),
  HIGH_VALUE_ALERT_THRESHOLD: z.coerce.number().nonnegative().default(1000000),
  ENABLE_EMAIL_ALERTS: z.string().default("false"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z.string().default("false"),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().optional(),
  MAIL_TO: z.string().optional(),
  ENABLE_WHATSAPP_ALERTS: z.string().default("false"),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  WHATSAPP_FROM: z.string().optional(),
  WHATSAPP_TO: z.string().optional()
});

const parsed = envSchema.parse({
  ...process.env,
  NODE_ENV: nodeEnv,
  DATABASE_URL: resolvedDatabaseUrl
});

if (
  parsed.NODE_ENV === "production" &&
  localhostRegex.test(parsed.DATABASE_URL)
) {
  throw new Error(
    "Invalid DATABASE_URL for production: it points to localhost. " +
      "Set DATABASE_URL to your managed Postgres connection string (for Render, use Internal Database URL)."
  );
}

const toBool = (value) => value === "true" || value === "1";

export const env = {
  ...parsed,
  SCRAPE_HEADLESS: toBool(parsed.SCRAPE_HEADLESS),
  SCRAPE_ON_START: toBool(parsed.SCRAPE_ON_START),
  ENABLE_EMAIL_ALERTS: toBool(parsed.ENABLE_EMAIL_ALERTS),
  SMTP_SECURE: toBool(parsed.SMTP_SECURE),
  ENABLE_WHATSAPP_ALERTS: toBool(parsed.ENABLE_WHATSAPP_ALERTS)
};
