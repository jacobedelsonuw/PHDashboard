import fs from "node:fs";
import path from "node:path";

const projectRoot = "/Users/jacob/Downloads/Public_Health/mental-health-dashboard_2";
const htmlPath = path.join(projectRoot, "data/raw/official/nsduh_state_specific_2023_2024.html");
const stateDataPath = path.join(projectRoot, "client/src/data/stateData.ts");
const outputPath = path.join(projectRoot, "client/src/data/officialNsduhStateMetrics.ts");

const columns = ["year", "12+", "12-17", "18-25", "26+", "18+"];

const measureConfigs = [
  { label: "Any Mental Illness", key: "ami", column: "18+" },
  { label: "Serious Mental Illness", key: "smi", column: "18+" },
  { label: "Major Depressive Episode", key: "mde_adult", column: "18+" },
  { label: "Major Depressive Episode", key: "mde_youth", column: "12-17" },
  { label: "Substance Use Disorder", key: "substance_use_disorder", column: "12+" },
  { label: "Alcohol Use Disorder", key: "alcohol_use_disorder", column: "12+", exclude: "People Aged 12 to 20" },
  { label: "Opioid Use Disorder", key: "opioid_use_disorder", column: "12+" },
  { label: "Received Mental Health Treatment", key: "received_mental_health_treatment", column: "18+" },
  { label: "Had Serious Thoughts of Suicide", key: "serious_thoughts_of_suicide", column: "18+" },
  { label: "Made Any Suicide Plans", key: "suicide_plans", column: "18+" },
  { label: "Attempted Suicide", key: "suicide_attempt", column: "18+" },
];

const entityMap = {
  "&amp;": "&",
  "&nbsp;": " ",
  "&ndash;": "-",
  "&mdash;": "-",
  "&rsquo;": "'",
  "&lsquo;": "'",
  "&ldquo;": '"',
  "&rdquo;": '"',
  "&lt;": "<",
  "&gt;": ">",
  "&#8211;": "-",
  "&#8212;": "-",
  "&#8217;": "'",
  "&#8220;": '"',
  "&#8221;": '"',
  "&#8242;": "'",
};

const decodeEntities = (value) => {
  let decoded = value;
  for (const [entity, replacement] of Object.entries(entityMap)) {
    decoded = decoded.split(entity).join(replacement);
  }
  decoded = decoded.replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
  decoded = decoded.replace(/&#x([\da-fA-F]+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
  return decoded;
};

const stripTags = (value) => decodeEntities(value.replace(/<[^>]+>/g, " "));
const collapseWhitespace = (value) => stripTags(value).replace(/\s+/g, " ").trim();

const parseNumber = (value) => {
  const normalized = collapseWhitespace(value).replace(/,/g, "");
  if (!normalized || normalized === "--") {
    return null;
  }
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : null;
};

const extractStateMap = (source) => {
  const matches = [...source.matchAll(/state: "([^"]+)", abbreviation: "([A-Z]{2})"/g)];
  return Object.fromEntries(matches.map(([, state, abbreviation]) => [state.toUpperCase(), abbreviation]));
};

const extractRows = (tbody) => {
  const rows = new Map();
  for (const match of tbody.matchAll(/<tr>([\s\S]*?)<\/tr>/g)) {
    const row = match[1];
    const headingMatch = row.match(/<th[^>]*scope="row"[^>]*>([\s\S]*?)<\/th>/);
    if (!headingMatch) {
      continue;
    }
    const measure = collapseWhitespace(headingMatch[1]);
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((cellMatch) => cellMatch[1]);
    if (cells.length !== columns.length) {
      continue;
    }
    rows.set(measure, {
      year: collapseWhitespace(cells[0]),
      values: Object.fromEntries(columns.slice(1).map((column, index) => [column, parseNumber(cells[index + 1])])),
    });
  }
  return rows;
};

const html = fs.readFileSync(htmlPath, "utf8");
const stateDataSource = fs.readFileSync(stateDataPath, "utf8");
const stateMap = extractStateMap(stateDataSource);
const officialMetrics = {};

for (const blockMatch of html.matchAll(/<div class="rti_herald"[^>]*>([\s\S]*?)<\/div>/g)) {
  const block = blockMatch[1];
  const stateMatch = block.match(/<p class="state">([\s\S]*?)<\/p>/);
  const captionMatch = block.match(/<caption>([\s\S]*?)<\/caption>/);
  const bodyMatch = block.match(/<tbody>([\s\S]*?)<\/tbody>/);

  if (!stateMatch || !captionMatch || !bodyMatch) {
    continue;
  }

  const stateName = collapseWhitespace(stateMatch[1]);
  const abbreviation = stateMap[stateName.toUpperCase()];
  if (!abbreviation) {
    continue;
  }

  const caption = collapseWhitespace(captionMatch[1]);
  if (!caption.includes("Substance Use Disorder, Substance Use Treatment, and Mental Health Measures")) {
    continue;
  }

  const tableType = caption.includes("Annual Average Numbers")
    ? "totals"
    : caption.includes("Annual Average Percentages")
      ? "percentages"
      : null;

  if (!tableType) {
    continue;
  }

  const rows = extractRows(bodyMatch[1]);
  const target = officialMetrics[abbreviation] ?? { state: stateName, sourcePeriod: "2023-2024" };

  for (const config of measureConfigs) {
    const row = [...rows.entries()].find(([measure]) => {
      if (!measure.startsWith(config.label)) {
        return false;
      }
      if (config.exclude && measure.includes(config.exclude)) {
        return false;
      }
      return true;
    });

    if (!row) {
      continue;
    }

    const [, entry] = row;
    const value = entry.values[config.column];
    if (value === null) {
      continue;
    }

    if (tableType === "percentages") {
      target[config.key] = value;
    } else {
      target[`${config.key}_total`] = Math.round(value * 1000);
    }
  }

  officialMetrics[abbreviation] = target;
}

const abbreviations = Object.keys(officialMetrics).sort();
if (abbreviations.length !== 50) {
  throw new Error(`Expected 50 state entries, found ${abbreviations.length}`);
}

const requiredMeasureKeys = [
  "ami",
  "smi",
  "mde_adult",
  "mde_youth",
  "substance_use_disorder",
  "alcohol_use_disorder",
  "opioid_use_disorder",
];

for (const abbreviation of abbreviations) {
  const entry = officialMetrics[abbreviation];
  for (const key of requiredMeasureKeys) {
    const config = measureConfigs.find((item) => item.key === key);
    if (!config) {
      throw new Error(`Missing config for required metric ${key}`);
    }
    if (typeof entry[config.key] !== "number") {
      throw new Error(`Missing percentage for ${config.key} in ${abbreviation}`);
    }
    if (typeof entry[`${config.key}_total`] !== "number") {
      throw new Error(`Missing total for ${config.key} in ${abbreviation}`);
    }
  }
}

const typeDef = `export interface OfficialNsduhStateMetric {\n  state: string;\n  sourcePeriod: string;\n  ami: number;\n  ami_total: number;\n  smi: number;\n  smi_total: number;\n  mde_adult: number;\n  mde_adult_total: number;\n  mde_youth: number;\n  mde_youth_total: number;\n  substance_use_disorder: number;\n  substance_use_disorder_total: number;\n  alcohol_use_disorder: number;\n  alcohol_use_disorder_total: number;\n  opioid_use_disorder: number;\n  opioid_use_disorder_total: number;\n  received_mental_health_treatment?: number;\n  received_mental_health_treatment_total?: number;\n  serious_thoughts_of_suicide?: number;\n  serious_thoughts_of_suicide_total?: number;\n  suicide_plans?: number;\n  suicide_plans_total?: number;\n  suicide_attempt?: number;\n  suicide_attempt_total?: number;\n}\n\n`;

const serialized = abbreviations
  .map((abbreviation) => `  ${abbreviation}: ${JSON.stringify(officialMetrics[abbreviation], null, 2).replace(/\n/g, "\n  ")},`)
  .join("\n");

const fileContents = `// Auto-generated from data/raw/official/nsduh_state_specific_2023_2024.html\n// Source: SAMHSA NSDUH 2023-2024 state-specific tables\n\n${typeDef}export const officialNsduhStateMetrics: Record<string, OfficialNsduhStateMetric> = {\n${serialized}\n};\n`;

fs.writeFileSync(outputPath, fileContents);
console.log(`Wrote ${outputPath} with ${abbreviations.length} state entries.`);
