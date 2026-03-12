export type SourceTier = "official" | "mixed" | "modeled";

export interface CitationLink {
  title: string;
  href: string;
  description: string;
}

export interface MetricProvenance {
  metric: string;
  label: string;
  tier: SourceTier;
  status: string;
  notes: string;
  sources: string[];
}

export const citationLinks: CitationLink[] = [
  {
    title: "SAMHSA NSDUH 2023-2024 state-specific tables (HTML)",
    href: "https://www.samhsa.gov/data/sites/default/files/reports/rpt56986/2024-nsduh-sae-state-tabs1/2024-nsduh-sae-state-tabs.htm",
    description:
      "Direct state table export used to normalize official state percentages and estimated totals for core burden metrics in this dashboard.",
  },
  {
    title: "SAMHSA NSDUH State Releases (2023-2024)",
    href: "https://www.samhsa.gov/data/data-we-collect/nsduh-national-survey-drug-use-and-health/state-releases/2023-2024",
    description:
      "Primary official state small-area estimates for AMI, SMI, major depressive episode, some suicidality, and related NSDUH measures.",
  },
  {
    title: "SAMHSA 2023-2024 NSDUH state prevalence tables",
    href: "https://www.samhsa.gov/data/report/2023-2024-nsduh-state-prevalence-estimates",
    description:
      "Published state prevalence release used to anchor official burden measures in the dashboard.",
  },
  {
    title: "SAMHSA 2023-2024 NSDUH state estimated totals",
    href: "https://www.samhsa.gov/data/report/2023-2024-nsduh-state-estimated-totals",
    description:
      "Published state estimated totals release used for count-based burden comparisons.",
  },
  {
    title: "CDC NCHS Data Brief No. 541",
    href: "https://www.cdc.gov/nchs/products/databriefs/db541.htm",
    description:
      "Final 2023 age-adjusted suicide rates and deaths by state used for the dashboard suicide layer.",
  },
  {
    title: "HRSA Area Health Resources Files",
    href: "https://data.hrsa.gov/data/download?data=AHRF",
    description:
      "Official workforce source used for psychiatrists, clinical psychologists, mental health counselors, and mental health social workers.",
  },
  {
    title: "SAMHSA N-SUMHSS state profiles",
    href: "https://www.samhsa.gov/data/report/2023-n-sumhss-state-profiles",
    description:
      "Official treatment facility system source for state mental health treatment service capacity.",
  },
  {
    title: "CDC WONDER datasets",
    href: "https://wonder.cdc.gov/datasets.html",
    description:
      "Official CDC/NCHS mortality source for state suicide rates and related death measures.",
  },
  {
    title: "SAMHSA Community Mental Health Services Block Grant",
    href: "https://www.samhsa.gov/grants/block-grants/mhbg",
    description:
      "Primary federal block grant source for state and territory mental health allotments and annual MHBG program structure.",
  },
  {
    title: "SAMHSA Uniform Reporting System (URS) Output Tables",
    href: "https://www.samhsa.gov/data/evaluation-management-reporting/data/urs-output-tables",
    description:
      "Annual state mental health authority reporting framework used to characterize public mental health system financing and service-system context.",
  },
  {
    title: "CMS State Budget & Expenditure Reporting for Medicaid and CHIP",
    href: "https://www.medicaid.gov/medicaid/financial-management/state-expenditure-reporting-medicaid-chip",
    description:
      "Official CMS MBES/CBES and CMS-64 reporting context for state Medicaid expenditure and financing flows.",
  },
  {
    title: "KFF Medicaid Budget Survey Archives",
    href: "https://www.kff.org/medicaid/50-state-medicaid-budget-survey-archives/",
    description:
      "Annual survey archive used for contextual interpretation of state Medicaid spending, enrollment, and policy changes.",
  },
  {
    title: "KFF Medicaid Coverage of Behavioral Health Services in 2022",
    href: "https://www.kff.org/mental-health/medicaid-coverage-of-behavioral-health-services-in-2022-findings-from-a-survey-of-state-medicaid-programs/",
    description:
      "Behavioral health service coverage survey used as policy-context supplementation for state Medicaid behavioral health environments.",
  },
];

export const metricProvenance: MetricProvenance[] = [
  {
    metric: "ami",
    label: "Any Mental Illness",
    tier: "official",
    status: "Integrated from SAMHSA NSDUH 2023-2024 state small-area estimates.",
    notes: "State percentages and totals now come from the official SAMHSA state-specific tables; per-100k is derived from official totals and state population.",
    sources: ["SAMHSA NSDUH 2023-2024 state-specific tables (HTML)", "SAMHSA NSDUH State Releases (2023-2024)"],
  },
  {
    metric: "smi",
    label: "Serious Mental Illness",
    tier: "official",
    status: "Integrated from SAMHSA NSDUH 2023-2024 state small-area estimates.",
    notes: "State percentages and totals now come from the official SAMHSA state-specific tables; per-100k is derived from official totals and state population.",
    sources: ["SAMHSA NSDUH 2023-2024 state-specific tables (HTML)", "SAMHSA NSDUH State Releases (2023-2024)"],
  },
  {
    metric: "mde_adult",
    label: "Adult Major Depressive Episode",
    tier: "official",
    status: "Integrated from SAMHSA NSDUH 2023-2024 state small-area estimates.",
    notes: "Uses the official 18+ state prevalence and estimated total from the SAMHSA state-specific tables. This is the direct official adult depression measure available in NSDUH.",
    sources: ["SAMHSA NSDUH 2023-2024 state-specific tables (HTML)", "SAMHSA NSDUH State Releases (2023-2024)"],
  },
  {
    metric: "mde_youth",
    label: "Youth Major Depressive Episode",
    tier: "official",
    status: "Integrated from SAMHSA NSDUH 2023-2024 state small-area estimates.",
    notes: "Uses the official 12-17 state prevalence and estimated total from the SAMHSA state-specific tables.",
    sources: ["SAMHSA NSDUH 2023-2024 state-specific tables (HTML)", "SAMHSA NSDUH State Releases (2023-2024)"],
  },
  {
    metric: "suicide_rate",
    label: "Suicide Rate",
    tier: "official",
    status: "Integrated from CDC NCHS final 2023 state suicide mortality rates.",
    notes: "The dashboard now uses the CDC Data Brief No. 541 state table for age-adjusted suicide rates and deaths.",
    sources: ["CDC NCHS Data Brief No. 541", "CDC WONDER datasets"],
  },
  {
    metric: "anxiety_disorder",
    label: "Anxiety Disorders",
    tier: "mixed",
    status: "No single federal annual state table identified; requires research/modeled supplementation.",
    notes: "Likely needs a non-federal modeled source alongside official federal anchors.",
    sources: ["SAMHSA NSDUH State Releases (2023-2024)"],
  },
  {
    metric: "ptsd",
    label: "PTSD",
    tier: "mixed",
    status: "No single federal annual state table identified; requires research/modeled supplementation.",
    notes: "Direct official state prevalence source not yet identified.",
    sources: [],
  },
  {
    metric: "substance_use_disorder",
    label: "Substance Use Disorder",
    tier: "official",
    status: "Integrated from SAMHSA NSDUH 2023-2024 state small-area estimates.",
    notes: "Uses the official 12+ state prevalence and estimated total from the SAMHSA state-specific tables.",
    sources: ["SAMHSA NSDUH 2023-2024 state-specific tables (HTML)", "SAMHSA NSDUH State Releases (2023-2024)"],
  },
  {
    metric: "opioid_use_disorder",
    label: "Opioid Use Disorder",
    tier: "official",
    status: "Integrated from SAMHSA NSDUH 2023-2024 state small-area estimates.",
    notes: "Uses the official 12+ state prevalence and estimated total from the SAMHSA state-specific tables.",
    sources: ["SAMHSA NSDUH 2023-2024 state-specific tables (HTML)", "SAMHSA NSDUH State Releases (2023-2024)"],
  },
  {
    metric: "alcohol_use_disorder",
    label: "Alcohol Use Disorder",
    tier: "official",
    status: "Integrated from SAMHSA NSDUH 2023-2024 state small-area estimates.",
    notes: "Uses the official 12+ state prevalence and estimated total from the SAMHSA state-specific tables.",
    sources: ["SAMHSA NSDUH 2023-2024 state-specific tables (HTML)", "SAMHSA NSDUH State Releases (2023-2024)"],
  },
  {
    metric: "bipolar_disorder",
    label: "Bipolar Disorder",
    tier: "mixed",
    status: "No direct official annual state table identified.",
    notes: "Would require research/modeled source if retained in dashboard.",
    sources: [],
  },
  {
    metric: "schizophrenia",
    label: "Schizophrenia",
    tier: "mixed",
    status: "No direct official annual state table identified.",
    notes: "Would require research/modeled source if retained in dashboard.",
    sources: [],
  },
  {
    metric: "eating_disorder",
    label: "Eating Disorders",
    tier: "mixed",
    status: "No direct official annual state table identified.",
    notes: "Would require research/modeled source if retained in dashboard.",
    sources: [],
  },
  {
    metric: "adhd",
    label: "ADHD",
    tier: "mixed",
    status: "No direct official annual state table identified.",
    notes: "Would require research/modeled source if retained in dashboard.",
    sources: [],
  },
  {
    metric: "resource_capacity",
    label: "Mental Health Resource Capacity",
    tier: "official",
    status: "Integrated from HRSA AHRF workforce files and SAMHSA N-SUMHSS 2024 facility data.",
    notes: "Psychiatrists are aggregated from official AHRF county psychiatry counts; therapist and provider totals are derived from official HRSA mental health workforce fields; crisis-capable facility counts are derived from official SAMHSA crisis-service flags.",
    sources: ["HRSA Area Health Resources Files", "SAMHSA N-SUMHSS state profiles"],
  },
  {
    metric: "mental_health_financing",
    label: "Mental Health Financing",
    tier: "mixed",
    status: "Integrated as a mixed official/model state-year financing layer from 2016-2024 with direct SAMHSA MHBG, SAMHSA URS, and CMS Financial Management Report inputs where available.",
    notes: "The financing dashboard now incorporates direct SAMHSA MHBG HTML tables for FY2021-FY2023, direct SAMHSA URS state financing extracts for the extracted URS years, and direct CMS Financial Management Report Medicaid expenditure workbooks for the extracted CMS years. Remaining uncovered years, states not yet parsed from URS, and the KFF policy context layer still rely on harmonized modeling.",
    sources: [
      "SAMHSA Community Mental Health Services Block Grant",
      "SAMHSA Uniform Reporting System (URS) Output Tables",
      "CMS State Budget & Expenditure Reporting for Medicaid and CHIP",
      "KFF Medicaid Budget Survey Archives",
      "KFF Medicaid Coverage of Behavioral Health Services in 2022",
    ],
  },
];
