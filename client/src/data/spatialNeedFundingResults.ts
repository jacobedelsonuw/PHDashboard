export interface ExternalSpatialNeedFundingResult {
  abbreviation: string;
  year: number;
  predicted_public_mh_spending_per_capita: number;
  funding_gap_per_capita?: number;
  funding_gap_score?: number;
}

export interface ExternalSpatialNeedFundingDiagnostic {
  year: number;
  model_label: string;
  model_type: "spatial_lag" | "spatial_error" | "custom_spatial";
  note?: string;
}

// Populate these arrays with outputs from an external SAR/SEM workflow.
// `pnpm analysis:fit:spatial` will overwrite this file from the exported state-year panel.
// The dashboard will prefer these predictions over the in-browser OLS baseline when present.
export const externalSpatialNeedFundingResults: ExternalSpatialNeedFundingResult[] = [];

export const externalSpatialNeedFundingDiagnostics: ExternalSpatialNeedFundingDiagnostic[] = [];
