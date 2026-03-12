import { getStateResources, stateData } from "./stateData";
import { officialCmsMedicaidExpendituresByStateYear } from "./officialCmsMedicaidExpenditures";
import { officialMhbgAwardsByStateYear } from "./officialMhbgAwards";
import { officialUrsFinancingByStateYear } from "./officialUrsFinancing";

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

const needProfiles = stateData.map((state) => {
  const rawNeed =
    state.ami * 0.35 +
    state.smi * 1.6 +
    state.mde_adult * 0.9 +
    state.mde_youth * 0.45 +
    state.suicide_rate * 0.4 +
    state.substance_use_disorder * 0.75;

  return {
    abbreviation: state.abbreviation,
    rawNeed,
  };
});

const minNeed = Math.min(...needProfiles.map((profile) => profile.rawNeed));
const maxNeed = Math.max(...needProfiles.map((profile) => profile.rawNeed));
const modeledNeedIndexByState = new Map(
  needProfiles.map((profile) => [
    profile.abbreviation,
    maxNeed === minNeed ? 1 : 0.75 + ((profile.rawNeed - minNeed) / (maxNeed - minNeed)) * 0.7,
  ])
);
const needIndexScoreByState = new Map(
  needProfiles.map((profile) => [
    profile.abbreviation,
    maxNeed === minNeed ? 50 : round(((profile.rawNeed - minNeed) / (maxNeed - minNeed)) * 100, 1),
  ])
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
      raw_need_score: needProfiles.find((profile) => profile.abbreviation === state.abbreviation)?.rawNeed ?? 0,
      need_index: needIndexScore,
      provider_density_per_100k: providerDensity,
    };
  });
});

const regressionByYear = new Map<FinancingYear, NeedFundingRegressionSummary>();

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

  regressionByYear.set(year, {
    year,
    intercept: round(intercept, 2),
    slope: round(slope, 2),
    rSquared: round(ssyy === 0 ? 1 : 1 - rss / ssyy, 3),
    tStatistic: round(tStatistic, 2),
    residualStd: round(residualStd, 2),
    sampleSize: rows.length,
    significant: Math.abs(tStatistic) >= 2,
  });
});

const recordsWithGap = baseStateFinancingData.map((record) => {
  const regression = regressionByYear.get(record.year)!;
  const predicted = round(regression.intercept + regression.slope * record.need_index, 2);
  const gap = round(record.public_mh_spending_per_capita - predicted, 2);
  const gapPercent = round(predicted === 0 ? 0 : (gap / predicted) * 100, 1);
  const gapScore = round(regression.residualStd === 0 ? 0 : gap / regression.residualStd, 2);

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

  const clusterMeta = centroids.map((centroid, clusterId) => {
    const highNeed = centroid[0] >= 0.5;
    const highFunding = centroid[1] >= 0.5;
    const label: TypologyLabel = highNeed
      ? highFunding
        ? "High need / high funding"
        : "High need / low funding"
      : highFunding
        ? "Low need / high funding"
        : "Low need / low funding";

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

  return {
    ...record,
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

export const getPersistentUnderfundingThreshold = () => persistentUnderfundingThreshold;

export const getPersistentUnderinvestmentStates = () => {
  const latestYear = FINANCING_YEARS[FINANCING_YEARS.length - 1];
  return stateData
    .map((state) => {
      const latest = getStateFinancingRecord(state.abbreviation, latestYear)!;
      return {
        state: latest.state,
        abbreviation: latest.abbreviation,
        average_gap_per_capita: latest.average_gap_per_capita,
        gap_trend_per_year: latest.gap_trend_per_year,
        gap_std_per_capita: latest.gap_std_per_capita,
        negative_gap_years_share: latest.negative_gap_years_share,
        persistent_underfunding: latest.persistent_underfunding,
        latest_gap_per_capita: latest.funding_gap_per_capita,
        latest_need_index: latest.need_index,
        latest_public_mh_spending_per_capita: latest.public_mh_spending_per_capita,
        latest_predicted_public_mh_spending_per_capita: latest.predicted_public_mh_spending_per_capita,
        typology_cluster_label: latest.typology_cluster_label,
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
    .sort((left, right) => left.label.localeCompare(right.label));
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
