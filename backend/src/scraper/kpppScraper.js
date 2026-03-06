import axios from "axios";
import logger from "../config/logger.js";
import { parseKpppDateTime } from "../utils/date.js";
import { parseIndianCurrency } from "../utils/number.js";

const KPPP_API_BASE_URL = "https://kppp.karnataka.gov.in/supplier-registration-service/v1/api";
const SEARCH_PAGE_SIZE = 200;
const MAX_PAGES_PER_TAB = 30;

const TAB_CONFIGS = [
  {
    sourceTab: "goods",
    category: "GOODS",
    endpoint: "/portal-service/search-eproc-tenders"
  },
  {
    sourceTab: "works",
    category: "WORKS",
    endpoint: "/portal-service/works/search-eproc-tenders"
  },
  {
    sourceTab: "services",
    category: "SERVICES",
    endpoint: "/portal-service/services/search-eproc-tenders"
  }
];

const normalize = (value) => String(value || "").replace(/\s+/g, " ").trim();

function buildSearchPayload(category) {
  return {
    category,
    status: "PUBLISHED",
    tenderType: "OPEN"
  };
}

function buildSearchUrl(endpoint, page) {
  return `${KPPP_API_BASE_URL}${endpoint}?page=${page}&size=${SEARCH_PAGE_SIZE}&order-by-tender-publish=true`;
}

function mapApiTender(tabConfig, tender) {
  return {
    sourceTab: tabConfig.sourceTab,
    tenderNumber: normalize(tender.tenderNumber),
    entity: normalize(tender.deptName),
    location: normalize(tender.locationName),
    tenderName: normalize(tender.title || tender.description),
    type: normalize(tender.tenderType || tender.invitingStrategyText || tender.categoryText),
    estimatedValue: parseIndianCurrency(tender.ecv),
    publishedDate: parseKpppDateTime(tender.publishedDate),
    closingDate: parseKpppDateTime(tender.tenderClosureDate),
    detailUrl: null,
    downloadUrl: null,
    sourceUrl: buildSearchUrl(tabConfig.endpoint, 0)
  };
}

async function fetchTendersForTab(tabConfig) {
  const payload = buildSearchPayload(tabConfig.category);
  const rows = [];

  for (let page = 0; page < MAX_PAGES_PER_TAB; page += 1) {
    const url = buildSearchUrl(tabConfig.endpoint, page);

    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      timeout: 60000
    });

    const pageItems = Array.isArray(response.data) ? response.data : [];

    if (pageItems.length === 0) {
      break;
    }

    rows.push(...pageItems.map((item) => mapApiTender(tabConfig, item)));

    if (pageItems.length < SEARCH_PAGE_SIZE) {
      break;
    }
  }

  logger.info(
    { tab: tabConfig.sourceTab, count: rows.length },
    "Fetched tenders from KPPP portal-service endpoint."
  );

  return rows;
}

export async function scrapeKpppTenders() {
  const allRows = [];

  for (const tabConfig of TAB_CONFIGS) {
    try {
      const tabRows = await fetchTendersForTab(tabConfig);
      allRows.push(...tabRows);
    } catch (error) {
      logger.error(
        {
          tab: tabConfig.sourceTab,
          message: error?.message || "unknown error"
        },
        "Failed to fetch tenders for tab."
      );
    }
  }

  const uniqueRows = [];
  const seen = new Set();
  for (const row of allRows) {
    const key = `${row.sourceTab}:${row.tenderNumber}`;
    if (!row.tenderNumber || seen.has(key)) {
      continue;
    }
    seen.add(key);
    uniqueRows.push(row);
  }

  if (uniqueRows.length === 0) {
    throw new Error("No tenders were returned from KPPP portal-service endpoints.");
  }

  return {
    scrapedAt: new Date().toISOString(),
    tenders: uniqueRows
  };
}
