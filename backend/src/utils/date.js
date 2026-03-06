import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);

const ZONE = "Asia/Kolkata";

const DATE_FORMATS = ["DD-MM-YYYY", "DD/MM/YYYY", "YYYY-MM-DD"];
const DATE_TIME_FORMATS = [
  "DD-MM-YYYY HH:mm",
  "DD-MM-YYYY HH:mm:ss",
  "DD/MM/YYYY HH:mm",
  "DD/MM/YYYY HH:mm:ss",
  "DD-MM-YYYY hh:mm A",
  "DD/MM/YYYY hh:mm A"
];

const normalizeInput = (value) => String(value || "").replace(/\s+/g, " ").trim();

export function parseKpppDate(value) {
  const input = normalizeInput(value);
  if (!input) {
    return null;
  }

  for (const format of DATE_FORMATS) {
    const parsed = dayjs.tz(input, format, ZONE);
    if (parsed.isValid()) {
      return parsed.toISOString();
    }
  }

  const fallback = dayjs(input);
  return fallback.isValid() ? fallback.tz(ZONE).toISOString() : null;
}

export function parseKpppDateTime(value) {
  const input = normalizeInput(value);
  if (!input) {
    return null;
  }

  for (const format of [...DATE_TIME_FORMATS, ...DATE_FORMATS]) {
    const parsed = dayjs.tz(input, format, ZONE);
    if (parsed.isValid()) {
      return parsed.toISOString();
    }
  }

  const fallback = dayjs(input);
  return fallback.isValid() ? fallback.tz(ZONE).toISOString() : null;
}

export function formatDateForUI(isoDate) {
  if (!isoDate) {
    return "";
  }

  const parsed = dayjs(isoDate);
  if (!parsed.isValid()) {
    return "";
  }

  return parsed.tz(ZONE).format("DD-MM-YYYY");
}

export function formatDateTimeForUI(isoDateTime) {
  if (!isoDateTime) {
    return "";
  }

  const parsed = dayjs(isoDateTime);
  if (!parsed.isValid()) {
    return "";
  }

  return parsed.tz(ZONE).format("DD-MM-YYYY HH:mm");
}
