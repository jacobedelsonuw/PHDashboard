// Auto-generated from official SAMHSA URS state report pages and PDFs
// This extraction is network-backed because the URS PDFs are fetched from the official SAMHSA state report pages at generation time.

export interface OfficialUrsFinancingRecord {
  state: string;
  sourceYear: number;
  community_mh_expenditures_millions: number;
  state_expenditures_from_state_sources_millions: number;
  total_smha_expenditures_millions: number;
  mhbg_millions: number;
  covid_relief_mhbg_millions?: number;
  arp_mhbg_millions?: number;
  bsca_mhbg_millions?: number;
  medicaid_millions: number;
  other_federal_millions: number;
  state_funds_millions: number;
  local_funds_millions: number;
  other_millions: number;
  funding_total_millions: number;
  admin_gap_millions?: number;
}

export type OfficialUrsFinancingByYear = Partial<Record<2021 | 2022 | 2023 | 2024, OfficialUrsFinancingRecord>>;

export const officialUrsFinancingByStateYear: Record<string, OfficialUrsFinancingByYear> = {
  AL: {
    "2021": {
      "state": "Alabama",
      "sourceYear": 2021,
      "community_mh_expenditures_millions": 296.11,
      "state_expenditures_from_state_sources_millions": 268.57,
      "total_smha_expenditures_millions": 391.34,
      "mhbg_millions": 10.68,
      "covid_relief_mhbg_millions": 0.0,
      "arp_mhbg_millions": 0.0,
      "bsca_mhbg_millions": 0.0,
      "medicaid_millions": 108.91,
      "other_federal_millions": 2.74,
      "state_funds_millions": 265.28,
      "local_funds_millions": 0.0,
      "other_millions": 2.74,
      "funding_total_millions": 387.63,
      "admin_gap_millions": 3.71
    }
  }
};
