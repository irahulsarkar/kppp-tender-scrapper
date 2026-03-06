import pino from "pino";
import { env } from "./env.js";

const transport =
  env.NODE_ENV === "development"
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard"
        }
      }
    : undefined;

const logger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  transport
});

export default logger;
