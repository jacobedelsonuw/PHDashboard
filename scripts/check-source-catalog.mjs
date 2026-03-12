import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const sources = [
  {
    slug: "samhsa-nsduh-state-releases",
    url: "https://www.samhsa.gov/data/data-we-collect/nsduh-national-survey-drug-use-and-health/state-releases/2023-2024",
    kind: "landing-page",
  },
  {
    slug: "samhsa-nsduh-state-prevalence",
    url: "https://www.samhsa.gov/data/report/2023-2024-nsduh-state-prevalence-estimates",
    kind: "landing-page",
  },
  {
    slug: "samhsa-nsduh-state-totals",
    url: "https://www.samhsa.gov/data/report/2023-2024-nsduh-state-estimated-totals",
    kind: "landing-page",
  },
  {
    slug: "hrsa-ahrf",
    url: "https://data.hrsa.gov/data/download?data=AHRF",
    kind: "landing-page",
  },
  {
    slug: "samhsa-n-sumhss-state-profiles",
    url: "https://www.samhsa.gov/data/report/2023-n-sumhss-state-profiles",
    kind: "landing-page",
  },
  {
    slug: "cdc-wonder-datasets",
    url: "https://wonder.cdc.gov/datasets.html",
    kind: "landing-page",
  },
];

const outDir = path.resolve("data", "raw", "source-checks");
await mkdir(outDir, { recursive: true });

const results = [];

for (const source of sources) {
  try {
    const response = await fetch(source.url, {
      redirect: "follow",
      headers: {
        "user-agent": "mental-health-dashboard-source-check/1.0",
      },
    });

    results.push({
      ...source,
      ok: response.ok,
      status: response.status,
      contentType: response.headers.get("content-type"),
      finalUrl: response.url,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    results.push({
      ...source,
      ok: false,
      status: null,
      contentType: null,
      finalUrl: null,
      checkedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

await writeFile(
  path.join(outDir, "source-check-results.json"),
  JSON.stringify(results, null, 2) + "\n",
  "utf8"
);

console.log(`Wrote ${results.length} source checks to ${path.join(outDir, "source-check-results.json")}`);
