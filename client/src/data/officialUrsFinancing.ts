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
  AK: {
    "2024": {
      "state": "Alaska",
      "sourceYear": 2024,
      "community_mh_expenditures_millions": 143.08,
      "state_expenditures_from_state_sources_millions": 54.33,
      "total_smha_expenditures_millions": 218.24,
      "mhbg_millions": 2.2,
      "covid_relief_mhbg_millions": 0.52,
      "arp_mhbg_millions": 1.64,
      "bsca_mhbg_millions": 0.0,
      "medicaid_millions": 141.52,
      "other_federal_millions": 2.86,
      "state_funds_millions": 44.84,
      "local_funds_millions": 0.0,
      "other_millions": 0.0,
      "funding_total_millions": 193.58,
      "admin_gap_millions": 24.66
    }
  },
  AL: {
    "2024": {
      "state": "Alabama",
      "sourceYear": 2024,
      "community_mh_expenditures_millions": 581.23,
      "state_expenditures_from_state_sources_millions": 530.8,
      "total_smha_expenditures_millions": 685.17,
      "mhbg_millions": 9.94,
      "covid_relief_mhbg_millions": 0.25,
      "arp_mhbg_millions": 0.25,
      "bsca_mhbg_millions": 0.0,
      "medicaid_millions": 136.35,
      "other_federal_millions": 6.31,
      "state_funds_millions": 525.33,
      "local_funds_millions": 0.0,
      "other_millions": 0.0,
      "funding_total_millions": 678.43,
      "admin_gap_millions": 6.74
    }
  },
  AR: {
    "2024": {
      "state": "Arkansas",
      "sourceYear": 2024,
      "community_mh_expenditures_millions": 64.9,
      "state_expenditures_from_state_sources_millions": 72.63,
      "total_smha_expenditures_millions": 120.15,
      "mhbg_millions": 6.64,
      "covid_relief_mhbg_millions": 3.05,
      "arp_mhbg_millions": 2.76,
      "bsca_mhbg_millions": 0.0,
      "medicaid_millions": 29.21,
      "other_federal_millions": 2.76,
      "state_funds_millions": 71.63,
      "local_funds_millions": 0.58,
      "other_millions": 0.0,
      "funding_total_millions": 118.83,
      "admin_gap_millions": 1.32
    }
  },
  AZ: {
    "2024": {
      "state": "Arizona",
      "sourceYear": 2024,
      "community_mh_expenditures_millions": 247.6,
      "state_expenditures_from_state_sources_millions": 113.35,
      "total_smha_expenditures_millions": 343.23,
      "mhbg_millions": 24.19,
      "covid_relief_mhbg_millions": 1.47,
      "arp_mhbg_millions": 1.17,
      "bsca_mhbg_millions": 0.24,
      "medicaid_millions": 178.59,
      "other_federal_millions": 2.44,
      "state_funds_millions": 113.36,
      "local_funds_millions": 17.38,
      "other_millions": 0.0,
      "funding_total_millions": 341.76,
      "admin_gap_millions": 1.47
    }
  },
  CA: {
    "2024": {
      "state": "California",
      "sourceYear": 2024,
      "community_mh_expenditures_millions": 5973.28,
      "state_expenditures_from_state_sources_millions": 2167.36,
      "total_smha_expenditures_millions": 8957.04,
      "mhbg_millions": 102.63,
      "covid_relief_mhbg_millions": 35.16,
      "arp_mhbg_millions": 44.96,
      "bsca_mhbg_millions": 0.0,
      "medicaid_millions": 5060.91,
      "other_federal_millions": 11.35,
      "state_funds_millions": 2167.36,
      "local_funds_millions": 673.01,
      "other_millions": 0.0,
      "funding_total_millions": 8336.21,
      "admin_gap_millions": 620.83
    }
  },
  CO: {
    "2024": {
      "state": "Colorado",
      "sourceYear": 2024,
      "community_mh_expenditures_millions": 160.97,
      "state_expenditures_from_state_sources_millions": 160.3,
      "total_smha_expenditures_millions": 395.42,
      "mhbg_millions": 19.03,
      "covid_relief_mhbg_millions": 4.05,
      "arp_mhbg_millions": 3.51,
      "bsca_mhbg_millions": 0.23,
      "medicaid_millions": 8.64,
      "other_federal_millions": 194.48,
      "state_funds_millions": 158.18,
      "local_funds_millions": 0.0,
      "other_millions": 0.0,
      "funding_total_millions": 391.3,
      "admin_gap_millions": 4.12
    }
  },
  CT: {
    "2024": {
      "state": "Connecticut",
      "sourceYear": 2024,
      "community_mh_expenditures_millions": 772.65,
      "state_expenditures_from_state_sources_millions": 911.08,
      "total_smha_expenditures_millions": 1177.52,
      "mhbg_millions": 8.95,
      "covid_relief_mhbg_millions": 0.08,
      "arp_mhbg_millions": 3.41,
      "bsca_mhbg_millions": 0.38,
      "medicaid_millions": 155.42,
      "other_federal_millions": 69.71,
      "state_funds_millions": 866.92,
      "local_funds_millions": 0.0,
      "other_millions": 0.0,
      "funding_total_millions": 1114.93,
      "admin_gap_millions": 62.59
    }
  },
  DE: {
    "2024": {
      "state": "Delaware",
      "sourceYear": 2024,
      "community_mh_expenditures_millions": 98.66,
      "state_expenditures_from_state_sources_millions": 113.41,
      "total_smha_expenditures_millions": 169.33,
      "mhbg_millions": 1.7,
      "covid_relief_mhbg_millions": 1.31,
      "arp_mhbg_millions": 1.02,
      "bsca_mhbg_millions": 0.0,
      "medicaid_millions": 33.6,
      "other_federal_millions": 3.79,
      "state_funds_millions": 95.77,
      "local_funds_millions": 0.07,
      "other_millions": 0.0,
      "funding_total_millions": 137.27,
      "admin_gap_millions": 32.06
    }
  },
  FL: {
    "2024": {
      "state": "Florida",
      "sourceYear": 2024,
      "community_mh_expenditures_millions": 595.39,
      "state_expenditures_from_state_sources_millions": 997.71,
      "total_smha_expenditures_millions": 1220.08,
      "mhbg_millions": 44.93,
      "covid_relief_mhbg_millions": 0.0,
      "arp_mhbg_millions": 40.12,
      "bsca_mhbg_millions": 2.23,
      "medicaid_millions": 0.0,
      "other_federal_millions": 126.93,
      "state_funds_millions": 961.95,
      "local_funds_millions": 0.0,
      "other_millions": 0.0,
      "funding_total_millions": 1176.16,
      "admin_gap_millions": 43.92
    }
  },
  GA: {
    "2024": {
      "state": "Georgia",
      "sourceYear": 2024,
      "community_mh_expenditures_millions": 631.74,
      "state_expenditures_from_state_sources_millions": 922.39,
      "total_smha_expenditures_millions": 1000.98,
      "mhbg_millions": 31.07,
      "covid_relief_mhbg_millions": 2.42,
      "arp_mhbg_millions": 6.93,
      "bsca_mhbg_millions": 0.0,
      "medicaid_millions": 28.34,
      "other_federal_millions": 6.23,
      "state_funds_millions": 876.96,
      "local_funds_millions": 0.0,
      "other_millions": 0.0,
      "funding_total_millions": 954.23,
      "admin_gap_millions": 46.75
    }
  },
  HI: {
    "2024": {
      "state": "Hawaii",
      "sourceYear": 2024,
      "community_mh_expenditures_millions": 100.2,
      "state_expenditures_from_state_sources_millions": 207.68,
      "total_smha_expenditures_millions": 234.52,
      "mhbg_millions": 1.77,
      "covid_relief_mhbg_millions": 2.2,
      "arp_mhbg_millions": 0.71,
      "bsca_mhbg_millions": 0.01,
      "medicaid_millions": 1.95,
      "other_federal_millions": 9.73,
      "state_funds_millions": 184.82,
      "local_funds_millions": 0.0,
      "other_millions": 0.0,
      "funding_total_millions": 201.18,
      "admin_gap_millions": 33.34
    }
  },
  IA: {
    "2024": {
      "state": "Iowa",
      "sourceYear": 2024,
      "community_mh_expenditures_millions": 1134.5,
      "state_expenditures_from_state_sources_millions": 45.54,
      "total_smha_expenditures_millions": 1302.02,
      "mhbg_millions": 6.4,
      "covid_relief_mhbg_millions": 0.27,
      "arp_mhbg_millions": 5.18,
      "bsca_mhbg_millions": 0.01,
      "medicaid_millions": 995.97,
      "other_federal_millions": 11.92,
      "state_funds_millions": 45.54,
      "local_funds_millions": 116.81,
      "other_millions": 0.0,
      "funding_total_millions": 1182.09,
      "admin_gap_millions": 119.93
    }
  },
  ID: {
    "2024": {
      "state": "Idaho",
      "sourceYear": 2024,
      "community_mh_expenditures_millions": 60.54,
      "state_expenditures_from_state_sources_millions": 94.16,
      "total_smha_expenditures_millions": 122.66,
      "mhbg_millions": 1.32,
      "covid_relief_mhbg_millions": 2.23,
      "arp_mhbg_millions": 1.66,
      "bsca_mhbg_millions": 0.0,
      "medicaid_millions": 5.64,
      "other_federal_millions": 15.16,
      "state_funds_millions": 93.48,
      "local_funds_millions": 0.0,
      "other_millions": 0.0,
      "funding_total_millions": 120.9,
      "admin_gap_millions": 1.76
    }
  },
  IL: {
    "2024": {
      "state": "Illinois",
      "sourceYear": 2024,
      "community_mh_expenditures_millions": 806.06,
      "state_expenditures_from_state_sources_millions": 542.29,
      "total_smha_expenditures_millions": 1128.11,
      "mhbg_millions": 26.1,
      "covid_relief_mhbg_millions": 7.5,
      "arp_mhbg_millions": 11.68,
      "bsca_mhbg_millions": 1.01,
      "medicaid_millions": 470.7,
      "other_federal_millions": 21.04,
      "state_funds_millions": 525.55,
      "local_funds_millions": 0.0,
      "other_millions": 0.0,
      "funding_total_millions": 1107.96,
      "admin_gap_millions": 20.15
    }
  },
  KS: {
    "2024": {
      "state": "Kansas",
      "sourceYear": 2024,
      "community_mh_expenditures_millions": 581.57,
      "state_expenditures_from_state_sources_millions": 270.87,
      "total_smha_expenditures_millions": 769.92,
      "mhbg_millions": 7.18,
      "covid_relief_mhbg_millions": 1.03,
      "arp_mhbg_millions": 2.72,
      "bsca_mhbg_millions": 0.0,
      "medicaid_millions": 471.52,
      "other_federal_millions": 13.12,
      "state_funds_millions": 267.8,
      "local_funds_millions": 1.25,
      "other_millions": 0.0,
      "funding_total_millions": 764.85,
      "admin_gap_millions": 5.07
    }
  },
  KY: {
    "2024": {
      "state": "Kentucky",
      "sourceYear": 2024,
      "community_mh_expenditures_millions": 97.24,
      "state_expenditures_from_state_sources_millions": 167.16,
      "total_smha_expenditures_millions": 274.76,
      "mhbg_millions": 11.25,
      "covid_relief_mhbg_millions": 3.26,
      "arp_mhbg_millions": 4.6,
      "bsca_mhbg_millions": 0.46,
      "medicaid_millions": 59.23,
      "other_federal_millions": 21.64,
      "state_funds_millions": 149.84,
      "local_funds_millions": 3.03,
      "other_millions": 0.0,
      "funding_total_millions": 255.78,
      "admin_gap_millions": 18.98
    }
  },
  LA: {
    "2024": {
      "state": "Louisiana",
      "sourceYear": 2024,
      "community_mh_expenditures_millions": 484.53,
      "state_expenditures_from_state_sources_millions": 224.27,
      "total_smha_expenditures_millions": 999.29,
      "mhbg_millions": 10.84,
      "covid_relief_mhbg_millions": 4.3,
      "arp_mhbg_millions": 2.17,
      "bsca_mhbg_millions": 0.08,
      "medicaid_millions": 470.13,
      "other_federal_millions": 5.52,
      "state_funds_millions": 213.39,
      "local_funds_millions": 0.0,
      "other_millions": 0.0,
      "funding_total_millions": 708.51,
      "admin_gap_millions": 290.78
    }
  },
  MA: {
    "2024": {
      "state": "Massachusetts",
      "sourceYear": 2024,
      "community_mh_expenditures_millions": 883.04,
      "state_expenditures_from_state_sources_millions": 1137.45,
      "total_smha_expenditures_millions": 1194.84,
      "mhbg_millions": 18.93,
      "covid_relief_mhbg_millions": 4.7,
      "arp_mhbg_millions": 7.63,
      "bsca_mhbg_millions": 0.13,
      "medicaid_millions": 0.0,
      "other_federal_millions": 5.85,
      "state_funds_millions": 1103.81,
      "local_funds_millions": 0.0,
      "other_millions": 0.0,
      "funding_total_millions": 1157.38,
      "admin_gap_millions": 37.46
    }
  },
  MD: {
    "2024": {
      "state": "Maryland",
      "sourceYear": 2024,
      "community_mh_expenditures_millions": 242.92,
      "state_expenditures_from_state_sources_millions": 603.58,
      "total_smha_expenditures_millions": 644.2,
      "mhbg_millions": 12.66,
      "covid_relief_mhbg_millions": 2.81,
      "arp_mhbg_millions": 6.58,
      "bsca_mhbg_millions": 0.04,
      "medicaid_millions": 0.0,
      "other_federal_millions": 13.08,
      "state_funds_millions": 591.71,
      "local_funds_millions": 0.0,
      "other_millions": 0.0,
      "funding_total_millions": 628.66,
      "admin_gap_millions": 15.54
    }
  },
  ME: {
    "2024": {
      "state": "Maine",
      "sourceYear": 2024,
      "community_mh_expenditures_millions": 153.49,
      "state_expenditures_from_state_sources_millions": 107.95,
      "total_smha_expenditures_millions": 252.69,
      "mhbg_millions": 3.12,
      "covid_relief_mhbg_millions": 0.85,
      "arp_mhbg_millions": 2.38,
      "bsca_mhbg_millions": 0.23,
      "medicaid_millions": 121.76,
      "other_federal_millions": 15.42,
      "state_funds_millions": 94.57,
      "local_funds_millions": 0.0,
      "other_millions": 0.0,
      "funding_total_millions": 238.34,
      "admin_gap_millions": 14.35
    }
  },
  MI: {
    "2024": {
      "state": "Michigan",
      "sourceYear": 2024,
      "community_mh_expenditures_millions": 6.95,
      "state_expenditures_from_state_sources_millions": 275.73,
      "total_smha_expenditures_millions": 346.97,
      "mhbg_millions": 3.99,
      "covid_relief_mhbg_millions": 2.06,
      "arp_mhbg_millions": 0.78,
      "bsca_mhbg_millions": 0.0,
      "medicaid_millions": 26.26,
      "other_federal_millions": 0.0,
      "state_funds_millions": 275.73,
      "local_funds_millions": 18.33,
      "other_millions": 0.0,
      "funding_total_millions": 345.81,
      "admin_gap_millions": 1.16
    }
  },
  MN: {
    "2024": {
      "state": "Minnesota",
      "sourceYear": 2024,
      "community_mh_expenditures_millions": 1828.21,
      "state_expenditures_from_state_sources_millions": 335.76,
      "total_smha_expenditures_millions": 2028.37,
      "mhbg_millions": 15.41,
      "covid_relief_mhbg_millions": 3.69,
      "arp_mhbg_millions": 4.84,
      "bsca_mhbg_millions": 0.73,
      "medicaid_millions": 1460.42,
      "other_federal_millions": 86.2,
      "state_funds_millions": 335.76,
      "local_funds_millions": 56.64,
      "other_millions": 0.0,
      "funding_total_millions": 2027.65,
      "admin_gap_millions": 0.72
    }
  },
  MO: {
    "2024": {
      "state": "Missouri",
      "sourceYear": 2024,
      "community_mh_expenditures_millions": 785.61,
      "state_expenditures_from_state_sources_millions": 355.03,
      "total_smha_expenditures_millions": 1070.18,
      "mhbg_millions": 18.37,
      "covid_relief_mhbg_millions": 0.32,
      "arp_mhbg_millions": 5.95,
      "bsca_mhbg_millions": 0.83,
      "medicaid_millions": 562.23,
      "other_federal_millions": 126.1,
      "state_funds_millions": 353.78,
      "local_funds_millions": 0.0,
      "other_millions": 0.0,
      "funding_total_millions": 1067.59,
      "admin_gap_millions": 2.59
    }
  },
  MS: {
    "2024": {
      "state": "Mississippi",
      "sourceYear": 2024,
      "community_mh_expenditures_millions": 145.31,
      "state_expenditures_from_state_sources_millions": 116.56,
      "total_smha_expenditures_millions": 269.27,
      "mhbg_millions": 6.39,
      "covid_relief_mhbg_millions": 2.7,
      "arp_mhbg_millions": 1.24,
      "bsca_mhbg_millions": 0.02,
      "medicaid_millions": 74.06,
      "other_federal_millions": 6.04,
      "state_funds_millions": 111.98,
      "local_funds_millions": 0.0,
      "other_millions": 0.0,
      "funding_total_millions": 260.3,
      "admin_gap_millions": 8.97
    }
  },
  MT: {
    "2024": {
      "state": "Montana",
      "sourceYear": 2024,
      "community_mh_expenditures_millions": 258.33,
      "state_expenditures_from_state_sources_millions": 113.43,
      "total_smha_expenditures_millions": 362.05,
      "mhbg_millions": 1.39,
      "covid_relief_mhbg_millions": 0.1,
      "arp_mhbg_millions": 1.27,
      "bsca_mhbg_millions": 0.02,
      "medicaid_millions": 232.22,
      "other_federal_millions": 0.3,
      "state_funds_millions": 111.67,
      "local_funds_millions": 0.0,
      "other_millions": 0.0,
      "funding_total_millions": 346.97,
      "admin_gap_millions": 15.08
    }
  },
  NC: {
    "2024": {
      "state": "North Carolina",
      "sourceYear": 2024,
      "community_mh_expenditures_millions": 934.09,
      "state_expenditures_from_state_sources_millions": 276.12,
      "total_smha_expenditures_millions": 1385.26,
      "mhbg_millions": 8.34,
      "covid_relief_mhbg_millions": 5.17,
      "arp_mhbg_millions": 4.34,
      "bsca_mhbg_millions": 0.36,
      "medicaid_millions": 924.73,
      "other_federal_millions": 21.45,
      "state_funds_millions": 246.39,
      "local_funds_millions": 0.0,
      "other_millions": 0.0,
      "funding_total_millions": 1212.7,
      "admin_gap_millions": 172.56
    }
  },
  ND: {
    "2024": {
      "state": "North Dakota",
      "sourceYear": 2024,
      "community_mh_expenditures_millions": 90.47,
      "state_expenditures_from_state_sources_millions": 117.16,
      "total_smha_expenditures_millions": 146.43,
      "mhbg_millions": 1.63,
      "covid_relief_mhbg_millions": 0.75,
      "arp_mhbg_millions": 0.04,
      "bsca_mhbg_millions": 0.0,
      "medicaid_millions": 7.57,
      "other_federal_millions": 7.61,
      "state_funds_millions": 113.73,
      "local_funds_millions": 0.0,
      "other_millions": 0.0,
      "funding_total_millions": 142.96,
      "admin_gap_millions": 3.47
    }
  },
  NE: {
    "2024": {
      "state": "Nebraska",
      "sourceYear": 2024,
      "community_mh_expenditures_millions": 247.64,
      "state_expenditures_from_state_sources_millions": 155.08,
      "total_smha_expenditures_millions": 355.89,
      "mhbg_millions": 3.07,
      "covid_relief_mhbg_millions": 0.25,
      "arp_mhbg_millions": 0.03,
      "bsca_mhbg_millions": 0.0,
      "medicaid_millions": 187.41,
      "other_federal_millions": 7.71,
      "state_funds_millions": 148.34,
      "local_funds_millions": 0.0,
      "other_millions": 0.0,
      "funding_total_millions": 346.81,
      "admin_gap_millions": 9.08
    }
  },
  NH: {
    "2024": {
      "state": "New Hampshire",
      "sourceYear": 2024,
      "community_mh_expenditures_millions": 288.98,
      "state_expenditures_from_state_sources_millions": 108.66,
      "total_smha_expenditures_millions": 397.34,
      "mhbg_millions": 2.4,
      "covid_relief_mhbg_millions": 0.99,
      "arp_mhbg_millions": 1.13,
      "bsca_mhbg_millions": 0.07,
      "medicaid_millions": 269.64,
      "other_federal_millions": 4.14,
      "state_funds_millions": 108.66,
      "local_funds_millions": 0.0,
      "other_millions": 0.0,
      "funding_total_millions": 397.15,
      "admin_gap_millions": 0.19
    }
  },
  NJ: {
    "2024": {
      "state": "New Jersey",
      "sourceYear": 2024,
      "community_mh_expenditures_millions": 1809.85,
      "state_expenditures_from_state_sources_millions": 967.76,
      "total_smha_expenditures_millions": 2265.15,
      "mhbg_millions": 22.75,
      "covid_relief_mhbg_millions": 4.45,
      "arp_mhbg_millions": 7.6,
      "bsca_mhbg_millions": 0.85,
      "medicaid_millions": 1251.3,
      "other_federal_millions": 5.01,
      "state_funds_millions": 952.63,
      "local_funds_millions": 0.0,
      "other_millions": 0.0,
      "funding_total_millions": 2244.99,
      "admin_gap_millions": 20.16
    }
  },
  NM: {
    "2024": {
      "state": "New Mexico",
      "sourceYear": 2024,
      "community_mh_expenditures_millions": 367.03,
      "state_expenditures_from_state_sources_millions": 56.32,
      "total_smha_expenditures_millions": 424.08,
      "mhbg_millions": 4.29,
      "covid_relief_mhbg_millions": 2.4,
      "arp_mhbg_millions": 0.0,
      "bsca_mhbg_millions": 0.0,
      "medicaid_millions": 341.21,
      "other_federal_millions": 10.09,
      "state_funds_millions": 56.32,
      "local_funds_millions": 0.0,
      "other_millions": 0.0,
      "funding_total_millions": 414.93,
      "admin_gap_millions": 9.15
    }
  },
  NV: {
    "2024": {
      "state": "Nevada",
      "sourceYear": 2024,
      "community_mh_expenditures_millions": 43.86,
      "state_expenditures_from_state_sources_millions": 113.61,
      "total_smha_expenditures_millions": 138.76,
      "mhbg_millions": 5.28,
      "covid_relief_mhbg_millions": 0.0,
      "arp_mhbg_millions": 0.12,
      "bsca_mhbg_millions": 0.0,
      "medicaid_millions": 8.41,
      "other_federal_millions": 2.59,
      "state_funds_millions": 84.18,
      "local_funds_millions": 0.0,
      "other_millions": 0.0,
      "funding_total_millions": 103.1,
      "admin_gap_millions": 35.66
    }
  },
  NY: {
    "2024": {
      "state": "New York",
      "sourceYear": 2024,
      "community_mh_expenditures_millions": 6120.39,
      "state_expenditures_from_state_sources_millions": 2397.49,
      "total_smha_expenditures_millions": 8537.39,
      "mhbg_millions": 43.12,
      "covid_relief_mhbg_millions": 0.0,
      "arp_mhbg_millions": 0.0,
      "bsca_mhbg_millions": 0.0,
      "medicaid_millions": 3879.8,
      "other_federal_millions": 695.1,
      "state_funds_millions": 2088.89,
      "local_funds_millions": 589.39,
      "other_millions": 0.0,
      "funding_total_millions": 8214.99,
      "admin_gap_millions": 322.4
    }
  },
  OH: {
    "2024": {
      "state": "Ohio",
      "sourceYear": 2024,
      "community_mh_expenditures_millions": 2641.37,
      "state_expenditures_from_state_sources_millions": 501.52,
      "total_smha_expenditures_millions": 2990.92,
      "mhbg_millions": 25.17,
      "covid_relief_mhbg_millions": 6.1,
      "arp_mhbg_millions": 9.2,
      "bsca_mhbg_millions": 0.54,
      "medicaid_millions": 2421.12,
      "other_federal_millions": 21.46,
      "state_funds_millions": 472.38,
      "local_funds_millions": 0.38,
      "other_millions": 0.0,
      "funding_total_millions": 2959.1,
      "admin_gap_millions": 31.82
    }
  },
  OK: {
    "2024": {
      "state": "Oklahoma",
      "sourceYear": 2024,
      "community_mh_expenditures_millions": 410.84,
      "state_expenditures_from_state_sources_millions": 342.09,
      "total_smha_expenditures_millions": 523.0,
      "mhbg_millions": 12.44,
      "covid_relief_mhbg_millions": 1.36,
      "arp_mhbg_millions": 5.01,
      "bsca_mhbg_millions": 0.18,
      "medicaid_millions": 146.69,
      "other_federal_millions": 14.41,
      "state_funds_millions": 342.09,
      "local_funds_millions": 0.0,
      "other_millions": 0.0,
      "funding_total_millions": 522.18,
      "admin_gap_millions": 0.82
    }
  },
  OR: {
    "2024": {
      "state": "Oregon",
      "sourceYear": 2024,
      "community_mh_expenditures_millions": 2126.79,
      "state_expenditures_from_state_sources_millions": 678.57,
      "total_smha_expenditures_millions": 2610.66,
      "mhbg_millions": 12.05,
      "covid_relief_mhbg_millions": 11.3,
      "arp_mhbg_millions": 3.05,
      "bsca_mhbg_millions": 0.0,
      "medicaid_millions": 1771.28,
      "other_federal_millions": 121.69,
      "state_funds_millions": 664.56,
      "local_funds_millions": 0.0,
      "other_millions": 0.0,
      "funding_total_millions": 2583.91,
      "admin_gap_millions": 26.75
    }
  },
  PA: {
    "2024": {
      "state": "Pennsylvania",
      "sourceYear": 2024,
      "community_mh_expenditures_millions": 4349.8,
      "state_expenditures_from_state_sources_millions": 1056.9,
      "total_smha_expenditures_millions": 5369.4,
      "mhbg_millions": 22.0,
      "covid_relief_mhbg_millions": 0.0,
      "arp_mhbg_millions": 2.04,
      "bsca_mhbg_millions": 2.73,
      "medicaid_millions": 3841.47,
      "other_federal_millions": 0.0,
      "state_funds_millions": 1028.77,
      "local_funds_millions": 12.29,
      "other_millions": 0.0,
      "funding_total_millions": 4909.3,
      "admin_gap_millions": 460.1
    }
  },
  RI: {
    "2024": {
      "state": "Rhode Island",
      "sourceYear": 2024,
      "community_mh_expenditures_millions": 64.09,
      "state_expenditures_from_state_sources_millions": 3.34,
      "total_smha_expenditures_millions": 112.04,
      "mhbg_millions": 3.2,
      "covid_relief_mhbg_millions": 0.7,
      "arp_mhbg_millions": 1.63,
      "bsca_mhbg_millions": 0.22,
      "medicaid_millions": 99.6,
      "other_federal_millions": 2.16,
      "state_funds_millions": 0.0,
      "local_funds_millions": 0.0,
      "other_millions": 0.0,
      "funding_total_millions": 107.5,
      "admin_gap_millions": 4.54
    }
  },
  SC: {
    "2024": {
      "state": "South Carolina",
      "sourceYear": 2024,
      "community_mh_expenditures_millions": 379.67,
      "state_expenditures_from_state_sources_millions": 362.45,
      "total_smha_expenditures_millions": 616.86,
      "mhbg_millions": 15.27,
      "covid_relief_mhbg_millions": 9.31,
      "arp_mhbg_millions": 5.56,
      "bsca_mhbg_millions": 0.96,
      "medicaid_millions": 116.89,
      "other_federal_millions": 51.91,
      "state_funds_millions": 314.15,
      "local_funds_millions": 5.36,
      "other_millions": 0.0,
      "funding_total_millions": 565.79,
      "admin_gap_millions": 51.07
    }
  },
  SD: {
    "2024": {
      "state": "South Dakota",
      "sourceYear": 2024,
      "community_mh_expenditures_millions": 57.94,
      "state_expenditures_from_state_sources_millions": 77.86,
      "total_smha_expenditures_millions": 120.69,
      "mhbg_millions": 1.94,
      "covid_relief_mhbg_millions": 7.6,
      "arp_mhbg_millions": 0.86,
      "bsca_mhbg_millions": 0.05,
      "medicaid_millions": 27.36,
      "other_federal_millions": 2.93,
      "state_funds_millions": 76.21,
      "local_funds_millions": 0.0,
      "other_millions": 0.0,
      "funding_total_millions": 118.58,
      "admin_gap_millions": 2.11
    }
  },
  TN: {
    "2024": {
      "state": "Tennessee",
      "sourceYear": 2024,
      "community_mh_expenditures_millions": 744.45,
      "state_expenditures_from_state_sources_millions": 346.72,
      "total_smha_expenditures_millions": 1091.64,
      "mhbg_millions": 19.07,
      "covid_relief_mhbg_millions": 0.29,
      "arp_mhbg_millions": 8.83,
      "bsca_mhbg_millions": 0.69,
      "medicaid_millions": 543.05,
      "other_federal_millions": 21.88,
      "state_funds_millions": 322.82,
      "local_funds_millions": 13.13,
      "other_millions": 0.0,
      "funding_total_millions": 932.1,
      "admin_gap_millions": 159.54
    }
  },
  TX: {
    "2024": {
      "state": "Texas",
      "sourceYear": 2024,
      "community_mh_expenditures_millions": 1033.91,
      "state_expenditures_from_state_sources_millions": 1384.57,
      "total_smha_expenditures_millions": 1631.96,
      "mhbg_millions": 76.58,
      "covid_relief_mhbg_millions": 9.06,
      "arp_mhbg_millions": 33.36,
      "bsca_mhbg_millions": 0.75,
      "medicaid_millions": 33.59,
      "other_federal_millions": 40.22,
      "state_funds_millions": 1376.92,
      "local_funds_millions": 0.0,
      "other_millions": 0.0,
      "funding_total_millions": 1611.81,
      "admin_gap_millions": 20.15
    }
  },
  UT: {
    "2024": {
      "state": "Utah",
      "sourceYear": 2024,
      "community_mh_expenditures_millions": 263.44,
      "state_expenditures_from_state_sources_millions": 121.42,
      "total_smha_expenditures_millions": 363.95,
      "mhbg_millions": 9.26,
      "covid_relief_mhbg_millions": 0.3,
      "arp_mhbg_millions": 0.87,
      "bsca_mhbg_millions": 0.43,
      "medicaid_millions": 186.27,
      "other_federal_millions": 10.63,
      "state_funds_millions": 120.38,
      "local_funds_millions": 7.71,
      "other_millions": 0.0,
      "funding_total_millions": 358.61,
      "admin_gap_millions": 5.34
    }
  },
  VA: {
    "2024": {
      "state": "Virginia",
      "sourceYear": 2024,
      "community_mh_expenditures_millions": 701.47,
      "state_expenditures_from_state_sources_millions": 1059.6,
      "total_smha_expenditures_millions": 1372.19,
      "mhbg_millions": 14.44,
      "covid_relief_mhbg_millions": 2.2,
      "arp_mhbg_millions": 3.54,
      "bsca_mhbg_millions": 0.17,
      "medicaid_millions": 254.51,
      "other_federal_millions": 23.53,
      "state_funds_millions": 946.51,
      "local_funds_millions": 0.0,
      "other_millions": 0.0,
      "funding_total_millions": 1248.8,
      "admin_gap_millions": 123.39
    }
  },
  VT: {
    "2024": {
      "state": "Vermont",
      "sourceYear": 2024,
      "community_mh_expenditures_millions": 257.05,
      "state_expenditures_from_state_sources_millions": 20.91,
      "total_smha_expenditures_millions": 300.3,
      "mhbg_millions": 0.64,
      "covid_relief_mhbg_millions": 0.35,
      "arp_mhbg_millions": 0.8,
      "bsca_mhbg_millions": 0.16,
      "medicaid_millions": 259.69,
      "other_federal_millions": 9.12,
      "state_funds_millions": 18.87,
      "local_funds_millions": 0.0,
      "other_millions": 0.0,
      "funding_total_millions": 289.69,
      "admin_gap_millions": 10.61
    }
  },
  WA: {
    "2024": {
      "state": "Washington",
      "sourceYear": 2024,
      "community_mh_expenditures_millions": 1392.32,
      "state_expenditures_from_state_sources_millions": 861.78,
      "total_smha_expenditures_millions": 2154.79,
      "mhbg_millions": 19.92,
      "covid_relief_mhbg_millions": 5.92,
      "arp_mhbg_millions": 5.74,
      "bsca_mhbg_millions": 0.86,
      "medicaid_millions": 1210.02,
      "other_federal_millions": 28.44,
      "state_funds_millions": 788.1,
      "local_funds_millions": 4.24,
      "other_millions": 0.0,
      "funding_total_millions": 2063.24,
      "admin_gap_millions": 91.55
    }
  },
  WI: {
    "2024": {
      "state": "Wisconsin",
      "sourceYear": 2024,
      "community_mh_expenditures_millions": 1325.65,
      "state_expenditures_from_state_sources_millions": 185.08,
      "total_smha_expenditures_millions": 1644.38,
      "mhbg_millions": 14.28,
      "covid_relief_mhbg_millions": 4.04,
      "arp_mhbg_millions": 7.11,
      "bsca_mhbg_millions": 0.87,
      "medicaid_millions": 804.17,
      "other_federal_millions": 2.33,
      "state_funds_millions": 185.08,
      "local_funds_millions": 523.26,
      "other_millions": 0.0,
      "funding_total_millions": 1541.16,
      "admin_gap_millions": 103.22
    }
  },
  WV: {
    "2024": {
      "state": "West Virginia",
      "sourceYear": 2024,
      "community_mh_expenditures_millions": 86.98,
      "state_expenditures_from_state_sources_millions": 183.25,
      "total_smha_expenditures_millions": 267.0,
      "mhbg_millions": 3.49,
      "covid_relief_mhbg_millions": 1.45,
      "arp_mhbg_millions": 2.94,
      "bsca_mhbg_millions": 0.57,
      "medicaid_millions": 38.56,
      "other_federal_millions": 31.93,
      "state_funds_millions": 182.9,
      "local_funds_millions": 0.0,
      "other_millions": 0.0,
      "funding_total_millions": 265.93,
      "admin_gap_millions": 1.07
    }
  },
  WY: {
    "2024": {
      "state": "Wyoming",
      "sourceYear": 2024,
      "community_mh_expenditures_millions": 22.82,
      "state_expenditures_from_state_sources_millions": 32.33,
      "total_smha_expenditures_millions": 35.7,
      "mhbg_millions": 1.04,
      "covid_relief_mhbg_millions": 0.0,
      "arp_mhbg_millions": 2.05,
      "bsca_mhbg_millions": 0.0,
      "medicaid_millions": 0.0,
      "other_federal_millions": 0.0,
      "state_funds_millions": 31.41,
      "local_funds_millions": 0.18,
      "other_millions": 0.0,
      "funding_total_millions": 34.69,
      "admin_gap_millions": 1.01
    }
  }
};
