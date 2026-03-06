import axios from "axios";
import { createWorker } from "tesseract.js";
import { env } from "../config/env.js";

const CAPTCHA_IMAGE_SELECTORS = [
  "img[id*='captcha' i]",
  "img[src*='captcha' i]",
  "canvas[id*='captcha' i]"
];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function normalizeCaptchaText(rawText) {
  return String(rawText || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .trim();
}

async function getFirstCaptchaElement(page) {
  for (const selector of CAPTCHA_IMAGE_SELECTORS) {
    const element = await page.$(selector);
    if (element) {
      return element;
    }
  }
  return null;
}

export async function captureCaptchaBase64(page) {
  const element = await getFirstCaptchaElement(page);
  if (!element) {
    throw new Error("CAPTCHA image element not found.");
  }

  const base64 = await element.screenshot({ encoding: "base64" });
  return String(base64);
}

async function solveWithTesseract(base64) {
  const worker = await createWorker("eng");
  try {
    const { data } = await worker.recognize(Buffer.from(base64, "base64"));
    return normalizeCaptchaText(data?.text);
  } finally {
    await worker.terminate();
  }
}

async function solveWith2Captcha(base64) {
  if (!env.CAPTCHA_API_KEY) {
    throw new Error("CAPTCHA_API_KEY is required when CAPTCHA_PROVIDER=2captcha.");
  }

  const submitResponse = await axios.post("http://2captcha.com/in.php", null, {
    params: {
      key: env.CAPTCHA_API_KEY,
      method: "base64",
      body: base64,
      json: 1
    },
    timeout: 30000
  });

  if (submitResponse.data?.status !== 1) {
    throw new Error(`2captcha submit failed: ${submitResponse.data?.request || "unknown error"}`);
  }

  const captchaId = submitResponse.data.request;

  for (let attempt = 1; attempt <= 24; attempt += 1) {
    await delay(5000);

    const resultResponse = await axios.get("http://2captcha.com/res.php", {
      params: {
        key: env.CAPTCHA_API_KEY,
        action: "get",
        id: captchaId,
        json: 1
      },
      timeout: 30000
    });

    if (resultResponse.data?.status === 1) {
      return normalizeCaptchaText(resultResponse.data.request);
    }

    if (resultResponse.data?.request !== "CAPCHA_NOT_READY") {
      throw new Error(`2captcha failed: ${resultResponse.data?.request || "unknown error"}`);
    }
  }

  throw new Error("2captcha timeout while solving CAPTCHA.");
}

export async function solveCaptcha(page) {
  if (env.CAPTCHA_PROVIDER === "manual") {
    throw new Error(
      "CAPTCHA_PROVIDER=manual is configured. Set CAPTCHA_PROVIDER to tesseract or 2captcha."
    );
  }

  const base64 = await captureCaptchaBase64(page);

  if (env.CAPTCHA_PROVIDER === "2captcha") {
    return solveWith2Captcha(base64);
  }

  return solveWithTesseract(base64);
}
