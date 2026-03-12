import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import readline from "node:readline";

const projectRoot = "/Users/jacob/Downloads/Public_Health/mental-health-dashboard_2";
const stateDataPath = path.join(projectRoot, "client/src/data/stateData.ts");
const outputPath = path.join(projectRoot, "client/src/data/officialStateResourceCapacity.ts");
const hrsaStateZip = path.join(projectRoot, "data/raw/official/ahrf_state_national_2024_2025_csv.zip");
const hrsaCountyZip = path.join(projectRoot, "data/raw/official/ahrf_county_2024_2025_csv.zip");
const samhsaZip = path.join(projectRoot, "data/raw/official/n_sumhss_2024_delimited.zip");

const parseCsvLine = (line) => {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
};

const toNumber = (value) => {
  const normalized = value.trim();
  if (!normalized || normalized === "M" || normalized === "NA" || normalized === "na") {
    return 0;
  }
  const numeric = Number(normalized.replace(/,/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
};

const readZipCsv = async (zipPath, innerPath, onRow) => {
  const unzip = spawn("unzip", ["-p", zipPath, innerPath], { stdio: ["ignore", "pipe", "inherit"] });
  const rl = readline.createInterface({ input: unzip.stdout, crlfDelay: Infinity });

  let headers = null;
  for await (const line of rl) {
    if (!headers) {
      headers = parseCsvLine(line);
      continue;
    }
    if (!line.trim()) {
      continue;
    }
    await onRow(parseCsvLine(line), headers);
  }

  await new Promise((resolve, reject) => {
    unzip.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`unzip exited with code ${code} for ${zipPath}`));
      }
    });
  });
};

const stateDataSource = fs.readFileSync(stateDataPath, "utf8");
const states = [...stateDataSource.matchAll(/state: "([^"]+)", abbreviation: "([A-Z]{2})"/g)].map(([, state, abbreviation]) => ({ state, abbreviation }));
const stateMap = Object.fromEntries(states.map(({ abbreviation, state }) => [abbreviation, state]));

const resources = Object.fromEntries(
  states.map(({ state, abbreviation }) => [
    abbreviation,
    {
      state,
      sourcePeriod: "HRSA AHRF 2023-2024 workforce plus SAMHSA N-SUMHSS 2024 facilities",
      psychiatrists: 0,
      therapists: 0,
      mental_health_providers: 0,
      mental_health_facilities: 0,
      crisis_centers: 0,
    },
  ])
);

await readZipCsv(hrsaStateZip, "NCHWA-2024-2025+AHRF+SN+CSV/ahrfsn2025.csv", async (row, headers) => {
  const index = Object.fromEntries(headers.map((header, idx) => [header, idx]));
  const abbreviation = row[index.st_abbrev]?.trim();
  if (!abbreviation || !resources[abbreviation]) {
    return;
  }

  const clinicalPsychologists = toNumber(row[index.clinpsych_emplymt_24]) || toNumber(row[index.psychol_23]);
  const mentalHealthCounselors = toNumber(row[index.mentl_hlth_conslrs_emplymt_24]);
  const mentalHealthSocialWorkers = toNumber(row[index.mentl_hlth_socwk_emplymt_24]) || toNumber(row[index.socwk_23]);

  resources[abbreviation].therapists = clinicalPsychologists + mentalHealthCounselors + mentalHealthSocialWorkers;
});

await readZipCsv(hrsaCountyZip, "NCHWA-2024-2025+AHRF+COUNTY+CSV/AHRF2025hp.csv", async (row, headers) => {
  const index = Object.fromEntries(headers.map((header, idx) => [header, idx]));
  const location = row[index.cnty_name_st_abbrev]?.trim();
  const abbreviation = location?.split(",").pop()?.trim();
  if (!abbreviation || !resources[abbreviation]) {
    return;
  }

  resources[abbreviation].psychiatrists += toNumber(row[index.tot_md_do_psych_23]);
});

await readZipCsv(samhsaZip, "NSUMHSS_2024_PUF_CSV.csv", async (row, headers) => {
  const index = Object.fromEntries(headers.map((header, idx) => [header, idx]));
  const abbreviation = row[index.LOCATIONSTATE]?.trim();
  if (!abbreviation || !resources[abbreviation]) {
    return;
  }

  const mentalHealthService = row[index.MENTALHTHSERV]?.trim();
  if (mentalHealthService !== "1") {
    return;
  }

  resources[abbreviation].mental_health_facilities += 1;

  const crisisFlags = ["MHEMGCY", "MHSUICIDE", "CRISISTEAM2", "PSYCHON", "PSYCHOFF"];
  const crisisCapable = crisisFlags.some((header) => row[index[header]]?.trim() === "1");
  if (crisisCapable) {
    resources[abbreviation].crisis_centers += 1;
  }
});

for (const abbreviation of Object.keys(resources)) {
  resources[abbreviation].mental_health_providers = resources[abbreviation].psychiatrists + resources[abbreviation].therapists;
  if (!stateMap[abbreviation]) {
    throw new Error(`Unexpected resource abbreviation ${abbreviation}`);
  }
}

const serialized = Object.keys(resources)
  .sort()
  .map((abbreviation) => `  ${abbreviation}: ${JSON.stringify(resources[abbreviation], null, 2).replace(/\n/g, "\n  ")},`)
  .join("\n");

const fileContents = `// Auto-generated from HRSA AHRF 2024-2025 workforce files and SAMHSA N-SUMHSS 2024 facility data\n\nexport interface OfficialStateResourceCapacity {\n  state: string;\n  sourcePeriod: string;\n  psychiatrists: number;\n  therapists: number;\n  mental_health_providers: number;\n  mental_health_facilities: number;\n  crisis_centers: number;\n}\n\nexport const officialStateResourceCapacity: Record<string, OfficialStateResourceCapacity> = {\n${serialized}\n};\n`;

fs.writeFileSync(outputPath, fileContents);
console.log(`Wrote ${outputPath} with ${Object.keys(resources).length} state entries.`);
