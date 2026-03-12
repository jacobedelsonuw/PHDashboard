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
}

export type FinancingProvenanceLevel = "official_urs" | "official_cms_mhbg" | "mixed_official" | "modeled";

export interface FinancingProvenanceSummary {
  level: FinancingProvenanceLevel;
  label: string;
  badges: string[];
  note: string;
}

export const financingMetricLabels: Record<FinancingMetric, string> = {
  mhbg_per_capita: "MHBG Funding per Capita ($)",
  federal_mental_health_funding_per_capita: "Federal Mental Health Funding per Capita ($)",
  public_mh_spending_per_capita: "Public Mental Health Spending per Capita ($)",
  medicaid_expenditure_per_enrollee: "Medicaid Spending per Enrollee ($)",
  medicaid_share_of_public_mh: "Medicaid Share of Public MH Financing (%)",
  behavioral_health_policy_score: "Behavioral Health Policy Context Score",
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round = (value: number, digits = 1) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const needScores = stateData.map((state) => {
  const rawNeed =
    state.ami * 0.35 +
    state.smi * 1.6 +
    state.mde_adult * 0.9 +
    state.mde_youth * 0.45 +
    state.suicide_rate * 0.4 +
    state.substance_use_disorder * 0.75;
  return { abbreviation: state.abbreviation, rawNeed };
});

const minNeed = Math.min(...needScores.map((item) => item.rawNeed));
const maxNeed = Math.max(...needScores.map((item) => item.rawNeed));
const needIndexByState = new Map(
  needScores.map((item) => [
    item.abbreviation,
    maxNeed === minNeed ? 1 : 0.75 + ((item.rawNeed - minNeed) / (maxNeed - minNeed)) * 0.7,
  ])
);

export const stateFinancingData: StateFinancingRecord[] = FINANCING_YEARS.flatMap((year) => {
  const yearOffset = year - FINANCING_YEARS[0];
  const federalGrowth = 1 + yearOffset * 0.037;
  const spendingGrowth = 1 + yearOffset * 0.051;

  return stateData.map((state) => {
    const resources = getStateResources(state.abbreviation);
    const needIndex = needIndexByState.get(state.abbreviation) ?? 1;
    const providerDensity = resources
      ? (resources.mental_health_providers / state.population) * 100000
      : 75;
    const psychiatristDensity = resources ? (resources.psychiatrists / state.population) * 100000 : 12;
    const treatmentIndex = clamp((state.treatment_access - 30) / 20, 0.2, 1.25);
    const policyScore = round(
      clamp(38 + providerDensity * 0.16 + psychiatristDensity * 0.45 + treatmentIndex * 14 + yearOffset * 0.9, 35, 96),
      1
    );
    const populationMillions = state.population / 1_000_000;

    const mhbgAllotmentMillions = round(
      (1.35 + populationMillions * 0.68 + needIndex * 2.2 + treatmentIndex * 0.6) * federalGrowth,
      2
    );
    const modeledFederalMentalHealthFundingMillions = round(
      mhbgAllotmentMillions * (1.85 + needIndex * 0.18 + treatmentIndex * 0.08),
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
      populationMillions * (155 + needIndex * 78 + policyScore * 1.15) * spendingGrowth,
      2
    );
    const publicMhSpendingMillions = officialUrs?.total_smha_expenditures_millions ?? modeledPublicMhSpendingMillions;
    const officialFundingTotalMillions = officialUrs?.funding_total_millions ?? 0;

    const modeledMedicaidShare = round(
      clamp(29 + needIndex * 11 + treatmentIndex * 8 + yearOffset * 1.25, 28, 68),
      1
    );
    const modeledStateShare = round(clamp(30 + (1.2 - needIndex) * 8 + treatmentIndex * 6 - yearOffset * 0.35, 16, 42), 1);
    const modeledOtherFederalShare = round(clamp(12 + federalMentalHealthFundingMillions / publicMhSpendingMillions * 18, 10, 28), 1);
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

    const medicaidEnrollmentRate = clamp(0.12 + needIndex * 0.055 + yearOffset * 0.004, 0.11, 0.37);
    const medicaidEnrollment = Math.round(state.population * medicaidEnrollmentRate);
    const modeledMedicaidExpenditurePerEnrollee = round(
      clamp(6200 + needIndex * 780 + policyScore * 26 + yearOffset * 285, 5500, 14500),
      0
    );
    const medicaidTotalExpendituresMillions =
      officialCms?.total_net_expenditures_millions ?? round((medicaidEnrollment * modeledMedicaidExpenditurePerEnrollee) / 1_000_000, 2);
    const medicaidExpenditurePerEnrollee = round((medicaidTotalExpendituresMillions * 1_000_000) / medicaidEnrollment, 0);
    const financingDataStatus = officialMhbg || officialCms || officialUrs ? "partially_official" : "modeled";

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
    };
  });
});

export const getStateFinancingRecord = (abbreviation: string, year: FinancingYear) =>
  stateFinancingData.find((entry) => entry.abbreviation === abbreviation && entry.year === year);

export const getStateFinancingByYear = (year: FinancingYear) =>
  stateFinancingData.filter((entry) => entry.year === year);

export const getFinancingMetricValue = (record: StateFinancingRecord, metric: FinancingMetric) => record[metric];

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

    return {
      year,
      mhbg_allotment_millions: round(totalMhbg, 1),
      federal_mental_health_funding_millions: round(totalFederal, 1),
      public_mh_spending_millions: round(totalPublic, 1),
      medicaid_total_expenditures_billions: round(totalMedicaid / 1000, 2),
      medicaid_share_of_public_mh: round(
        rows.reduce((sum, row) => sum + row.medicaid_share_of_public_mh, 0) / rows.length,
        1
      ),
      medicaid_expenditure_per_enrollee: round(totalMedicaid * 1_000_000 / totalEnrollment, 0),
      behavioral_health_policy_score: round(
        rows.reduce((sum, row) => sum + row.behavioral_health_policy_score, 0) / rows.length,
        1
      ),
    };
  });
