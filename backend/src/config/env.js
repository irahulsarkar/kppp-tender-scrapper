import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  CORS_ORIGIN: z.string().default("*"),
  DATABASE_URL: z
    .string()
    .default("postgres://postgres:postgres@localhost:5432/kppp_tenders"),
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

const parsed = envSchema.parse(process.env);

const toBool = (value) => value === "true" || value === "1";

export const env = {
  ...parsed,
  SCRAPE_HEADLESS: toBool(parsed.SCRAPE_HEADLESS),
  SCRAPE_ON_START: toBool(parsed.SCRAPE_ON_START),
  ENABLE_EMAIL_ALERTS: toBool(parsed.ENABLE_EMAIL_ALERTS),
  SMTP_SECURE: toBool(parsed.SMTP_SECURE),
  ENABLE_WHATSAPP_ALERTS: toBool(parsed.ENABLE_WHATSAPP_ALERTS)
};
