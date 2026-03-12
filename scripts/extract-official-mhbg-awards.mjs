import fs from "node:fs";
import path from "node:path";

const projectRoot = "/Users/jacob/Downloads/Public_Health/mental-health-dashboard_2";
const stateDataPath = path.join(projectRoot, "client/src/data/stateData.ts");
const outputPath = path.join(projectRoot, "client/src/data/officialMhbgAwards.ts");

const pageConfigs = [
  {
    file: "mhbg_fy21_covid_awards.html",
    year: 2021,
    field: "covid_supplemental_award_millions",
  },
  {
    file: "mhbg_fy21_arp_awards.html",
    year: 2021,
    field: "arp_supplemental_award_millions",
  },
  {
    file: "mhbg_fy21_arp_covid_allotments.html",
    year: 2021,
    field: "arp_testing_mitigation_award_millions",
  },
  {
    file: "mhbg_fy22_bsca_allotments.html",
    year: 2022,
    field: "bsca_award_millions",
  },
  {
    file: "mhbg_fy23_bsca_allotments.html",
    year: 2023,
    field: "bsca_award_millions",
  },
  {
    file: "mhbg_fy23_final_allotments.html",
    year: 2023,
    field: "formula_allotment_millions",
  },
];

const stateSource = fs.readFileSync(stateDataPath, "utf8");
const stateMap = Object.fromEntries(
  [...stateSource.matchAll(/state: "([^"]+)", abbreviation: "([A-Z]{2})"/g)].map(([, state, abbreviation]) => [
    state.toLowerCase(),
    abbreviation,
  ])
);
stateMap["district of columbia"] = "DC";

const normalizeName = (value) =>
  value
    .toLowerCase()
    .replace(/&nbsp;/g, " ")
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

const parseMillions = (value) => {
  const amount = Number(value.replace(/[$,]/g, ""));
  if (!Number.isFinite(amount)) return null;
  return Math.round((amount / 1_000_000) * 100) / 100;
};

const records = {};

for (const config of pageConfigs) {
  const htmlPath = path.join(projectRoot, "data/raw/official/financing", config.file);
  const html = fs.readFileSync(htmlPath, "utf8");
  const tableMatch = html.match(/<table[^>]*>[\s\S]*?<tbody>([\s\S]*?)<\/tbody>[\s\S]*?<\/table>/i);
  if (!tableMatch) {
    throw new Error(`Could not find award table in ${config.file}`);
  }

  for (const rowMatch of tableMatch[1].matchAll(/<tr>([\s\S]*?)<\/tr>/g)) {
    const cells = [...rowMatch[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((match) =>
      match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    );
    if (cells.length < 2) continue;
    const abbreviation = stateMap[normalizeName(cells[0])];
    if (!abbreviation || abbreviation === "DC") continue;
    const value = parseMillions(cells[1]);
    if (value === null) continue;

    const stateEntry = (records[abbreviation] ??= {});
    const yearEntry = (stateEntry[config.year] ??= {});
    yearEntry[config.field] = value;
  }
}

const typeDef = `export interface OfficialMhbgAwardComponents {\n  formula_allotment_millions?: number;\n  bsca_award_millions?: number;\n  covid_supplemental_award_millions?: number;\n  arp_supplemental_award_millions?: number;\n  arp_testing_mitigation_award_millions?: number;\n}\n\nexport type OfficialMhbgAwardsByYear = Partial<Record<2021 | 2022 | 2023, OfficialMhbgAwardComponents>>;\n\n`;

const serialized = Object.keys(records)
  .sort()
  .map((abbreviation) => `  ${abbreviation}: ${JSON.stringify(records[abbreviation], null, 2).replace(/\n/g, "\n  ")},`)
  .join("\n");

const output = `// Auto-generated from official SAMHSA MHBG award/allotment pages\n// Sources: FY21 COVID awards, FY21 ARP awards, FY21 ARP COVID mitigation allotments, FY22 BSCA allotments, FY23 BSCA allotments, FY23 final allotments\n\n${typeDef}export const officialMhbgAwardsByStateYear: Record<string, OfficialMhbgAwardsByYear> = {\n${serialized}\n};\n`;

fs.writeFileSync(outputPath, output);
console.log(`Wrote ${outputPath} with ${Object.keys(records).length} state entries.`);
