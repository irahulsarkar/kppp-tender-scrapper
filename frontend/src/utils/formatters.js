import dayjs from "dayjs";

export function formatCurrency(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value));
}

export function formatDate(value) {
  if (!value) {
    return "N/A";
  }

  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("DD-MM-YYYY") : "N/A";
}

export function formatDateTime(value) {
  if (!value) {
    return "N/A";
  }

  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("DD-MM-YYYY HH:mm") : "N/A";
}
