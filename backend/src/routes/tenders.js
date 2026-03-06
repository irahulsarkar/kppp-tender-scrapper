import { Router } from "express";
import ExcelJS from "exceljs";
import { Parser } from "json2csv";
import { getTenders } from "../db/repository.js";

const router = Router();

function parseNumber(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseFilters(query, forcedTab) {
  return {
    tab: forcedTab || query.tab,
    department: query.department,
    district: query.district,
    search: query.search,
    type: query.type,
    aiCategory: query.aiCategory,
    minValue: parseNumber(query.minValue),
    maxValue: parseNumber(query.maxValue),
    closingDate: query.closingDate,
    page: parseNumber(query.page),
    limit: parseNumber(query.limit),
    sortBy: query.sortBy,
    sortOrder: query.sortOrder
  };
}

function toExportRow(tender) {
  return {
    tenderNumber: tender.tenderNumber,
    procuringEntity: tender.entity,
    location: tender.location,
    tenderName: tender.tenderName,
    estimatedValue: tender.estimatedValue,
    nitPublishedDate: tender.publishedDate,
    lastDateTimeForBidClosure: tender.closingDate,
    tenderType: tender.type,
    aiTenderType: tender.aiCategory,
    category: tender.sourceTab,
    detailUrl: tender.detailUrl,
    downloadUrl: tender.downloadUrl
  };
}

async function listTenders(req, res, next, tab) {
  try {
    const filters = parseFilters(req.query, tab);
    const result = await getTenders(filters);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
}

router.get("/works", async (req, res, next) => listTenders(req, res, next, "works"));
router.get("/services", async (req, res, next) => listTenders(req, res, next, "services"));
router.get("/goods", async (req, res, next) => listTenders(req, res, next, "goods"));

router.get("/new", async (req, res, next) => {
  try {
    const filters = parseFilters(req.query);
    const result = await getTenders({
      ...filters,
      newSinceHours: 24
    });
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
});

router.get("/export/csv", async (req, res, next) => {
  try {
    const filters = parseFilters(req.query);
    const result = await getTenders({
      ...filters,
      page: 1,
      limit: 10000
    });

    const parser = new Parser({
      fields: [
        { label: "Tender Number", value: "tenderNumber" },
        { label: "Procuring Entity", value: "procuringEntity" },
        { label: "Location", value: "location" },
        { label: "Tender Name", value: "tenderName" },
        { label: "Estimated Value", value: "estimatedValue" },
        { label: "NIT Published Date", value: "nitPublishedDate" },
        { label: "Last Date & Time for Bid Closure", value: "lastDateTimeForBidClosure" },
        { label: "Tender Type", value: "tenderType" },
        { label: "AI Tender Type", value: "aiTenderType" },
        { label: "Category", value: "category" },
        { label: "View Details", value: "detailUrl" },
        { label: "Download Tender", value: "downloadUrl" }
      ]
    });

    const rows = result.items.map(toExportRow);
    const csv = parser.parse(rows);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=\"kppp-tenders.csv\"");
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

router.get("/export/xlsx", async (req, res, next) => {
  try {
    const filters = parseFilters(req.query);
    const result = await getTenders({
      ...filters,
      page: 1,
      limit: 10000
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("KPPP Tenders");

    sheet.columns = [
      { header: "Tender Number", key: "tenderNumber", width: 26 },
      { header: "Procuring Entity", key: "procuringEntity", width: 40 },
      { header: "Location", key: "location", width: 32 },
      { header: "Tender Name", key: "tenderName", width: 48 },
      { header: "Estimated Value", key: "estimatedValue", width: 20 },
      { header: "NIT Published Date", key: "nitPublishedDate", width: 24 },
      { header: "Last Date & Time for Bid Closure", key: "lastDateTimeForBidClosure", width: 28 },
      { header: "Tender Type", key: "tenderType", width: 16 },
      { header: "AI Tender Type", key: "aiTenderType", width: 18 },
      { header: "Category", key: "category", width: 14 },
      { header: "View Details", key: "detailUrl", width: 40 },
      { header: "Download Tender", key: "downloadUrl", width: 40 }
    ];

    for (const tender of result.items) {
      sheet.addRow(toExportRow(tender));
    }

    sheet.getRow(1).font = { bold: true };
    sheet.autoFilter = "A1:L1";

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=\"kppp-tenders.xlsx\""
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => listTenders(req, res, next));

export default router;
