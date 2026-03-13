import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  getNeedIndexMethodSummary,
  getSpatialNeedFundingPanelRows,
} from "../client/src/data/stateFinancingData";

const outputPath = resolve(process.cwd(), "data/raw/policy/spatial_need_funding_panel.csv");
const metadataPath = resolve(process.cwd(), "data/raw/policy/spatial_need_funding_metadata.json");

const rows = getSpatialNeedFundingPanelRows();
const needIndexMethod = getNeedIndexMethodSummary();

const escapeCsv = (value: unknown) => {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const headers = Object.keys(rows[0] ?? {});
const csv = [headers.join(",")]
  .concat(rows.map((row) => headers.map((header) => escapeCsv(row[header as keyof typeof row])).join(",")))
  .join("\n");

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${csv}\n`, "utf8");
writeFileSync(
  metadataPath,
  JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      row_count: rows.length,
      need_index_method: needIndexMethod,
      note: "Estimate SAR/SEM offline and write predictions into client/src/data/spatialNeedFundingResults.ts.",
    },
    null,
    2
  ),
  "utf8"
);

console.log(`Wrote ${rows.length} rows to ${outputPath}`);
console.log(`Wrote metadata to ${metadataPath}`);
