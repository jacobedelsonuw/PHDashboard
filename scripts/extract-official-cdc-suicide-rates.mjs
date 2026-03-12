import fs from "node:fs";
import path from "node:path";

const projectRoot = "/Users/jacob/Downloads/Public_Health/mental-health-dashboard_2";
const htmlPath = path.join(projectRoot, "data/raw/official/cdc_suicide_rates_2023.html");
const stateDataPath = path.join(projectRoot, "client/src/data/stateData.ts");
const outputPath = path.join(projectRoot, "client/src/data/officialCdcStateSuicideRates.ts");

const html = fs.readFileSync(htmlPath, "utf8");
const stateDataSource = fs.readFileSync(stateDataPath, "utf8");
const stateMap = Object.fromEntries(
  [...stateDataSource.matchAll(/state: "([^"]+)", abbreviation: "([A-Z]{2})"/g)].map(([, state, abbreviation]) => [state, abbreviation])
);

const rows = {};
const rowRegex = /<td class="indent-3">([^<]+)<\/td>\s*<td class="text-center">([\d,]+)<\/td>\s*<td class="text-center">([\d.]+)<\/td>\s*<td class="text-center">([\d,]+)<\/td>\s*<td class="text-center">([\d.]+)<\/td>/g;

for (const match of html.matchAll(rowRegex)) {
  const state = match[1].trim();
  const abbreviation = stateMap[state];
  if (!abbreviation) {
    continue;
  }

  rows[abbreviation] = {
    state,
    sourceYear: 2023,
    suicide_deaths: Number(match[4].replace(/,/g, "")),
    suicide_rate: Number(match[5]),
  };
}

const abbreviations = Object.keys(rows).sort();
if (abbreviations.length !== 50) {
  throw new Error(`Expected 50 suicide-rate rows, found ${abbreviations.length}`);
}

const serialized = abbreviations
  .map((abbreviation) => `  ${abbreviation}: ${JSON.stringify(rows[abbreviation], null, 2).replace(/\n/g, "\n  ")},`)
  .join("\n");

const fileContents = `// Auto-generated from data/raw/official/cdc_suicide_rates_2023.html\n// Source: CDC NCHS Data Brief No. 541, final 2023 suicide rates by state\n\nexport interface OfficialCdcStateSuicideRate {\n  state: string;\n  sourceYear: number;\n  suicide_deaths: number;\n  suicide_rate: number;\n}\n\nexport const officialCdcStateSuicideRates: Record<string, OfficialCdcStateSuicideRate> = {\n${serialized}\n};\n`;

fs.writeFileSync(outputPath, fileContents);
console.log(`Wrote ${outputPath} with ${abbreviations.length} state entries.`);
