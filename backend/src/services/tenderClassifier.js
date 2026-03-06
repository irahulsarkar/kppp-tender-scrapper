const CATEGORY_RULES = [
  {
    label: "IT",
    keywords: [
      "software",
      "hardware",
      "server",
      "network",
      "it support",
      "cyber",
      "data center",
      "laptop",
      "desktop",
      "cloud",
      "application development",
      "erp",
      "digitization",
      "cctv",
      "biometric"
    ]
  },
  {
    label: "Civil",
    keywords: [
      "construction",
      "building",
      "road",
      "bridge",
      "drain",
      "pavement",
      "retaining wall",
      "culvert",
      "concrete",
      "asphalt",
      "renovation",
      "civil work"
    ]
  },
  {
    label: "Electrical",
    keywords: [
      "electrical",
      "transformer",
      "substation",
      "cable",
      "street light",
      "electrification",
      "ht line",
      "lt line",
      "switchgear",
      "solar",
      "generator"
    ]
  },
  {
    label: "Mechanical",
    keywords: [
      "mechanical",
      "pump",
      "motor",
      "compressor",
      "boiler",
      "fabrication",
      "machinery",
      "equipment installation",
      "turbine",
      "dewatering"
    ]
  },
  {
    label: "Healthcare",
    keywords: [
      "medical",
      "hospital",
      "health",
      "drug",
      "pharma",
      "diagnostic",
      "laboratory",
      "ambulance",
      "surgical",
      "clinic"
    ]
  },
  {
    label: "Consultancy",
    keywords: [
      "consultancy",
      "consulting",
      "project management consultancy",
      "pmc",
      "dpr",
      "feasibility study",
      "third party inspection",
      "design consultant",
      "advisory service"
    ]
  },
  {
    label: "Water & Sanitation",
    keywords: [
      "water supply",
      "sewage",
      "sewerage",
      "pipeline",
      "borewell",
      "drinking water",
      "sanitation",
      "wastewater",
      "stp",
      "water treatment"
    ]
  },
  {
    label: "Transport",
    keywords: [
      "vehicle",
      "transport",
      "bus",
      "logistics",
      "fleet",
      "car rental",
      "outsource vehicle",
      "driver services"
    ]
  },
  {
    label: "Security",
    keywords: [
      "security guard",
      "security services",
      "surveillance",
      "access control",
      "watch and ward"
    ]
  }
];

const DEFAULT_CATEGORY_BY_TAB = {
  goods: "Supply",
  works: "Civil",
  services: "General Services"
};

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\w\s&/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function inferTenderAiCategory(tender = {}) {
  const sourceTab = String(tender.sourceTab || "").toLowerCase();
  const corpus = normalizeText(
    [tender.tenderName, tender.entity, tender.location, tender.type].join(" ")
  );

  if (!corpus) {
    return DEFAULT_CATEGORY_BY_TAB[sourceTab] || "General Services";
  }

  let bestLabel = null;
  let bestScore = 0;

  for (const rule of CATEGORY_RULES) {
    let score = 0;
    for (const keyword of rule.keywords) {
      if (corpus.includes(keyword)) {
        score += keyword.length >= 12 ? 2 : 1;
      }
    }

    if (score > bestScore) {
      bestLabel = rule.label;
      bestScore = score;
    }
  }

  if (bestLabel) {
    return bestLabel;
  }

  return DEFAULT_CATEGORY_BY_TAB[sourceTab] || "General Services";
}
