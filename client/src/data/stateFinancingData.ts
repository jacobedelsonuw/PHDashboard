import { getStateResources, stateData } from "./stateData";
import { officialCmsMedicaidExpendituresByStateYear } from "./officialCmsMedicaidExpenditures";
import { officialMhbgAwardsByStateYear } from "./officialMhbgAwards";
import { officialUrsFinancingByStateYear } from "./officialUrsFinancing";
import { getMedicaidExpansionRecord } from "./medicaidExpansionData";
import type { MedicaidExpansionLabel, MedicaidExpansionStatus } from "./medicaidExpansionData";
import {
  externalSpatialNeedFundingDiagnostics,
  externalSpatialNeedFundingResults,
} from "./spatialNeedFundingResults";

export const FINANCING_YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024] as const;
export type FinancingYear = (typeof FINANCING_YEARS)[number];

export const FINANCING_METRICS = [
  "mhbg_per_capita",
  "federal_mental_health_funding_per_capita",
  "public_mh_spending_per_capita",
  "medicaid_expenditure_per_enrollee",
  "medicaid_share_of_public_mh",
  "behavioral_health_policy_score",
] as const;

export type FinancingMetric = (typeof FINANCING_METRICS)[number];
export type TypologyLabel =
  | "High need / low funding"
  | "High need / high funding"
  | "Low need / low funding"
  | "Low need / high funding";

export interface StateFinancingRecord {
  state: string;
  abbreviation: string;
  year: FinancingYear;
  mhbg_allotment_millions: number;
  federal_mental_health_funding_millions: number;
  official_mhbg_formula_millions?: number;
  official_mhbg_supplemental_millions?: number;
  official_urs_total_smha_expenditures_millions?: number;
  official_urs_funding_total_millions?: number;
  official_cms_total_net_expenditures_millions?: number;
  official_cms_federal_share_millions?: number;
  official_cms_state_share_millions?: number;
  financing_data_status: "modeled" | "partially_official";
  public_mh_spending_millions: number;
  medicaid_total_expenditures_millions: number;
  medicaid_enrollment: number;
  medicaid_expenditure_per_enrollee: number;
  medicaid_share_of_public_mh: number;
  state_share_of_public_mh: number;
  other_federal_share_of_public_mh: number;
  local_other_share_of_public_mh: number;
  mhbg_per_capita: number;
  federal_mental_health_funding_per_capita: number;
  public_mh_spending_per_capita: number;
  behavioral_health_policy_score: number;
  raw_need_score: number;
  need_index: number;
  provider_density_per_100k: number;
  predicted_public_mh_spending_per_capita: number;
  funding_gap_per_capita: number;
  funding_gap_percent: number;
  funding_gap_score: number;
  mismatch_index: number;
  medicaid_expansion_status: MedicaidExpansionStatus;
  medicaid_expansion_label: MedicaidExpansionLabel;
  first_full_expansion_year: FinancingYear | null;
  expansion_event_time: number | null;
  average_gap_per_capita: number;
  gap_trend_per_year: number;
  gap_std_per_capita: number;
  negative_gap_years_share: number;
  persistent_underfunding: boolean;
  typology_cluster_id: number;
  typology_cluster_label: TypologyLabel;
  typology_cluster_description: string;
  typology_cluster_color: string;
}

export type FinancingProvenanceLevel = "official_urs" | "official_cms_mhbg" | "mixed_official" | "modeled";

export interface FinancingProvenanceSummary {
  level: FinancingProvenanceLevel;
  label: string;
  badges: string[];
  note: string;
}

export interface NeedFundingRegressionSummary {
  year: FinancingYear;
  intercept: number;
  slope: number;
  rSquared: number;
  tStatistic: number;
  residualStd: number;
  sampleSize: number;
  significant: boolean;
  modelType: "linear_ols" | "external_spatial";
  modelLabel: string;
  sourceNote: string;
}

export interface NeedIndexMethodSummary {
  method: "pca";
  indicators: Array<{
    key: "ami" | "smi" | "mde_adult" | "mde_youth" | "suicide_rate" | "substance_use_disorder";
    label: string;
    loading: number;
  }>;
  varianceExplained: number;
  sourceNote: string;
}

export interface PersistentUnderinvestmentSummary {
  state: string;
  abbreviation: string;
  average_gap_per_capita: number;
  gap_trend_per_year: number;
  gap_std_per_capita: number;
  negative_gap_years_share: number;
  persistent_underfunding: boolean;
  latest_gap_per_capita: number;
  latest_need_index: number;
  latest_public_mh_spending_per_capita: number;
  latest_predicted_public_mh_spending_per_capita: number;
  typology_cluster_label: TypologyLabel;
}

export interface TypologyClusterSummary {
  year: FinancingYear;
  clusterId: number;
  label: TypologyLabel;
  description: string;
  color: string;
  count: number;
  states: string[];
}

export interface ExpansionMismatchTrendPoint {
  year: FinancingYear;
  expansion_mean_mismatch_index: number;
  non_expansion_mean_mismatch_index: number;
  expansion_mean_gap_per_capita: number;
  non_expansion_mean_gap_per_capita: number;
  expansion_count: number;
  non_expansion_count: number;
}

export interface ExpansionMismatchDistributionPoint {
  state: string;
  abbreviation: string;
  year: FinancingYear;
  medicaid_expansion_status: MedicaidExpansionStatus;
  medicaid_expansion_label: MedicaidExpansionLabel;
  mismatch_index: number;
  funding_gap_per_capita: number;
  x_position: number;
}

export interface ExpansionMismatchYearSummary {
  year: FinancingYear;
  expansion_mean_mismatch_index: number;
  non_expansion_mean_mismatch_index: number;
  mean_difference: number;
  pValue: number;
  expansion_count: number;
  non_expansion_count: number;
}

export interface ExpansionEventTrendPoint {
  event_time: number;
  mean_mismatch_index: number;
  mean_gap_per_capita: number;
  state_count: number;
}

export interface ExpansionStateTrendPoint {
  state: string;
  abbreviation: string;
  year: FinancingYear;
  mismatch_index: number;
  funding_gap_per_capita: number;
  medicaid_expansion_status: MedicaidExpansionStatus;
  medicaid_expansion_label: MedicaidExpansionLabel;
  expansion_event_time: number | null;
  first_full_expansion_year: FinancingYear | null;
}

export interface MedicaidExpansionPolicyRegressionSummary {
  coefficient: number;
  standardError: number;
  tStatistic: number;
  withinRSquared: number;
  sampleSize: number;
  stateCount: number;
  yearCount: number;
  significant: boolean;
  controlsIncluded: string[];
  controlsOmitted: string[];
  interpretation: string;
  caution: string;
}

export interface LateExpansionItsCoefficient {
  term: "time" | "post" | "time_after";
  label: string;
  estimate: number;
  standardError: number;
  tStatistic: number;
  pValue: number;
}

export interface LateExpansionItsStateSummary {
  state: string;
  abbreviation: string;
  expansionYear: FinancingYear;
  preYears: number;
  postYears: number;
  preMeanMismatchIndex: number;
  postMeanMismatchIndex: number;
  meanDifference: number;
  levelChange: number;
  levelPValue: number;
  trendChange: number;
  trendPValue: number;
  latestMismatchIndex: number;
}

export interface LateExpansionItsEventPoint {
  eventTime: number;
  meanMismatchIndex: number;
  stateCount: number;
}

export interface LateExpansionItsSummary {
  includedStates: Array<{
    state: string;
    abbreviation: string;
    expansionYear: FinancingYear;
  }>;
  outcomeLabel: string;
  sampleSize: number;
  adjustedRSquared: number;
  coefficients: LateExpansionItsCoefficient[];
  interpretation: string;
  caution: string;
  note: string;
}

export interface NeedFundingScatterPoint {
  state: string;
  abbreviation: string;
  year: FinancingYear;
  need_index: number;
  public_mh_spending_per_capita: number;
  predicted_public_mh_spending_per_capita: number;
  funding_gap_per_capita: number;
  funding_gap_score: number;
}

export interface NeedFundingScatterSummary {
  points: NeedFundingScatterPoint[];
  line: Array<{ need_index: number; predicted_public_mh_spending_per_capita: number }>;
  outliers: NeedFundingScatterPoint[];
}

export const financingMetricLabels: Record<FinancingMetric, string> = {
  mhbg_per_capita: "MHBG Funding per Capita ($)",
  federal_mental_health_funding_per_capita: "Federal Mental Health Funding per Capita ($)",
  public_mh_spending_per_capita: "Public Mental Health Spending per Capita ($)",
  medicaid_expenditure_per_enrollee: "Medicaid Spending per Enrollee ($)",
  medicaid_share_of_public_mh: "Medicaid Share of Public MH Financing (%)",
  behavioral_health_policy_score: "Behavioral Health Policy Context Score",
};

const financingSourceGapNotes = new Map<string, string>([
  [
    "2021-MI",
    "SAMHSA's official 2021 Michigan URS summary page lists the finance fields as '-' rather than numeric values, so the dashboard falls back to the harmonized model for that state-year.",
  ],
  [
    "2021-MN",
    "SAMHSA's official 2021 Minnesota URS summary page lists the finance fields as '-' rather than numeric values, so the dashboard falls back to the harmonized model for that state-year.",
  ],
  [
    "2021-NY",
    "SAMHSA's official 2021 New York URS summary page lists the finance fields as '-' rather than numeric values, so the dashboard falls back to the harmonized model for that state-year.",
  ],
]);

export const getFinancingSourceGapNote = (abbreviation: string, year: FinancingYear) =>
  financingSourceGapNotes.get(`${year}-${abbreviation}`);

const TYPOLOGY_METADATA: Record<
  TypologyLabel,
  {
    color: string;
    description: string;
  }
> = {
  "High need / low funding": {
    color: "#dc2626",
    description: "High mental health burden paired with below-peer public mental health financing.",
  },
  "High need / high funding": {
    color: "#d97706",
    description: "High burden states that are funding their systems above the model-predicted peer baseline.",
  },
  "Low need / low funding": {
    color: "#475569",
    description: "Lower burden states with leaner public mental health financing systems.",
  },
  "Low need / high funding": {
    color: "#0f766e",
    description: "Lower burden states that still sustain comparatively strong public financing levels.",
  },
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round = (value: number, digits = 1) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
const standardDeviation = (values: number[]) => {
  if (values.length <= 1) return 0;
  const avg = mean(values);
  return Math.sqrt(values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length);
};
const normalCdf = (value: number) => {
  const sign = value < 0 ? -1 : 1;
  const x = Math.abs(value) / Math.sqrt(2);
  const t = 1 / (1 + 0.3275911 * x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const erf =
    1 -
    (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x));
  return 0.5 * (1 + sign * erf);
};

const invertMatrix = (matrix: number[][]) => {
  const size = matrix.length;
  const augmented = matrix.map((row, rowIndex) => [
    ...row.map((value) => value),
    ...Array.from({ length: size }, (_, columnIndex) => (rowIndex === columnIndex ? 1 : 0)),
  ]);

  for (let pivotIndex = 0; pivotIndex < size; pivotIndex += 1) {
    let pivotRow = pivotIndex;
    for (let rowIndex = pivotIndex + 1; rowIndex < size; rowIndex += 1) {
      if (Math.abs(augmented[rowIndex][pivotIndex]) > Math.abs(augmented[pivotRow][pivotIndex])) {
        pivotRow = rowIndex;
      }
    }

    const pivotValue = augmented[pivotRow][pivotIndex];
    if (Math.abs(pivotValue) < 1e-10) return null;

    if (pivotRow !== pivotIndex) {
      [augmented[pivotIndex], augmented[pivotRow]] = [augmented[pivotRow], augmented[pivotIndex]];
    }

    for (let columnIndex = 0; columnIndex < size * 2; columnIndex += 1) {
      augmented[pivotIndex][columnIndex] /= pivotValue;
    }

    for (let rowIndex = 0; rowIndex < size; rowIndex += 1) {
      if (rowIndex === pivotIndex) continue;
      const factor = augmented[rowIndex][pivotIndex];
      if (factor === 0) continue;
      for (let columnIndex = 0; columnIndex < size * 2; columnIndex += 1) {
        augmented[rowIndex][columnIndex] -= factor * augmented[pivotIndex][columnIndex];
      }
    }
  }

  return augmented.map((row) => row.slice(size));
};

const fitLinearModel = (
  rows: Array<{ y: number; predictors: number[] }>,
  termNames: string[]
) => {
  if (!rows.length) return null;

  const xMatrix = rows.map((row) => [1, ...row.predictors]);
  const yVector = rows.map((row) => row.y);
  const columnCount = xMatrix[0].length;
  const xtx = Array.from({ length: columnCount }, () => Array.from({ length: columnCount }, () => 0));
  const xty = Array.from({ length: columnCount }, () => 0);

  xMatrix.forEach((row, rowIndex) => {
    for (let leftIndex = 0; leftIndex < columnCount; leftIndex += 1) {
      xty[leftIndex] += row[leftIndex] * yVector[rowIndex];
      for (let rightIndex = 0; rightIndex < columnCount; rightIndex += 1) {
        xtx[leftIndex][rightIndex] += row[leftIndex] * row[rightIndex];
      }
    }
  });

  const xtxInverse = invertMatrix(xtx);
  if (!xtxInverse) return null;

  const coefficients = xtxInverse.map((inverseRow) =>
    inverseRow.reduce((sum, value, index) => sum + value * xty[index], 0)
  );
  const fittedValues = xMatrix.map((row) => row.reduce((sum, value, index) => sum + value * coefficients[index], 0));
  const residuals = yVector.map((value, index) => value - fittedValues[index]);
  const rss = residuals.reduce((sum, value) => sum + value ** 2, 0);
  const yMean = mean(yVector);
  const tss = yVector.reduce((sum, value) => sum + (value - yMean) ** 2, 0);
  const degreesOfFreedom = Math.max(1, rows.length - columnCount);
  const sigmaSquared = rss / degreesOfFreedom;
  const standardErrors = xtxInverse.map((row, index) => Math.sqrt(Math.max(row[index] * sigmaSquared, 0)));
  const coefficientRows = ["intercept", ...termNames].map((term, index) => {
    const estimate = coefficients[index];
    const standardError = standardErrors[index];
    const tStatistic = standardError === 0 ? 0 : estimate / standardError;
    const pValue = 2 * (1 - normalCdf(Math.abs(tStatistic)));

    return {
      term,
      estimate,
      standardError,
      tStatistic,
      pValue,
    };
  });

  return {
    coefficients: coefficientRows,
    adjustedRSquared:
      rows.length <= columnCount + 1 || tss === 0
        ? 1
        : 1 - (rss / (rows.length - columnCount)) / (tss / (rows.length - 1)),
  };
};

const computeTrendSlope = (pairs: Array<{ x: number; y: number }>) => {
  if (pairs.length <= 1) return 0;
  const meanX = mean(pairs.map((pair) => pair.x));
  const meanY = mean(pairs.map((pair) => pair.y));
  const numerator = pairs.reduce((sum, pair) => sum + (pair.x - meanX) * (pair.y - meanY), 0);
  const denominator = pairs.reduce((sum, pair) => sum + (pair.x - meanX) ** 2, 0);
  return denominator === 0 ? 0 : numerator / denominator;
};

const euclideanDistance = (left: number[], right: number[]) =>
  Math.sqrt(left.reduce((sum, value, index) => sum + (value - right[index]) ** 2, 0));

const dotProduct = (left: number[], right: number[]) => left.reduce((sum, value, index) => sum + value * right[index], 0);
const normalizeVector = (vector: number[]) => {
  const magnitude = Math.sqrt(dotProduct(vector, vector));
  return magnitude === 0 ? vector.map(() => 0) : vector.map((value) => value / magnitude);
};
const multiplyMatrixVector = (matrix: number[][], vector: number[]) =>
  matrix.map((row) => dotProduct(row, vector));
const powerIteration = (matrix: number[][], iterations = 40) => {
  let vector = normalizeVector(Array.from({ length: matrix.length }, () => 1));

  for (let index = 0; index < iterations; index += 1) {
    const nextVector = normalizeVector(multiplyMatrixVector(matrix, vector));
    const delta = nextVector.reduce((sum, value, valueIndex) => sum + Math.abs(value - vector[valueIndex]), 0);
    vector = nextVector;
    if (delta < 1e-8) break;
  }

  return vector;
};

const NEED_INDICATORS = [
  { key: "ami", label: "Any mental illness" },
  { key: "smi", label: "Serious mental illness" },
  { key: "mde_adult", label: "Adult major depressive episode" },
  { key: "mde_youth", label: "Youth major depressive episode" },
  { key: "suicide_rate", label: "Suicide mortality" },
  { key: "substance_use_disorder", label: "Substance use disorder" },
] as const;

type NeedIndicatorKey = (typeof NEED_INDICATORS)[number]["key"];

const derivePcaNeedIndex = () => {
  const standardizedColumns = NEED_INDICATORS.map(({ key }) => {
    const values = stateData.map((state) => state[key]);
    const columnMean = mean(values);
    const columnStd = standardDeviation(values) || 1;
    return values.map((value) => (value - columnMean) / columnStd);
  });

  const rowVectors = stateData.map((_, rowIndex) => standardizedColumns.map((column) => column[rowIndex]));
  const featureCount = NEED_INDICATORS.length;
  const correlationMatrix = Array.from({ length: featureCount }, (_, rowIndex) =>
    Array.from({ length: featureCount }, (_, columnIndex) => {
      const rowColumn = standardizedColumns[rowIndex];
      const columnColumn = standardizedColumns[columnIndex];
      return rowColumn.reduce((sum, value, index) => sum + value * columnColumn[index], 0) / rowColumn.length;
    })
  );

  let eigenvector = powerIteration(correlationMatrix);
  let scores = rowVectors.map((row) => dotProduct(row, eigenvector));
  const burdenDirection = mean(
    scores.map((score, index) => score * rowVectors[index].reduce((sum, value) => sum + value, 0))
  );

  if (burdenDirection < 0) {
    eigenvector = eigenvector.map((value) => -value);
    scores = scores.map((value) => -value);
  }

  const eigenvalue = dotProduct(eigenvector, multiplyMatrixVector(correlationMatrix, eigenvector));
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const loadingSummaries = NEED_INDICATORS.map((indicator, index) => ({
    key: indicator.key,
    label: indicator.label,
    loading: round(eigenvector[index], 3),
  }));

  return {
    scoresByState: new Map(
      stateData.map((state, index) => [
        state.abbreviation,
        {
          rawNeed: scores[index],
          needIndex: maxScore === minScore ? 50 : round(((scores[index] - minScore) / (maxScore - minScore)) * 100, 1),
          modeledScalar: maxScore === minScore ? 1 : 0.75 + ((scores[index] - minScore) / (maxScore - minScore)) * 0.7,
        },
      ])
    ),
    methodSummary: {
      method: "pca" as const,
      indicators: loadingSummaries,
      varianceExplained: round(eigenvalue / featureCount, 3),
      sourceNote:
        "Need index is the first principal component of AMI, SMI, adult MDE, youth MDE, suicide mortality, and substance use disorder. Higher values indicate higher latent burden.",
    },
  };
};

const pcaNeedIndex = derivePcaNeedIndex();

const modeledNeedIndexByState = new Map(
  stateData.map((state) => [state.abbreviation, pcaNeedIndex.scoresByState.get(state.abbreviation)?.modeledScalar ?? 1])
);
const needIndexScoreByState = new Map(
  stateData.map((state) => [state.abbreviation, pcaNeedIndex.scoresByState.get(state.abbreviation)?.needIndex ?? 50])
);

const providerDensityByState = new Map(
  stateData.map((state) => {
    const resources = getStateResources(state.abbreviation);
    return [state.abbreviation, resources ? round((resources.mental_health_providers / state.population) * 100000, 1) : 75] as const;
  })
);

const baseStateFinancingData = FINANCING_YEARS.flatMap((year) => {
  const yearOffset = year - FINANCING_YEARS[0];
  const federalGrowth = 1 + yearOffset * 0.037;
  const spendingGrowth = 1 + yearOffset * 0.051;

  return stateData.map((state) => {
    const resources = getStateResources(state.abbreviation);
    const modeledNeedIndex = modeledNeedIndexByState.get(state.abbreviation) ?? 1;
    const needIndexScore = needIndexScoreByState.get(state.abbreviation) ?? 50;
    const providerDensity = providerDensityByState.get(state.abbreviation) ?? 75;
    const psychiatristDensity = resources ? (resources.psychiatrists / state.population) * 100000 : 12;
    const treatmentIndex = clamp((state.treatment_access - 30) / 20, 0.2, 1.25);
    const policyScore = round(
      clamp(38 + providerDensity * 0.16 + psychiatristDensity * 0.45 + treatmentIndex * 14 + yearOffset * 0.9, 35, 96),
      1
    );
    const populationMillions = state.population / 1_000_000;

    const mhbgAllotmentMillions = round(
      (1.35 + populationMillions * 0.68 + modeledNeedIndex * 2.2 + treatmentIndex * 0.6) * federalGrowth,
      2
    );
    const modeledFederalMentalHealthFundingMillions = round(
      mhbgAllotmentMillions * (1.85 + modeledNeedIndex * 0.18 + treatmentIndex * 0.08),
      2
    );
    const officialMhbg = officialMhbgAwardsByStateYear[state.abbreviation]?.[year as 2021 | 2022 | 2023];
    const officialUrs = officialUrsFinancingByStateYear[state.abbreviation]?.[year as 2021 | 2022 | 2023 | 2024];
    const officialCms = officialCmsMedicaidExpendituresByStateYear[state.abbreviation]?.[year];
    const officialMhbgFormulaMillions = officialMhbg?.formula_allotment_millions;
    const officialMhbgSupplementalMillions = round(
      (officialMhbg?.bsca_award_millions ?? 0) +
        (officialMhbg?.covid_supplemental_award_millions ?? 0) +
        (officialMhbg?.arp_supplemental_award_millions ?? 0) +
        (officialMhbg?.arp_testing_mitigation_award_millions ?? 0),
      2
    );
    const federalMentalHealthFundingMillions =
      officialMhbg && (officialMhbgFormulaMillions || officialMhbgSupplementalMillions)
        ? round((officialMhbgFormulaMillions ?? 0) + officialMhbgSupplementalMillions, 2)
        : modeledFederalMentalHealthFundingMillions;
    const modeledPublicMhSpendingMillions = round(
      populationMillions * (155 + modeledNeedIndex * 78 + policyScore * 1.15) * spendingGrowth,
      2
    );
    const publicMhSpendingMillions = officialUrs?.total_smha_expenditures_millions ?? modeledPublicMhSpendingMillions;
    const officialFundingTotalMillions = officialUrs?.funding_total_millions ?? 0;

    const modeledMedicaidShare = round(
      clamp(29 + modeledNeedIndex * 11 + treatmentIndex * 8 + yearOffset * 1.25, 28, 68),
      1
    );
    const modeledStateShare = round(clamp(30 + (1.2 - modeledNeedIndex) * 8 + treatmentIndex * 6 - yearOffset * 0.35, 16, 42), 1);
    const modeledOtherFederalShare = round(clamp(12 + (federalMentalHealthFundingMillions / publicMhSpendingMillions) * 18, 10, 28), 1);
    const modeledLocalOtherShare = round(100 - modeledMedicaidShare - modeledStateShare - modeledOtherFederalShare, 1);
    const officialOtherFederalMillions =
      (officialUrs?.mhbg_millions ?? 0) +
      (officialUrs?.covid_relief_mhbg_millions ?? 0) +
      (officialUrs?.arp_mhbg_millions ?? 0) +
      (officialUrs?.bsca_mhbg_millions ?? 0) +
      (officialUrs?.other_federal_millions ?? 0);
    const officialLocalOtherMillions = (officialUrs?.local_funds_millions ?? 0) + (officialUrs?.other_millions ?? 0);
    const medicaidShare =
      officialUrs && officialFundingTotalMillions > 0
        ? round((((officialUrs.medicaid_millions ?? 0) / officialFundingTotalMillions) * 100), 1)
        : modeledMedicaidShare;
    const stateShare =
      officialUrs && officialFundingTotalMillions > 0
        ? round((((officialUrs.state_funds_millions ?? 0) / officialFundingTotalMillions) * 100), 1)
        : modeledStateShare;
    const otherFederalShare =
      officialUrs && officialFundingTotalMillions > 0
        ? round((officialOtherFederalMillions / officialFundingTotalMillions) * 100, 1)
        : modeledOtherFederalShare;
    const localOtherShare =
      officialUrs && officialFundingTotalMillions > 0
        ? round((officialLocalOtherMillions / officialFundingTotalMillions) * 100, 1)
        : modeledLocalOtherShare;

    const medicaidEnrollmentRate = clamp(0.12 + modeledNeedIndex * 0.055 + yearOffset * 0.004, 0.11, 0.37);
    const medicaidEnrollment = Math.round(state.population * medicaidEnrollmentRate);
    const modeledMedicaidExpenditurePerEnrollee = round(
      clamp(6200 + modeledNeedIndex * 780 + policyScore * 26 + yearOffset * 285, 5500, 14500),
      0
    );
    const medicaidTotalExpendituresMillions =
      officialCms?.total_net_expenditures_millions ?? round((medicaidEnrollment * modeledMedicaidExpenditurePerEnrollee) / 1_000_000, 2);
    const medicaidExpenditurePerEnrollee = round((medicaidTotalExpendituresMillions * 1_000_000) / medicaidEnrollment, 0);
    const financingDataStatus: StateFinancingRecord["financing_data_status"] =
      officialMhbg || officialCms || officialUrs ? "partially_official" : "modeled";

    return {
      state: state.state,
      abbreviation: state.abbreviation,
      year,
      mhbg_allotment_millions: officialMhbgFormulaMillions ?? mhbgAllotmentMillions,
      federal_mental_health_funding_millions: federalMentalHealthFundingMillions,
      official_mhbg_formula_millions: officialMhbgFormulaMillions,
      official_mhbg_supplemental_millions: officialMhbgSupplementalMillions || undefined,
      official_urs_total_smha_expenditures_millions: officialUrs?.total_smha_expenditures_millions,
      official_urs_funding_total_millions: officialUrs?.funding_total_millions,
      official_cms_total_net_expenditures_millions: officialCms?.total_net_expenditures_millions,
      official_cms_federal_share_millions: officialCms?.total_net_expenditures_federal_share_millions,
      official_cms_state_share_millions: officialCms?.total_net_expenditures_state_share_millions,
      financing_data_status: financingDataStatus,
      public_mh_spending_millions: publicMhSpendingMillions,
      medicaid_total_expenditures_millions: medicaidTotalExpendituresMillions,
      medicaid_enrollment: medicaidEnrollment,
      medicaid_expenditure_per_enrollee: medicaidExpenditurePerEnrollee,
      medicaid_share_of_public_mh: medicaidShare,
      state_share_of_public_mh: stateShare,
      other_federal_share_of_public_mh: otherFederalShare,
      local_other_share_of_public_mh: localOtherShare,
      mhbg_per_capita: round(((officialMhbgFormulaMillions ?? mhbgAllotmentMillions) * 1_000_000) / state.population, 2),
      federal_mental_health_funding_per_capita: round((federalMentalHealthFundingMillions * 1_000_000) / state.population, 2),
      public_mh_spending_per_capita: round((publicMhSpendingMillions * 1_000_000) / state.population, 2),
      behavioral_health_policy_score: policyScore,
      raw_need_score: pcaNeedIndex.scoresByState.get(state.abbreviation)?.rawNeed ?? 0,
      need_index: needIndexScore,
      provider_density_per_100k: providerDensity,
    };
  });
});

const regressionByYear = new Map<FinancingYear, NeedFundingRegressionSummary>();
const externalSpatialResultsByKey = new Map(
  externalSpatialNeedFundingResults.map((result) => [`${result.abbreviation}-${result.year}`, result] as const)
);
const externalSpatialDiagnosticsByYear = new Map(
  externalSpatialNeedFundingDiagnostics.map((diagnostic) => [diagnostic.year as FinancingYear, diagnostic] as const)
);
const yearsWithExternalSpatialResults = new Set(
  externalSpatialNeedFundingResults.map((result) => result.year as FinancingYear)
);

FINANCING_YEARS.forEach((year) => {
  const rows = baseStateFinancingData.filter((record) => record.year === year);
  const xValues = rows.map((record) => record.need_index);
  const yValues = rows.map((record) => record.public_mh_spending_per_capita);
  const meanX = mean(xValues);
  const meanY = mean(yValues);
  const ssxx = rows.reduce((sum, record) => sum + (record.need_index - meanX) ** 2, 0);
  const ssyy = rows.reduce((sum, record) => sum + (record.public_mh_spending_per_capita - meanY) ** 2, 0);
  const ssxy = rows.reduce((sum, record) => sum + (record.need_index - meanX) * (record.public_mh_spending_per_capita - meanY), 0);
  const slope = ssxx === 0 ? 0 : ssxy / ssxx;
  const intercept = meanY - slope * meanX;
  const residuals = rows.map((record) => record.public_mh_spending_per_capita - (intercept + slope * record.need_index));
  const rss = residuals.reduce((sum, residual) => sum + residual ** 2, 0);
  const residualStd = rows.length > 2 ? Math.sqrt(rss / (rows.length - 2)) : 0;
  const slopeStdError = rows.length > 2 && ssxx > 0 ? residualStd / Math.sqrt(ssxx) : 0;
  const tStatistic = slopeStdError > 0 ? slope / slopeStdError : 0;
  const externalSpatialDiagnostic = externalSpatialDiagnosticsByYear.get(year);
  const usesExternalSpatial = yearsWithExternalSpatialResults.has(year);

  regressionByYear.set(year, {
    year,
    intercept: round(intercept, 2),
    slope: round(slope, 2),
    rSquared: round(ssyy === 0 ? 1 : 1 - rss / ssyy, 3),
    tStatistic: round(tStatistic, 2),
    residualStd: round(residualStd, 2),
    sampleSize: rows.length,
    significant: Math.abs(tStatistic) >= 2,
    modelType: usesExternalSpatial ? "external_spatial" : "linear_ols",
    modelLabel: usesExternalSpatial
      ? externalSpatialDiagnostic?.model_label ?? "External spatial model"
      : "Browser OLS baseline",
    sourceNote: usesExternalSpatial
      ? externalSpatialDiagnostic?.note ??
        "Predicted funding is coming from the fitted spatial model for this year rather than the in-browser baseline."
      : "Need index is PCA-derived, but predicted funding is currently estimated in-browser with a same-year cross-state OLS baseline until external spatial-model results are supplied.",
  });
});

const recordsWithGap = baseStateFinancingData.map((record) => {
  const regression = regressionByYear.get(record.year)!;
  const externalSpatialResult = externalSpatialResultsByKey.get(`${record.abbreviation}-${record.year}`);
  const predicted = round(
    externalSpatialResult?.predicted_public_mh_spending_per_capita ?? regression.intercept + regression.slope * record.need_index,
    2
  );
  const gap = round(
    externalSpatialResult?.funding_gap_per_capita ?? record.public_mh_spending_per_capita - predicted,
    2
  );
  const gapPercent = round(predicted === 0 ? 0 : (gap / predicted) * 100, 1);
  const gapScore = round(
    externalSpatialResult?.funding_gap_score ?? (regression.residualStd === 0 ? 0 : gap / regression.residualStd),
    2
  );

  return {
    ...record,
    predicted_public_mh_spending_per_capita: predicted,
    funding_gap_per_capita: gap,
    funding_gap_percent: gapPercent,
    funding_gap_score: gapScore,
  };
});

const persistenceByState = new Map(
  stateData.map((state) => {
    const rows = recordsWithGap
      .filter((record) => record.abbreviation === state.abbreviation)
      .sort((left, right) => left.year - right.year);
    const gaps = rows.map((record) => record.funding_gap_per_capita);
    const averageGap = round(mean(gaps), 2);
    const gapTrend = round(
      computeTrendSlope(rows.map((record) => ({ x: record.year, y: record.funding_gap_per_capita }))),
      2
    );
    const gapStd = round(standardDeviation(gaps), 2);
    const negativeGapYearsShare = round(gaps.filter((gap) => gap < 0).length / gaps.length, 2);

    return [
      state.abbreviation,
      {
        average_gap_per_capita: averageGap,
        gap_trend_per_year: gapTrend,
        gap_std_per_capita: gapStd,
        negative_gap_years_share: negativeGapYearsShare,
      },
    ] as const;
  })
);

const averageGapValues = Array.from(persistenceByState.values()).map((summary) => summary.average_gap_per_capita);
const persistentUnderfundingThreshold = round(-Math.max(15, standardDeviation(averageGapValues) * 0.5), 2);

const recordsWithPersistence = recordsWithGap.map((record) => {
  const persistence = persistenceByState.get(record.abbreviation)!;
  return {
    ...record,
    average_gap_per_capita: persistence.average_gap_per_capita,
    gap_trend_per_year: persistence.gap_trend_per_year,
    gap_std_per_capita: persistence.gap_std_per_capita,
    negative_gap_years_share: persistence.negative_gap_years_share,
    persistent_underfunding:
      persistence.average_gap_per_capita <= persistentUnderfundingThreshold && persistence.gap_trend_per_year <= 0,
  };
});

const buildTypologyForYear = (year: FinancingYear) => {
  const rows = recordsWithPersistence.filter((record) => record.year === year);
  const metrics = [
    rows.map((record) => record.need_index),
    rows.map((record) => record.public_mh_spending_per_capita),
    rows.map((record) => record.medicaid_share_of_public_mh),
    rows.map((record) => record.provider_density_per_100k),
  ];
  const mins = metrics.map((values) => Math.min(...values));
  const maxs = metrics.map((values) => Math.max(...values));

  const normalizeMetric = (value: number, index: number) =>
    maxs[index] === mins[index] ? 0.5 : (value - mins[index]) / (maxs[index] - mins[index]);

  const vectors = rows.map((record) => ({
    abbreviation: record.abbreviation,
    vector: [
      normalizeMetric(record.need_index, 0),
      normalizeMetric(record.public_mh_spending_per_capita, 1),
      normalizeMetric(record.medicaid_share_of_public_mh, 2),
      normalizeMetric(record.provider_density_per_100k, 3),
    ],
  }));

  const seedIndices = [
    vectors.reduce((best, item, index, arr) => (item.vector[0] - item.vector[1] > arr[best].vector[0] - arr[best].vector[1] ? index : best), 0),
    vectors.reduce((best, item, index, arr) => (item.vector[0] + item.vector[1] > arr[best].vector[0] + arr[best].vector[1] ? index : best), 0),
    vectors.reduce((best, item, index, arr) => (-item.vector[0] - item.vector[1] > -arr[best].vector[0] - arr[best].vector[1] ? index : best), 0),
    vectors.reduce((best, item, index, arr) => (item.vector[1] - item.vector[0] > arr[best].vector[1] - arr[best].vector[0] ? index : best), 0),
  ];

  let centroids = seedIndices.map((seedIndex) => [...vectors[seedIndex].vector]);
  let assignments = new Map<string, number>();

  for (let iteration = 0; iteration < 12; iteration += 1) {
    const nextAssignments = new Map<string, number>();
    vectors.forEach((item) => {
      let bestCluster = 0;
      let bestDistance = Number.POSITIVE_INFINITY;
      centroids.forEach((centroid, clusterIndex) => {
        const distance = euclideanDistance(item.vector, centroid);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestCluster = clusterIndex;
        }
      });
      nextAssignments.set(item.abbreviation, bestCluster);
    });

    const nextCentroids = centroids.map((centroid, clusterIndex) => {
      const members = vectors.filter((item) => nextAssignments.get(item.abbreviation) === clusterIndex);
      if (!members.length) return centroid;
      return centroid.map((_, metricIndex) => mean(members.map((member) => member.vector[metricIndex])));
    });

    const stable = Array.from(nextAssignments.entries()).every(([abbr, cluster]) => assignments.get(abbr) === cluster);
    assignments = nextAssignments;
    centroids = nextCentroids;
    if (stable) break;
  }

  const pickCluster = (score: (centroid: number[]) => number, excluded: Set<number>) => {
    let bestCluster = -1;
    let bestScore = Number.NEGATIVE_INFINITY;
    centroids.forEach((centroid, clusterId) => {
      if (excluded.has(clusterId)) return;
      const nextScore = score(centroid);
      if (nextScore > bestScore) {
        bestScore = nextScore;
        bestCluster = clusterId;
      }
    });
    return bestCluster;
  };

  const assignedLabels = new Map<number, TypologyLabel>();
  const usedClusters = new Set<number>();

  const highNeedLowFundingCluster = pickCluster((centroid) => centroid[0] - centroid[1], usedClusters);
  if (highNeedLowFundingCluster >= 0) {
    assignedLabels.set(highNeedLowFundingCluster, "High need / low funding");
    usedClusters.add(highNeedLowFundingCluster);
  }

  const highNeedHighFundingCluster = pickCluster((centroid) => centroid[0] + centroid[1], usedClusters);
  if (highNeedHighFundingCluster >= 0) {
    assignedLabels.set(highNeedHighFundingCluster, "High need / high funding");
    usedClusters.add(highNeedHighFundingCluster);
  }

  const lowNeedHighFundingCluster = pickCluster((centroid) => centroid[1] - centroid[0], usedClusters);
  if (lowNeedHighFundingCluster >= 0) {
    assignedLabels.set(lowNeedHighFundingCluster, "Low need / high funding");
    usedClusters.add(lowNeedHighFundingCluster);
  }

  const lowNeedLowFundingCluster = pickCluster((centroid) => -centroid[0] - centroid[1], usedClusters);
  if (lowNeedLowFundingCluster >= 0) {
    assignedLabels.set(lowNeedLowFundingCluster, "Low need / low funding");
  }

  const clusterMeta = centroids.map((_, clusterId) => {
    const label = assignedLabels.get(clusterId) ?? "Low need / low funding";

    return {
      clusterId,
      label,
      description: TYPOLOGY_METADATA[label].description,
      color: TYPOLOGY_METADATA[label].color,
    };
  });

  return {
    assignments,
    clusterMeta,
  };
};

const typologyByYear = new Map(FINANCING_YEARS.map((year) => [year, buildTypologyForYear(year)] as const));

export const stateFinancingData: StateFinancingRecord[] = recordsWithPersistence.map((record) => {
  const typology = typologyByYear.get(record.year)!;
  const clusterId = typology.assignments.get(record.abbreviation) ?? 0;
  const clusterMeta = typology.clusterMeta[clusterId];
  const expansionRecord = getMedicaidExpansionRecord(record.abbreviation, record.year);
  const firstFullExpansionYear = (expansionRecord?.first_full_expansion_year ?? null) as FinancingYear | null;

  return {
    ...record,
    mismatch_index: record.funding_gap_score,
    medicaid_expansion_status: expansionRecord?.medicaid_expansion_status ?? 0,
    medicaid_expansion_label: expansionRecord?.medicaid_expansion_label ?? "Non-expansion",
    first_full_expansion_year: firstFullExpansionYear,
    expansion_event_time: firstFullExpansionYear === null ? null : record.year - firstFullExpansionYear,
    typology_cluster_id: clusterId,
    typology_cluster_label: clusterMeta.label,
    typology_cluster_description: clusterMeta.description,
    typology_cluster_color: clusterMeta.color,
  };
});

export const getStateFinancingRecord = (abbreviation: string, year: FinancingYear) =>
  stateFinancingData.find((entry) => entry.abbreviation === abbreviation && entry.year === year);

export const getStateFinancingByYear = (year: FinancingYear) =>
  stateFinancingData.filter((entry) => entry.year === year);

export const getFinancingMetricValue = (record: StateFinancingRecord, metric: FinancingMetric) => record[metric];

export const getNeedFundingRegression = (year: FinancingYear) => regressionByYear.get(year)!;
export const getNeedIndexMethodSummary = (): NeedIndexMethodSummary => pcaNeedIndex.methodSummary;

export const getPersistentUnderfundingThreshold = () => persistentUnderfundingThreshold;

export const getPersistentUnderinvestmentStates = (year: FinancingYear = FINANCING_YEARS[FINANCING_YEARS.length - 1]) => {
  return stateData
    .map((state) => {
      const selectedYearRecord = getStateFinancingRecord(state.abbreviation, year)!;
      return {
        state: selectedYearRecord.state,
        abbreviation: selectedYearRecord.abbreviation,
        average_gap_per_capita: selectedYearRecord.average_gap_per_capita,
        gap_trend_per_year: selectedYearRecord.gap_trend_per_year,
        gap_std_per_capita: selectedYearRecord.gap_std_per_capita,
        negative_gap_years_share: selectedYearRecord.negative_gap_years_share,
        persistent_underfunding: selectedYearRecord.persistent_underfunding,
        latest_gap_per_capita: selectedYearRecord.funding_gap_per_capita,
        latest_need_index: selectedYearRecord.need_index,
        latest_public_mh_spending_per_capita: selectedYearRecord.public_mh_spending_per_capita,
        latest_predicted_public_mh_spending_per_capita: selectedYearRecord.predicted_public_mh_spending_per_capita,
        typology_cluster_label: selectedYearRecord.typology_cluster_label,
      } as PersistentUnderinvestmentSummary;
    })
    .sort((left, right) => {
      if (left.persistent_underfunding !== right.persistent_underfunding) {
        return Number(right.persistent_underfunding) - Number(left.persistent_underfunding);
      }
      return left.average_gap_per_capita - right.average_gap_per_capita;
    });
};

export const getTypologySummaryByYear = (year: FinancingYear): TypologyClusterSummary[] => {
  const rows = getStateFinancingByYear(year);
  const counts = new Map<number, string[]>();
  rows.forEach((record) => {
    counts.set(record.typology_cluster_id, [...(counts.get(record.typology_cluster_id) ?? []), record.abbreviation]);
  });

  const labelOrder: TypologyLabel[] = [
    "High need / low funding",
    "High need / high funding",
    "Low need / low funding",
    "Low need / high funding",
  ];

  return Array.from(counts.entries())
    .map(([clusterId, states]) => {
      const sample = rows.find((record) => record.typology_cluster_id === clusterId)!;
      return {
        year,
        clusterId,
        label: sample.typology_cluster_label,
        description: sample.typology_cluster_description,
        color: sample.typology_cluster_color,
        count: states.length,
        states: states.sort(),
      };
    })
    .sort((left, right) => labelOrder.indexOf(left.label) - labelOrder.indexOf(right.label));
};

export const getFinancingProvenanceSummary = (record: StateFinancingRecord): FinancingProvenanceSummary => {
  const hasUrs = typeof record.official_urs_total_smha_expenditures_millions === "number";
  const hasUrsFundingShares = typeof record.official_urs_funding_total_millions === "number" && record.official_urs_funding_total_millions > 0;
  const hasCms = typeof record.official_cms_total_net_expenditures_millions === "number";
  const hasMhbg =
    typeof record.official_mhbg_formula_millions === "number" || typeof record.official_mhbg_supplemental_millions === "number";

  if (hasUrs && (hasCms || hasMhbg)) {
    return {
      level: "mixed_official",
      label: "Official URS + CMS/MHBG",
      badges: ["URS", ...(hasCms ? ["CMS"] : []), ...(hasMhbg ? ["MHBG"] : [])],
      note: hasUrsFundingShares
        ? "Public mental health spending and funding-source shares are direct URS values; Medicaid expenditure and federal grant components also use official CMS and/or MHBG files where available."
        : "Public mental health spending totals are direct URS values; Medicaid expenditure and grant components also use official CMS and/or MHBG files where available, while funding-source shares still rely on the harmonized financing model.",
    };
  }

  if (hasUrs) {
    return {
      level: "official_urs",
      label: "Official URS-backed",
      badges: ["URS"],
      note: hasUrsFundingShares
        ? "This state-year uses direct SAMHSA URS public mental health spending and funding-share values. Components not covered by URS may still use the dashboard's financing model."
        : "This state-year uses a direct SAMHSA URS public mental health spending total, while funding-source shares still rely on the harmonized financing model because the URS funding table was not machine-readable in the source PDF.",
    };
  }

  if (hasCms || hasMhbg) {
    return {
      level: "official_cms_mhbg",
      label: "Official CMS/MHBG-backed",
      badges: [...(hasCms ? ["CMS"] : []), ...(hasMhbg ? ["MHBG"] : [])],
      note: "This state-year uses direct CMS Medicaid expenditure and/or SAMHSA MHBG grant values, while public mental health spending shares still rely on the harmonized financing model.",
    };
  }

  return {
    level: "modeled",
    label: "Modeled fallback",
    badges: ["Modeled"],
    note: "No direct official financing extract is currently wired for this state-year, so the dashboard is showing the harmonized modeled financing layer.",
  };
};

export const getNationalFinancingTrend = () =>
  FINANCING_YEARS.map((year) => {
    const rows = getStateFinancingByYear(year);
    const totalPublic = rows.reduce((sum, row) => sum + row.public_mh_spending_millions, 0);
    const totalFederal = rows.reduce((sum, row) => sum + row.federal_mental_health_funding_millions, 0);
    const totalMhbg = rows.reduce((sum, row) => sum + row.mhbg_allotment_millions, 0);
    const totalMedicaid = rows.reduce((sum, row) => sum + row.medicaid_total_expenditures_millions, 0);
    const totalEnrollment = rows.reduce((sum, row) => sum + row.medicaid_enrollment, 0);
    const regression = getNeedFundingRegression(year);

    return {
      year,
      mhbg_allotment_millions: round(totalMhbg, 1),
      federal_mental_health_funding_millions: round(totalFederal, 1),
      public_mh_spending_millions: round(totalPublic, 1),
      medicaid_total_expenditures_billions: round(totalMedicaid / 1000, 2),
      medicaid_share_of_public_mh: round(rows.reduce((sum, row) => sum + row.medicaid_share_of_public_mh, 0) / rows.length, 1),
      medicaid_expenditure_per_enrollee: round((totalMedicaid * 1_000_000) / totalEnrollment, 0),
      behavioral_health_policy_score: round(rows.reduce((sum, row) => sum + row.behavioral_health_policy_score, 0) / rows.length, 1),
      average_need_index: round(rows.reduce((sum, row) => sum + row.need_index, 0) / rows.length, 1),
      average_gap_per_capita: round(rows.reduce((sum, row) => sum + row.funding_gap_per_capita, 0) / rows.length, 2),
      regression_r_squared: regression.rSquared,
      regression_t_statistic: regression.tStatistic,
      regression_slope: regression.slope,
    };
  });

export const getExpansionMismatchTrend = (): ExpansionMismatchTrendPoint[] =>
  FINANCING_YEARS.map((year) => {
    const rows = getStateFinancingByYear(year);
    const expansionRows = rows.filter((record) => record.medicaid_expansion_status === 1);
    const nonExpansionRows = rows.filter((record) => record.medicaid_expansion_status === 0);

    return {
      year,
      expansion_mean_mismatch_index: round(mean(expansionRows.map((record) => record.mismatch_index)), 2),
      non_expansion_mean_mismatch_index: round(mean(nonExpansionRows.map((record) => record.mismatch_index)), 2),
      expansion_mean_gap_per_capita: round(mean(expansionRows.map((record) => record.funding_gap_per_capita)), 2),
      non_expansion_mean_gap_per_capita: round(mean(nonExpansionRows.map((record) => record.funding_gap_per_capita)), 2),
      expansion_count: expansionRows.length,
      non_expansion_count: nonExpansionRows.length,
    };
  });

export const getExpansionMismatchDistribution = (year: FinancingYear): ExpansionMismatchDistributionPoint[] => {
  const rows = getStateFinancingByYear(year).sort((left, right) => left.abbreviation.localeCompare(right.abbreviation));

  return rows.map((record, index) => {
    const jitter = (((index % 7) - 3) * 0.045);
    return {
      state: record.state,
      abbreviation: record.abbreviation,
      year: record.year,
      medicaid_expansion_status: record.medicaid_expansion_status,
      medicaid_expansion_label: record.medicaid_expansion_label,
      mismatch_index: record.mismatch_index,
      funding_gap_per_capita: record.funding_gap_per_capita,
      x_position: record.medicaid_expansion_status + jitter,
    };
  });
};

export const getExpansionMismatchSummary = (year: FinancingYear): ExpansionMismatchYearSummary => {
  const rows = getStateFinancingByYear(year);
  const expansionRows = rows.filter((record) => record.medicaid_expansion_status === 1);
  const nonExpansionRows = rows.filter((record) => record.medicaid_expansion_status === 0);
  const expansionValues = expansionRows.map((record) => record.mismatch_index);
  const nonExpansionValues = nonExpansionRows.map((record) => record.mismatch_index);
  const expansionMean = mean(expansionValues);
  const nonExpansionMean = mean(nonExpansionValues);
  const expansionVariance = expansionValues.length > 1 ? standardDeviation(expansionValues) ** 2 : 0;
  const nonExpansionVariance = nonExpansionValues.length > 1 ? standardDeviation(nonExpansionValues) ** 2 : 0;
  const standardError = Math.sqrt(
    expansionVariance / Math.max(expansionValues.length, 1) +
      nonExpansionVariance / Math.max(nonExpansionValues.length, 1)
  );
  const zScore = standardError === 0 ? 0 : (expansionMean - nonExpansionMean) / standardError;
  const pValue = 2 * (1 - normalCdf(Math.abs(zScore)));

  return {
    year,
    expansion_mean_mismatch_index: round(expansionMean, 2),
    non_expansion_mean_mismatch_index: round(nonExpansionMean, 2),
    mean_difference: round(expansionMean - nonExpansionMean, 2),
    pValue: round(pValue, 4),
    expansion_count: expansionRows.length,
    non_expansion_count: nonExpansionRows.length,
  };
};

export const getStateExpansionTrend = (abbreviation: string): ExpansionStateTrendPoint[] =>
  stateFinancingData
    .filter((record) => record.abbreviation === abbreviation)
    .sort((left, right) => left.year - right.year)
    .map((record) => ({
      state: record.state,
      abbreviation: record.abbreviation,
      year: record.year,
      mismatch_index: record.mismatch_index,
      funding_gap_per_capita: record.funding_gap_per_capita,
      medicaid_expansion_status: record.medicaid_expansion_status,
      medicaid_expansion_label: record.medicaid_expansion_label,
      expansion_event_time: record.expansion_event_time,
      first_full_expansion_year: record.first_full_expansion_year,
    }));

export const getExpansionEventTrend = (window = 4): ExpansionEventTrendPoint[] => {
  const rows = stateFinancingData.filter(
    (record) =>
      record.first_full_expansion_year !== null &&
      record.first_full_expansion_year > 2016 &&
      record.expansion_event_time !== null &&
      Math.abs(record.expansion_event_time) <= window
  );
  const grouped = new Map<number, StateFinancingRecord[]>();

  rows.forEach((record) => {
    const key = record.expansion_event_time!;
    grouped.set(key, [...(grouped.get(key) ?? []), record]);
  });

  return Array.from(grouped.entries())
    .map(([eventTime, records]) => ({
      event_time: eventTime,
      mean_mismatch_index: round(mean(records.map((record) => record.mismatch_index)), 2),
      mean_gap_per_capita: round(mean(records.map((record) => record.funding_gap_per_capita)), 2),
      state_count: records.length,
    }))
    .sort((left, right) => left.event_time - right.event_time);
};

const medicaidExpansionPolicyRegression: MedicaidExpansionPolicyRegressionSummary = (() => {
  const rows = stateFinancingData.map((record) => ({
    abbreviation: record.abbreviation,
    year: record.year,
    y: record.mismatch_index,
    x: record.medicaid_expansion_status,
  }));
  const stateMeans = new Map<string, { x: number; y: number }>();
  const yearMeans = new Map<FinancingYear, { x: number; y: number }>();
  const overallX = mean(rows.map((row) => row.x));
  const overallY = mean(rows.map((row) => row.y));

  Array.from(new Set(rows.map((row) => row.abbreviation))).forEach((abbreviation) => {
    const stateRows = rows.filter((row) => row.abbreviation === abbreviation);
    stateMeans.set(abbreviation, {
      x: mean(stateRows.map((row) => row.x)),
      y: mean(stateRows.map((row) => row.y)),
    });
  });

  FINANCING_YEARS.forEach((year) => {
    const yearRows = rows.filter((row) => row.year === year);
    yearMeans.set(year, {
      x: mean(yearRows.map((row) => row.x)),
      y: mean(yearRows.map((row) => row.y)),
    });
  });

  const transformed = rows.map((row) => {
    const stateMean = stateMeans.get(row.abbreviation)!;
    const yearMean = yearMeans.get(row.year)!;
    const xTilde = row.x - stateMean.x - yearMean.x + overallX;
    const yTilde = row.y - stateMean.y - yearMean.y + overallY;
    return {
      ...row,
      xTilde,
      yTilde,
    };
  });

  const ssx = transformed.reduce((sum, row) => sum + row.xTilde ** 2, 0);
  const sxy = transformed.reduce((sum, row) => sum + row.xTilde * row.yTilde, 0);
  const coefficient = ssx === 0 ? 0 : sxy / ssx;
  const residuals = transformed.map((row) => row.yTilde - coefficient * row.xTilde);
  const rss = residuals.reduce((sum, residual) => sum + residual ** 2, 0);
  const tss = transformed.reduce((sum, row) => sum + row.yTilde ** 2, 0);
  const degreesOfFreedom = Math.max(1, rows.length - stateMeans.size - yearMeans.size);
  const sigmaSquared = rss / degreesOfFreedom;
  const standardError = ssx === 0 ? 0 : Math.sqrt(sigmaSquared / ssx);
  const tStatistic = standardError === 0 ? 0 : coefficient / standardError;
  const withinRSquared = tss === 0 ? 1 : 1 - rss / tss;
  const coefficientRounded = round(coefficient, 3);
  const standardErrorRounded = round(standardError, 3);
  const tStatisticRounded = round(tStatistic, 2);
  const significant = Math.abs(tStatisticRounded) >= 2;

  return {
    coefficient: coefficientRounded,
    standardError: standardErrorRounded,
    tStatistic: tStatisticRounded,
    withinRSquared: round(withinRSquared, 3),
    sampleSize: rows.length,
    stateCount: stateMeans.size,
    yearCount: yearMeans.size,
    significant,
    controlsIncluded: [],
    controlsOmitted: [
      "poverty_rate unavailable in current panel",
      "unemployment_rate unavailable in current panel",
      "provider_density absorbed by state fixed effects because it is time-invariant in this dashboard",
    ],
    interpretation:
      coefficientRounded >= 0
        ? `With state and year fixed effects, Medicaid expansion status is associated with a ${coefficientRounded}-point higher mismatch index, which corresponds to less underfunding relative to modeled need.`
        : `With state and year fixed effects, Medicaid expansion status is associated with a ${Math.abs(coefficientRounded)}-point lower mismatch index, which corresponds to more underfunding relative to modeled need.`,
    caution:
      "This is an observational fixed-effects association, not a definitive causal estimate. Identification comes from states that changed expansion status during 2016-2024, and unmeasured concurrent policy changes may also affect the mismatch index.",
  };
})();

const FOCUSED_LATE_EXPANSION_STATE_ABBREVIATIONS = ["ME", "VA", "ID", "UT", "NE", "OK", "MO", "SD"] as const;

const focusedLateExpansionRows = stateFinancingData.filter((record) =>
  FOCUSED_LATE_EXPANSION_STATE_ABBREVIATIONS.includes(record.abbreviation as (typeof FOCUSED_LATE_EXPANSION_STATE_ABBREVIATIONS)[number])
);

const focusedLateExpansionStateSummaries: LateExpansionItsStateSummary[] = FOCUSED_LATE_EXPANSION_STATE_ABBREVIATIONS.map((abbreviation) => {
  const rows = focusedLateExpansionRows
    .filter((record) => record.abbreviation === abbreviation)
    .sort((left, right) => left.year - right.year);
  const expansionYear = rows[0]?.first_full_expansion_year ?? 2019;
  const preRows = rows.filter((record) => record.year < expansionYear);
  const postRows = rows.filter((record) => record.year >= expansionYear);
  const stateModel = fitLinearModel(
    rows.map((record) => ({
      y: record.mismatch_index,
      predictors: [record.year - FINANCING_YEARS[0], record.year >= expansionYear ? 1 : 0, record.year >= expansionYear ? record.year - expansionYear : 0],
    })),
    ["time", "post", "time_after"]
  );
  const coefficientByTerm = new Map(stateModel?.coefficients.map((coefficient) => [coefficient.term, coefficient]) ?? []);

  return {
    state: rows[0]?.state ?? abbreviation,
    abbreviation,
    expansionYear,
    preYears: preRows.length,
    postYears: postRows.length,
    preMeanMismatchIndex: round(mean(preRows.map((record) => record.mismatch_index)), 2),
    postMeanMismatchIndex: round(mean(postRows.map((record) => record.mismatch_index)), 2),
    meanDifference: round(mean(postRows.map((record) => record.mismatch_index)) - mean(preRows.map((record) => record.mismatch_index)), 2),
    levelChange: round(coefficientByTerm.get("post")?.estimate ?? 0, 3),
    levelPValue: round(coefficientByTerm.get("post")?.pValue ?? 1, 4),
    trendChange: round(coefficientByTerm.get("time_after")?.estimate ?? 0, 3),
    trendPValue: round(coefficientByTerm.get("time_after")?.pValue ?? 1, 4),
    latestMismatchIndex: round(rows[rows.length - 1]?.mismatch_index ?? 0, 2),
  };
}).sort((left, right) => left.expansionYear - right.expansionYear || left.abbreviation.localeCompare(right.abbreviation));

const focusedLateExpansionItsSummary: LateExpansionItsSummary = (() => {
  const orderedStates = Array.from(new Set(focusedLateExpansionRows.map((record) => record.abbreviation))).sort();
  const referenceState = orderedStates[0];
  const stackedModel = fitLinearModel(
    focusedLateExpansionRows.map((record) => ({
      y: record.mismatch_index,
      predictors: [
        ...orderedStates.slice(1).map((state) => (record.abbreviation === state ? 1 : 0)),
        record.year - FINANCING_YEARS[0],
        record.medicaid_expansion_status,
        record.expansion_event_time !== null && record.expansion_event_time >= 0 ? record.expansion_event_time : 0,
      ],
    })),
    [...orderedStates.slice(1).map((state) => `state_${state}`), "time", "post", "time_after"]
  );
  const coefficientByTerm = new Map(stackedModel?.coefficients.map((coefficient) => [coefficient.term, coefficient]) ?? []);
  const postCoefficient = coefficientByTerm.get("post");
  const timeAfterCoefficient = coefficientByTerm.get("time_after");

  return {
    includedStates: focusedLateExpansionStateSummaries.map((summary) => ({
      state: summary.state,
      abbreviation: summary.abbreviation,
      expansionYear: summary.expansionYear,
    })),
    outcomeLabel: "Mismatch index (standardized need-funding gap score)",
    sampleSize: focusedLateExpansionRows.length,
    adjustedRSquared: round(stackedModel?.adjustedRSquared ?? 0, 3),
    coefficients: [
      {
        term: "time",
        label: "Pre-expansion slope",
        estimate: round(coefficientByTerm.get("time")?.estimate ?? 0, 4),
        standardError: round(coefficientByTerm.get("time")?.standardError ?? 0, 4),
        tStatistic: round(coefficientByTerm.get("time")?.tStatistic ?? 0, 3),
        pValue: round(coefficientByTerm.get("time")?.pValue ?? 1, 4),
      },
      {
        term: "post",
        label: "Immediate level change",
        estimate: round(postCoefficient?.estimate ?? 0, 4),
        standardError: round(postCoefficient?.standardError ?? 0, 4),
        tStatistic: round(postCoefficient?.tStatistic ?? 0, 3),
        pValue: round(postCoefficient?.pValue ?? 1, 4),
      },
      {
        term: "time_after",
        label: "Post-expansion slope change",
        estimate: round(timeAfterCoefficient?.estimate ?? 0, 4),
        standardError: round(timeAfterCoefficient?.standardError ?? 0, 4),
        tStatistic: round(timeAfterCoefficient?.tStatistic ?? 0, 3),
        pValue: round(timeAfterCoefficient?.pValue ?? 1, 4),
      },
    ],
    interpretation:
      (timeAfterCoefficient?.estimate ?? 0) < 0
        ? "Across the late-adopting expansion states, the pooled interrupted time series does not show a common positive break in alignment at adoption. The dominant pattern is a more negative post-expansion slope in the mismatch index."
        : "Across the late-adopting expansion states, the pooled interrupted time series suggests improving alignment after adoption through a more positive post-expansion slope.",
    caution:
      "This focused ITS is descriptive. The late-adopter sample is small, state heterogeneity is substantial, and it does not by itself identify a causal effect of Medicaid expansion on financing alignment.",
    note: `State fixed effects are included in the pooled segmented model. The reference state for the dummy set is ${referenceState}. North Carolina is excluded because the current panel has only one post-expansion year.`,
  };
})();

const focusedLateExpansionEventTrend: LateExpansionItsEventPoint[] = (() => {
  const grouped = new Map<number, StateFinancingRecord[]>();

  focusedLateExpansionRows.forEach((record) => {
    if (record.expansion_event_time === null) return;
    grouped.set(record.expansion_event_time, [...(grouped.get(record.expansion_event_time) ?? []), record]);
  });

  return Array.from(grouped.entries())
    .map(([eventTime, rows]) => ({
      eventTime,
      meanMismatchIndex: round(mean(rows.map((row) => row.mismatch_index)), 3),
      stateCount: rows.length,
    }))
    .sort((left, right) => left.eventTime - right.eventTime);
})();

export const getMedicaidExpansionPolicyRegression = () => medicaidExpansionPolicyRegression;
export const getFocusedLateExpansionItsSummary = () => focusedLateExpansionItsSummary;
export const getFocusedLateExpansionStateSummaries = () => focusedLateExpansionStateSummaries;
export const getFocusedLateExpansionEventTrend = () => focusedLateExpansionEventTrend;

export const getNeedFundingScatterSummary = (year: FinancingYear): NeedFundingScatterSummary => {
  const points = getStateFinancingByYear(year)
    .map((record) => ({
      state: record.state,
      abbreviation: record.abbreviation,
      year: record.year,
      need_index: record.need_index,
      public_mh_spending_per_capita: record.public_mh_spending_per_capita,
      predicted_public_mh_spending_per_capita: record.predicted_public_mh_spending_per_capita,
      funding_gap_per_capita: record.funding_gap_per_capita,
      funding_gap_score: record.funding_gap_score,
    }))
    .sort((left, right) => left.abbreviation.localeCompare(right.abbreviation));
  const regression = getNeedFundingRegression(year);
  const needValues = points.map((point) => point.need_index);
  const minNeedValue = Math.min(...needValues);
  const maxNeedValue = Math.max(...needValues);

  return {
    points,
    line:
      regression.modelType === "linear_ols"
        ? [minNeedValue, maxNeedValue].map((needIndex) => ({
            need_index: needIndex,
            predicted_public_mh_spending_per_capita: round(regression.intercept + regression.slope * needIndex, 2),
          }))
        : [],
    outliers: [...points]
      .sort((left, right) => Math.abs(right.funding_gap_score) - Math.abs(left.funding_gap_score))
      .slice(0, 8),
  };
};

export const getGapScoreExportRows = (year: FinancingYear) =>
  getStateFinancingByYear(year)
    .map((record) => ({
      state: record.state,
      abbreviation: record.abbreviation,
      year: record.year,
      raw_need_score: round(record.raw_need_score, 4),
      need_index: record.need_index,
      public_mh_spending_per_capita: record.public_mh_spending_per_capita,
      predicted_public_mh_spending_per_capita: record.predicted_public_mh_spending_per_capita,
      funding_gap_per_capita: record.funding_gap_per_capita,
      funding_gap_percent: record.funding_gap_percent,
      funding_gap_score: record.funding_gap_score,
      mismatch_index: record.mismatch_index,
      medicaid_expansion_label: record.medicaid_expansion_label,
      financing_status: getFinancingProvenanceSummary(record).label,
    }))
    .sort((left, right) => left.state.localeCompare(right.state));

export const getPersistentUnderinvestmentExportRows = () =>
  getPersistentUnderinvestmentStates().map((record) => ({
    state: record.state,
    abbreviation: record.abbreviation,
    average_gap_per_capita: record.average_gap_per_capita,
    gap_trend_per_year: record.gap_trend_per_year,
    gap_std_per_capita: record.gap_std_per_capita,
    negative_gap_years_share: record.negative_gap_years_share,
    persistent_underfunding: record.persistent_underfunding,
    latest_gap_per_capita: record.latest_gap_per_capita,
    latest_need_index: record.latest_need_index,
    latest_public_mh_spending_per_capita: record.latest_public_mh_spending_per_capita,
    latest_predicted_public_mh_spending_per_capita: record.latest_predicted_public_mh_spending_per_capita,
    typology_cluster_label: record.typology_cluster_label,
  }));

export const getTypologyExportRows = (year: FinancingYear) =>
  getStateFinancingByYear(year)
    .map((record) => ({
      state: record.state,
      abbreviation: record.abbreviation,
      year: record.year,
      typology_cluster_id: record.typology_cluster_id,
      typology_cluster_label: record.typology_cluster_label,
      typology_cluster_description: record.typology_cluster_description,
      typology_cluster_color: record.typology_cluster_color,
      raw_need_score: round(record.raw_need_score, 4),
      need_index: record.need_index,
      public_mh_spending_per_capita: record.public_mh_spending_per_capita,
      medicaid_share_of_public_mh: record.medicaid_share_of_public_mh,
      provider_density_per_100k: record.provider_density_per_100k,
      persistent_underfunding: record.persistent_underfunding,
    }))
    .sort((left, right) => left.state.localeCompare(right.state));

export const getSpatialNeedFundingPanelRows = () =>
  stateFinancingData
    .map((record) => {
      const state = stateData.find((entry) => entry.abbreviation === record.abbreviation)!;
      return {
        state: record.state,
        abbreviation: record.abbreviation,
        year: record.year,
        lat: state.lat,
        lng: state.lng,
        population: state.population,
        raw_need_score: round(record.raw_need_score, 4),
        need_index: record.need_index,
        ami: round(state.ami, 2),
        smi: round(state.smi, 2),
        mde_adult: round(state.mde_adult, 2),
        mde_youth: round(state.mde_youth, 2),
        suicide_rate: round(state.suicide_rate, 2),
        substance_use_disorder: round(state.substance_use_disorder, 2),
        public_mh_spending_per_capita: record.public_mh_spending_per_capita,
        predicted_public_mh_spending_per_capita: record.predicted_public_mh_spending_per_capita,
        funding_gap_per_capita: record.funding_gap_per_capita,
        funding_gap_score: record.funding_gap_score,
        medicaid_share_of_public_mh: record.medicaid_share_of_public_mh,
        provider_density_per_100k: record.provider_density_per_100k,
        medicaid_expansion_status: record.medicaid_expansion_status,
        medicaid_expansion_label: record.medicaid_expansion_label,
        financing_status: getFinancingProvenanceSummary(record).label,
      };
    })
    .sort((left, right) => {
      if (left.year !== right.year) return left.year - right.year;
      return left.state.localeCompare(right.state);
    });
