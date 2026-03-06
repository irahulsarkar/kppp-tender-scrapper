import nodemailer from "nodemailer";
import twilio from "twilio";
import { env } from "../config/env.js";
import logger from "../config/logger.js";

function formatCurrency(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value));
}

function buildAlertMessage(tenders) {
  const header = `High-value KPPP tenders (${tenders.length})`;
  const lines = tenders.slice(0, 20).map((tender, index) => {
    return `${index + 1}. ${tender.tenderNumber} | ${formatCurrency(tender.estimatedValue)} | ${tender.entity}`;
  });

  return `${header}\n${lines.join("\n")}`;
}

async function sendEmailAlert(message) {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS || !env.MAIL_TO || !env.MAIL_FROM) {
    logger.warn("Email alerts enabled but SMTP env vars are incomplete. Skipping email alert.");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: env.MAIL_FROM,
    to: env.MAIL_TO,
    subject: "KPPP High-Value Tender Alert",
    text: message
  });
}

async function sendWhatsappAlert(message) {
  if (
    !env.TWILIO_ACCOUNT_SID ||
    !env.TWILIO_AUTH_TOKEN ||
    !env.WHATSAPP_FROM ||
    !env.WHATSAPP_TO
  ) {
    logger.warn("WhatsApp alerts enabled but Twilio env vars are incomplete. Skipping WhatsApp alert.");
    return;
  }

  const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
  await client.messages.create({
    from: env.WHATSAPP_FROM,
    to: env.WHATSAPP_TO,
    body: message
  });
}

export async function sendHighValueAlerts(newTenders) {
  const eligible = newTenders.filter(
    (tender) => Number(tender.estimatedValue || 0) >= env.HIGH_VALUE_ALERT_THRESHOLD
  );

  if (eligible.length === 0) {
    return;
  }

  const message = buildAlertMessage(eligible);

  if (env.ENABLE_EMAIL_ALERTS) {
    try {
      await sendEmailAlert(message);
    } catch (error) {
      logger.error({ error }, "Email alert failed.");
    }
  }

  if (env.ENABLE_WHATSAPP_ALERTS) {
    try {
      await sendWhatsappAlert(message);
    } catch (error) {
      logger.error({ error }, "WhatsApp alert failed.");
    }
  }
}
