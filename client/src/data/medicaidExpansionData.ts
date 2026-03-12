import { stateData } from "./stateData";

export const MEDICAID_EXPANSION_YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024] as const;
export type MedicaidExpansionYear = (typeof MEDICAID_EXPANSION_YEARS)[number];
export type MedicaidExpansionStatus = 0 | 1;
export type MedicaidExpansionLabel = "Expansion" | "Non-expansion";

export interface MedicaidExpansionRecord {
  state: string;
  abbreviation: string;
  year: MedicaidExpansionYear;
  medicaid_expansion_status: MedicaidExpansionStatus;
  medicaid_expansion_label: MedicaidExpansionLabel;
  first_full_expansion_year: MedicaidExpansionYear | null;
}

// Annual state status is aligned to the first full calendar year in which expansion was broadly in effect.
const firstFullExpansionYearByState: Partial<Record<string, MedicaidExpansionYear>> = {
  AK: 2016,
  AR: 2016,
  AZ: 2016,
  CA: 2016,
  CO: 2016,
  CT: 2016,
  DE: 2016,
  HI: 2016,
  IA: 2016,
  ID: 2020,
  IL: 2016,
  IN: 2016,
  KY: 2016,
  LA: 2017,
  MA: 2016,
  MD: 2016,
  ME: 2019,
  MI: 2016,
  MN: 2016,
  MO: 2022,
  MT: 2016,
  NC: 2024,
  ND: 2016,
  NE: 2021,
  NH: 2016,
  NJ: 2016,
  NM: 2016,
  NV: 2016,
  NY: 2016,
  OH: 2016,
  OK: 2022,
  OR: 2016,
  PA: 2016,
  RI: 2016,
  SD: 2024,
  UT: 2020,
  VA: 2019,
  VT: 2016,
  WA: 2016,
  WV: 2016,
};

const uniqueStates = stateData.filter(
  (state, index, records) => records.findIndex((candidate) => candidate.abbreviation === state.abbreviation) === index
);

export const medicaidExpansionData: MedicaidExpansionRecord[] = MEDICAID_EXPANSION_YEARS.flatMap((year) =>
  uniqueStates.map((state) => {
    const firstFullExpansionYear = firstFullExpansionYearByState[state.abbreviation] ?? null;
    const medicaidExpansionStatus: MedicaidExpansionStatus =
      firstFullExpansionYear !== null && year >= firstFullExpansionYear ? 1 : 0;

    return {
      state: state.state,
      abbreviation: state.abbreviation,
      year,
      medicaid_expansion_status: medicaidExpansionStatus,
      medicaid_expansion_label: medicaidExpansionStatus ? "Expansion" : "Non-expansion",
      first_full_expansion_year: firstFullExpansionYear,
    };
  })
);

const expansionByStateYear = new Map(
  medicaidExpansionData.map((record) => [`${record.abbreviation}-${record.year}`, record] as const)
);

export const getMedicaidExpansionRecord = (abbreviation: string, year: MedicaidExpansionYear) =>
  expansionByStateYear.get(`${abbreviation}-${year}`);

export const getExpansionTransitionStates = () =>
  uniqueStates
    .map((state) => ({
      state: state.state,
      abbreviation: state.abbreviation,
      first_full_expansion_year: firstFullExpansionYearByState[state.abbreviation] ?? null,
    }))
    .filter(
      (state): state is { state: string; abbreviation: string; first_full_expansion_year: MedicaidExpansionYear } =>
        state.first_full_expansion_year !== null && state.first_full_expansion_year > 2016
    )
    .sort((left, right) =>
      left.first_full_expansion_year === right.first_full_expansion_year
        ? left.state.localeCompare(right.state)
        : left.first_full_expansion_year - right.first_full_expansion_year
    );
