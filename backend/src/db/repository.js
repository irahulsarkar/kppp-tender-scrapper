import { pool } from "./client.js";
import { safeNumber } from "../utils/number.js";
import { inferTenderAiCategory } from "../services/tenderClassifier.js";

const ALLOWED_SORT_BY = new Set([
  "estimated_value",
  "published_date",
  "closing_date",
  "updated_at"
]);

function mapTenderRow(row) {
  return {
    id: row.id,
    sourceTab: row.source_tab,
    tenderNumber: row.tender_number,
    entity: row.entity,
    location: row.location,
    tenderName: row.tender_name,
    type: row.tender_type,
    aiCategory: row.ai_category,
    estimatedValue:
      row.estimated_value === null ? null : Number.parseFloat(row.estimated_value),
    publishedDate: row.published_date,
    closingDate: row.closing_date,
    detailUrl: row.detail_url,
    downloadUrl: row.download_url,
    sourceUrl: row.source_url,
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function buildTenderWhere(filters = {}, startIndex = 1) {
  const values = [];
  const clauses = [];
  let idx = startIndex;

  if (filters.tab) {
    clauses.push(`source_tab = $${idx}`);
    values.push(filters.tab.toLowerCase());
    idx += 1;
  }

  if (filters.department) {
    clauses.push(`entity ILIKE $${idx}`);
    values.push(`%${filters.department}%`);
    idx += 1;
  }

  if (filters.district) {
    clauses.push(`location ILIKE $${idx}`);
    values.push(`%${filters.district}%`);
    idx += 1;
  }

  if (filters.search) {
    clauses.push(`tender_number ILIKE $${idx}`);
    values.push(`%${filters.search}%`);
    idx += 1;
  }

  if (filters.type) {
    clauses.push(`tender_type ILIKE $${idx}`);
    values.push(`%${filters.type}%`);
    idx += 1;
  }

  if (filters.aiCategory) {
    clauses.push(`LOWER(ai_category) = LOWER($${idx})`);
    values.push(filters.aiCategory);
    idx += 1;
  }

  if (filters.minValue !== undefined) {
    clauses.push(`estimated_value >= $${idx}`);
    values.push(filters.minValue);
    idx += 1;
  }

  if (filters.maxValue !== undefined) {
    clauses.push(`estimated_value <= $${idx}`);
    values.push(filters.maxValue);
    idx += 1;
  }

  if (filters.closingDate) {
    clauses.push(`DATE(closing_date AT TIME ZONE 'Asia/Kolkata') = $${idx}::date`);
    values.push(filters.closingDate);
    idx += 1;
  }

  if (filters.newSinceHours !== undefined) {
    clauses.push(`first_seen_at >= NOW() - ($${idx} || ' hours')::interval`);
    values.push(filters.newSinceHours);
    idx += 1;
  }

  return {
    whereSql: clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "",
    values,
    nextIndex: idx
  };
}

export async function startScrapeRun(reason) {
  const { rows } = await pool.query(
    `
      INSERT INTO scrape_runs (reason, status, started_at)
      VALUES ($1, 'running', NOW())
      RETURNING id
    `,
    [reason || "manual"]
  );

  return rows[0].id;
}

export async function finishScrapeRun(runId, payload) {
  await pool.query(
    `
      UPDATE scrape_runs
      SET
        status = $2,
        message = $3,
        row_count = $4,
        inserted_count = $5,
        updated_count = $6,
        finished_at = NOW()
      WHERE id = $1
    `,
    [
      runId,
      payload.status,
      payload.message || "",
      payload.rowCount || 0,
      payload.insertedCount || 0,
      payload.updatedCount || 0
    ]
  );
}

export async function upsertTenders(tenders) {
  const client = await pool.connect();
  const insertedTenders = [];
  let insertedCount = 0;
  let updatedCount = 0;

  try {
    await client.query("BEGIN");

    for (const tender of tenders) {
      const values = [
        tender.sourceTab,
        tender.tenderNumber,
        tender.entity,
        tender.location,
        tender.tenderName,
        tender.type,
        tender.aiCategory || inferTenderAiCategory(tender),
        tender.estimatedValue,
        tender.publishedDate,
        tender.closingDate,
        tender.detailUrl,
        tender.downloadUrl,
        tender.sourceUrl
      ];

      const { rows } = await client.query(
        `
        INSERT INTO tenders (
          source_tab,
          tender_number,
          entity,
          location,
          tender_name,
          tender_type,
          ai_category,
          estimated_value,
          published_date,
          closing_date,
          detail_url,
          download_url,
          source_url
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
        )
        ON CONFLICT (source_tab, tender_number)
        DO UPDATE SET
          entity = EXCLUDED.entity,
          location = EXCLUDED.location,
          tender_name = EXCLUDED.tender_name,
          tender_type = EXCLUDED.tender_type,
          ai_category = EXCLUDED.ai_category,
          estimated_value = EXCLUDED.estimated_value,
          published_date = EXCLUDED.published_date,
          closing_date = EXCLUDED.closing_date,
          detail_url = EXCLUDED.detail_url,
          download_url = EXCLUDED.download_url,
          source_url = EXCLUDED.source_url,
          last_seen_at = NOW(),
          updated_at = NOW()
        RETURNING (xmax = 0) AS inserted
      `,
        values
      );

      if (rows[0].inserted) {
        insertedCount += 1;
        insertedTenders.push(tender);
      } else {
        updatedCount += 1;
      }
    }

    await client.query("COMMIT");
    return { insertedCount, updatedCount, insertedTenders };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getTenders(filters = {}) {
  const limit = Math.max(1, Math.min(500, safeNumber(filters.limit, 100)));
  const page = Math.max(1, safeNumber(filters.page, 1));
  const offset = (page - 1) * limit;

  const sortBy = ALLOWED_SORT_BY.has(filters.sortBy)
    ? filters.sortBy
    : "closing_date";
  const sortOrder = String(filters.sortOrder || "asc").toLowerCase() === "desc" ? "DESC" : "ASC";

  const { whereSql, values, nextIndex } = buildTenderWhere(filters);
  const countQuery = `SELECT COUNT(*)::int AS total FROM tenders ${whereSql}`;
  const dataQuery = `
    SELECT *
    FROM tenders
    ${whereSql}
    ORDER BY ${sortBy} ${sortOrder} NULLS LAST, updated_at DESC
    LIMIT $${nextIndex}
    OFFSET $${nextIndex + 1}
  `;

  const [{ rows: countRows }, { rows: dataRows }] = await Promise.all([
    pool.query(countQuery, values),
    pool.query(dataQuery, [...values, limit, offset])
  ]);

  return {
    total: countRows[0]?.total || 0,
    page,
    limit,
    items: dataRows.map(mapTenderRow)
  };
}

export async function getSummary(highValueThreshold) {
  const [primaryResult, byTabResult, trendResult] = await Promise.all([
    pool.query(
      `
        SELECT
          (SELECT COUNT(*)::int FROM tenders) AS live_tenders,
          (
            SELECT COUNT(*)::int
            FROM tenders
            WHERE DATE(closing_date AT TIME ZONE 'Asia/Kolkata') =
              DATE(NOW() AT TIME ZONE 'Asia/Kolkata')
          ) AS closing_today,
          (
            SELECT COUNT(*)::int
            FROM tenders
            WHERE estimated_value >= $1
          ) AS high_value_tenders
      `,
      [highValueThreshold]
    ),
    pool.query(
      `
        SELECT source_tab AS tab, COUNT(*)::int AS count
        FROM tenders
        GROUP BY source_tab
        ORDER BY source_tab
      `
    ),
    pool.query(
      `
        SELECT
          DATE(first_seen_at AT TIME ZONE 'Asia/Kolkata')::text AS date,
          COUNT(*)::int AS count
        FROM tenders
        WHERE first_seen_at >= NOW() - INTERVAL '14 days'
        GROUP BY 1
        ORDER BY 1
      `
    )
  ]);

  return {
    cards: {
      liveTenders: primaryResult.rows[0]?.live_tenders || 0,
      closingToday: primaryResult.rows[0]?.closing_today || 0,
      highValueTenders: primaryResult.rows[0]?.high_value_tenders || 0
    },
    byTab: byTabResult.rows,
    trend: trendResult.rows
  };
}

export async function getLatestScrapeRun() {
  const { rows } = await pool.query(
    `
      SELECT *
      FROM scrape_runs
      ORDER BY started_at DESC
      LIMIT 1
    `
  );
  return rows[0] || null;
}
