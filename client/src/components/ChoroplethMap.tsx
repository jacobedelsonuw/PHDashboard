import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { stateData, getStateResources, StateData } from "@/data/stateData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { feature } from "topojson-client";
import usAtlas from "us-atlas/states-10m.json";
import {
  FINANCING_METRICS,
  FINANCING_YEARS,
  FinancingMetric,
  financingMetricLabels,
  getFinancingMetricValue,
  getFinancingProvenanceSummary,
  getNeedFundingRegression,
  getFinancingSourceGapNote,
  getTypologySummaryByYear,
  getStateFinancingByYear,
  getStateFinancingRecord,
  getNationalFinancingTrend,
} from "@/data/stateFinancingData";
import { nationalTrendData } from "@/data/nationalTrendData";
import "leaflet/dist/leaflet.css";

interface ChoroplethMapProps {
  metric?: Metric;
}

const MENTAL_METRICS = [
  "ami",
  "smi",
  "mde_adult",
  "mde_youth",
  "suicide_rate",
  "anxiety_disorder",
  "ptsd",
  "substance_use_disorder",
  "opioid_use_disorder",
  "alcohol_use_disorder",
  "bipolar_disorder",
  "schizophrenia",
  "eating_disorder",
  "adhd",
] as const;

const RESOURCE_METRICS = [
  "providers_per_100k",
  "psychiatrists_per_100k",
  "therapists_per_100k",
  "crisis_centers_per_million",
] as const;
const GAP_METRIC = "burden_resource_gap" as const;
const NEED_FUNDING_GAP_METRIC = "funding_gap_per_capita" as const;
const TYPOLOGY_METRIC = "system_typology" as const;

type MentalMetric = (typeof MENTAL_METRICS)[number];
type ResourceMetric = (typeof RESOURCE_METRICS)[number];
type FinancingMetricKey = FinancingMetric;
type GapMetric = typeof GAP_METRIC;
type NeedFundingGapMetric = typeof NEED_FUNDING_GAP_METRIC;
type TypologyMetric = typeof TYPOLOGY_METRIC;
type Metric = MentalMetric | ResourceMetric | FinancingMetricKey | GapMetric | NeedFundingGapMetric | TypologyMetric;
type MetricGroup = "conditions" | "resources" | "financing" | "gap" | "needFunding" | "typology";
type TotalMetricKey =
  | "ami_total"
  | "smi_total"
  | "mde_adult_total"
  | "mde_youth_total"
  | "substance_use_disorder_total"
  | "opioid_use_disorder_total"
  | "alcohol_use_disorder_total";

const MENTAL_TREND_KEYS: Record<MentalMetric, keyof (typeof nationalTrendData)[number]> = {
  ami: "ami",
  smi: "smi",
  mde_adult: "ami",
  mde_youth: "mde_youth",
  suicide_rate: "suicide",
  anxiety_disorder: "ami",
  ptsd: "ami",
  substance_use_disorder: "ami",
  opioid_use_disorder: "ami",
  alcohol_use_disorder: "ami",
  bipolar_disorder: "ami",
  schizophrenia: "ami",
  eating_disorder: "ami",
  adhd: "ami",
};

const MENTAL_TREND_BASELINES: Record<keyof (typeof nationalTrendData)[number], number> = {
  year: 2024,
  ami: 23.4,
  smi: 5.6,
  mde_youth: 20.2,
  suicide: 14.5,
};
const FINANCING_DISPLAY_YEARS = FINANCING_YEARS.filter((year) => year >= 2020);

export default function ChoroplethMap({ metric = "ami" }: ChoroplethMapProps) {
  const [hoveredState, setHoveredState] = useState<StateData | null>(null);
  const [selectedState, setSelectedState] = useState<StateData | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<Metric>(metric);
  const [selectedYear, setSelectedYear] = useState<number>(nationalTrendData[nationalTrendData.length - 1].year);
  const [metricGroup, setMetricGroup] = useState<MetricGroup>(
    (RESOURCE_METRICS as readonly string[]).includes(metric)
      ? "resources"
      : (FINANCING_METRICS as readonly string[]).includes(metric)
        ? "financing"
        : metric === NEED_FUNDING_GAP_METRIC
          ? "needFunding"
          : metric === TYPOLOGY_METRIC
            ? "typology"
        : "conditions"
  );

  const metricLabels: Record<Metric, string> = {
    ami: "Any Mental Illness (%)",
    smi: "Serious Mental Illness (%)",
    mde_adult: "Adult Major Depressive Episode (%)",
    mde_youth: "Youth Depression (%)",
    suicide_rate: "Suicide Rate (per 100k)",
    anxiety_disorder: "Anxiety Disorders (%)",
    ptsd: "PTSD (%)",
    substance_use_disorder: "Substance Use Disorder (%)",
    opioid_use_disorder: "Opioid Use Disorder (%)",
    alcohol_use_disorder: "Alcohol Use Disorder (%)",
    bipolar_disorder: "Bipolar Disorder (%)",
    schizophrenia: "Schizophrenia (%)",
    eating_disorder: "Eating Disorders (%)",
    adhd: "ADHD (%)",
    providers_per_100k: "Mental Health Providers (per 100k)",
    psychiatrists_per_100k: "Psychiatrists (per 100k)",
    therapists_per_100k: "Therapists (per 100k)",
    crisis_centers_per_million: "Crisis-Capable Facilities (per 1M)",
    mhbg_per_capita: financingMetricLabels.mhbg_per_capita,
    federal_mental_health_funding_per_capita: financingMetricLabels.federal_mental_health_funding_per_capita,
    public_mh_spending_per_capita: financingMetricLabels.public_mh_spending_per_capita,
    medicaid_expenditure_per_enrollee: financingMetricLabels.medicaid_expenditure_per_enrollee,
    medicaid_share_of_public_mh: financingMetricLabels.medicaid_share_of_public_mh,
    behavioral_health_policy_score: financingMetricLabels.behavioral_health_policy_score,
    burden_resource_gap: "Burden-Resource Gap Index",
    funding_gap_per_capita: "Underfunded vs Overfunded Relative to Need",
    system_typology: "Mental Health System Typology",
  };

  const metricColors: Record<Metric, string> = {
    ami: "#8b5cf6",
    smi: "#f97316",
    mde_adult: "#c026d3",
    mde_youth: "#ec4899",
    suicide_rate: "#a855f7",
    anxiety_disorder: "#3b82f6",
    ptsd: "#10b981",
    substance_use_disorder: "#ef4444",
    opioid_use_disorder: "#f97316",
    alcohol_use_disorder: "#eab308",
    bipolar_disorder: "#a855f7",
    schizophrenia: "#ec4899",
    eating_disorder: "#6366f1",
    adhd: "#06b6d4",
    providers_per_100k: "#0ea5e9",
    psychiatrists_per_100k: "#0284c7",
    therapists_per_100k: "#06b6d4",
    crisis_centers_per_million: "#0891b2",
    mhbg_per_capita: "#2563eb",
    federal_mental_health_funding_per_capita: "#1d4ed8",
    public_mh_spending_per_capita: "#0f766e",
    medicaid_expenditure_per_enrollee: "#0e7490",
    medicaid_share_of_public_mh: "#0f766e",
    behavioral_health_policy_score: "#7c3aed",
    burden_resource_gap: "#dc2626",
    funding_gap_per_capita: "#1d4ed8",
    system_typology: "#7c3aed",
  };

  const stateByName = useMemo(
    () => new Map(stateData.map((state) => [state.state, state])),
    []
  );
  const usStatesGeoJSON = useMemo(
    () => feature(usAtlas as any, (usAtlas as any).objects.states) as any,
    []
  );
  const resourcesByAbbreviation = useMemo(
    () =>
      new Map(
        stateData
          .map((state) => {
            const resources = getStateResources(state.abbreviation);
            if (!resources) return null;
            return [state.abbreviation, resources] as const;
          })
          .filter(Boolean) as readonly (readonly [string, NonNullable<ReturnType<typeof getStateResources>>])[]
      ),
    []
  );
  const trendByYear = useMemo<Map<number, (typeof nationalTrendData)[number]>>(
    () => new Map(nationalTrendData.map((point) => [point.year, point])),
    []
  );
  const trendStartYear = nationalTrendData[0].year;
  const trendEndYear = nationalTrendData[nationalTrendData.length - 1].year;
  const yearProgress = (selectedYear - trendStartYear) / (trendEndYear - trendStartYear);
  const centeredYearProgress = yearProgress * 2 - 1;
  const activeYearOptions: number[] =
    metricGroup === "financing" || metricGroup === "needFunding" || metricGroup === "typology"
      ? [...FINANCING_DISPLAY_YEARS]
      : nationalTrendData.map((point) => point.year);
  const selectedTrendPoint = trendByYear.get(selectedYear) ?? nationalTrendData[nationalTrendData.length - 1];
  const selectedFinancingRows = useMemo(
    () => getStateFinancingByYear(selectedYear as (typeof FINANCING_YEARS)[number]),
    [selectedYear]
  );
  const financingByAbbreviation = useMemo(
    () => new Map(selectedFinancingRows.map((record) => [record.abbreviation, record])),
    [selectedFinancingRows]
  );
  const selectedFinancingCoverage = useMemo(
    () =>
      selectedFinancingRows.reduce(
        (summary, record) => {
          const provenance = getFinancingProvenanceSummary(record);
          summary.total += 1;
          summary[provenance.level] += 1;
          return summary;
        },
        {
          total: 0,
          official_urs: 0,
          official_cms_mhbg: 0,
          mixed_official: 0,
          modeled: 0,
        }
      ),
    [selectedFinancingRows]
  );
  const nationalFinancingTrend = useMemo(() => getNationalFinancingTrend(), []);
  const selectedNeedFundingRegression = useMemo(
    () => getNeedFundingRegression(selectedYear as (typeof FINANCING_YEARS)[number]),
    [selectedYear]
  );
  const selectedTypologySummary = useMemo(
    () => getTypologySummaryByYear(selectedYear as (typeof FINANCING_YEARS)[number]),
    [selectedYear]
  );
  const selectedFinancingRecord = selectedState
    ? getStateFinancingRecord(selectedState.abbreviation, selectedYear as (typeof FINANCING_YEARS)[number])
    : null;
  const selectedFinancingProvenance = selectedFinancingRecord ? getFinancingProvenanceSummary(selectedFinancingRecord) : null;
  const selectedFinancingGapNote = selectedState
    ? getFinancingSourceGapNote(selectedState.abbreviation, selectedYear as (typeof FINANCING_YEARS)[number])
    : undefined;
  const selectedFinancingTrend = useMemo(
    () =>
      selectedState
        ? FINANCING_YEARS.map((year) => getStateFinancingRecord(selectedState.abbreviation, year)).filter(Boolean)
        : [],
    [selectedState]
  );
  const fundingGapRange = useMemo(() => {
    const values = selectedFinancingRows.map((record) => record.funding_gap_per_capita);
    return { min: Math.min(...values), max: Math.max(...values) };
  }, [selectedFinancingRows]);
  const roundMetricValue = (metricKey: MentalMetric | ResourceMetric, value: number) =>
    metricKey === "suicide_rate" || metricKey === "crisis_centers_per_million"
      ? Math.round(value * 10) / 10
      : Math.round(value * 100) / 100;
  const rawMentalRangeByMetric = useMemo(() => {
    const ranges: Partial<Record<MentalMetric, { min: number; max: number }>> = {};
    MENTAL_METRICS.forEach((mentalMetric) => {
      const values = stateData.map((state) => state[mentalMetric]);
      ranges[mentalMetric] = { min: Math.min(...values), max: Math.max(...values) };
    });
    return ranges as Record<MentalMetric, { min: number; max: number }>;
  }, []);
  const getStateSignal = (state: StateData, channel: number) => {
    const seed =
      state.abbreviation.charCodeAt(0) * 31 +
      state.abbreviation.charCodeAt(1) * 17 +
      channel * 13;
    return {
      phase: ((seed % 360) * Math.PI) / 180,
      harmonic: 0.7 + ((Math.floor(seed / 3) % 5) * 0.15),
      amplitude: 0.025 + ((Math.floor(seed / 7) % 6) * 0.0075),
      drift: (((Math.floor(seed / 11) % 11) - 5) * 0.006),
    };
  };
  const getMentalAdjustment = (state: StateData, metricKey: MentalMetric) => {
    const trendKey = MENTAL_TREND_KEYS[metricKey];
    const nationalFactor = selectedTrendPoint[trendKey] / MENTAL_TREND_BASELINES[trendKey];
    const metricRange = rawMentalRangeByMetric[metricKey];
    const baselinePosition = normalize(state[metricKey], metricRange.min, metricRange.max) - 0.5;
    const signal = getStateSignal(state, MENTAL_METRICS.indexOf(metricKey) + 1);
    const oscillation = Math.sin(yearProgress * Math.PI * 2 * signal.harmonic + signal.phase) * signal.amplitude;
    const drift = centeredYearProgress * (signal.drift + baselinePosition * 0.07);
    const localFactor = Math.max(0.82, Math.min(1.2, 1 + oscillation + drift));
    return nationalFactor * localFactor;
  };
  const getResourceAdjustment = (state: StateData, metricKey: ResourceMetric) => {
    const nationalFactor = 0.74 + Math.max(0, Math.min(1, yearProgress)) * 0.26;
    const providers = resourcesByAbbreviation.get(state.abbreviation);
    const providerDensity = providers ? (providers.mental_health_providers / state.population) * 100000 : 0;
    const providerBias = normalize(providerDensity, 25, 240) - 0.5;
    const accessBias = normalize(state.treatment_access, 30, 55) - 0.5;
    const signal = getStateSignal(state, RESOURCE_METRICS.indexOf(metricKey) + 21);
    const oscillation = Math.cos(yearProgress * Math.PI * 2 * signal.harmonic + signal.phase) * signal.amplitude;
    const drift = centeredYearProgress * (signal.drift + providerBias * 0.08 + accessBias * 0.06);
    const localFactor = Math.max(0.78, Math.min(1.22, 1 + oscillation + drift));
    return nationalFactor * localFactor;
  };
  const getMetricValue = (state: StateData, metricKey: Metric): number => {
    if ((MENTAL_METRICS as readonly string[]).includes(metricKey)) {
      const typedMetric = metricKey as MentalMetric;
      return roundMetricValue(typedMetric, state[typedMetric] * getMentalAdjustment(state, typedMetric));
    }
    if ((FINANCING_METRICS as readonly string[]).includes(metricKey)) {
      const financingRecord = financingByAbbreviation.get(state.abbreviation);
      return financingRecord ? getFinancingMetricValue(financingRecord, metricKey as FinancingMetric) : 0;
    }
    const resources = resourcesByAbbreviation.get(state.abbreviation);
    if (!resources) return 0;

    switch (metricKey) {
      case "providers_per_100k":
        return roundMetricValue(metricKey, (resources.mental_health_providers / state.population) * 100000 * getResourceAdjustment(state, metricKey));
      case "psychiatrists_per_100k":
        return roundMetricValue(metricKey, (resources.psychiatrists / state.population) * 100000 * getResourceAdjustment(state, metricKey));
      case "therapists_per_100k":
        return roundMetricValue(metricKey, (resources.therapists / state.population) * 100000 * getResourceAdjustment(state, metricKey));
      case "crisis_centers_per_million":
        return roundMetricValue(metricKey, (resources.crisis_centers / state.population) * 1000000 * getResourceAdjustment(state, metricKey));
      default:
        return 0;
    }
  };
  const normalize = (value: number, min: number, max: number) =>
    max === min ? 0.5 : (value - min) / (max - min);
  useEffect(() => {
    if (!activeYearOptions.includes(selectedYear)) {
      setSelectedYear(activeYearOptions[activeYearOptions.length - 1]);
    }
  }, [activeYearOptions, selectedYear]);
  const burdenMetricsForGap: readonly MentalMetric[] = [
    "ami",
    "smi",
    "mde_adult",
    "mde_youth",
    "suicide_rate",
    "anxiety_disorder",
    "ptsd",
    "substance_use_disorder",
    "opioid_use_disorder",
    "alcohol_use_disorder",
    "bipolar_disorder",
    "schizophrenia",
    "eating_disorder",
    "adhd",
  ];
  const mentalRangeByMetric = useMemo(() => {
    const ranges: Partial<Record<MentalMetric, { min: number; max: number }>> = {};
    MENTAL_METRICS.forEach((mentalMetric) => {
      const values = stateData.map((state) => getMetricValue(state, mentalMetric));
      ranges[mentalMetric] = { min: Math.min(...values), max: Math.max(...values) };
    });
    return ranges as Record<MentalMetric, { min: number; max: number }>;
  }, [selectedYear]);
  const resourceRangeByMetric = useMemo(() => {
    const ranges: Partial<Record<ResourceMetric, { min: number; max: number }>> = {};
    RESOURCE_METRICS.forEach((resourceMetric) => {
      const values = stateData.map((state) => getMetricValue(state, resourceMetric));
      ranges[resourceMetric] = { min: Math.min(...values), max: Math.max(...values) };
    });
    return ranges as Record<ResourceMetric, { min: number; max: number }>;
  }, [resourcesByAbbreviation, selectedYear]);
  const financingRangeByMetric = useMemo(() => {
    const ranges: Partial<Record<FinancingMetric, { min: number; max: number }>> = {};
    FINANCING_METRICS.forEach((financingMetric) => {
      const values = stateData.map((state) => getMetricValue(state, financingMetric));
      ranges[financingMetric] = { min: Math.min(...values), max: Math.max(...values) };
    });
    return ranges as Record<FinancingMetric, { min: number; max: number }>;
  }, [financingByAbbreviation]);
  const burdenGapByAbbreviation = useMemo(() => {
    return new Map(
      stateData.map((state) => {
        const burdenScore =
          burdenMetricsForGap.reduce((sum, metricKey) => {
            const range = mentalRangeByMetric[metricKey];
            return sum + normalize(getMetricValue(state, metricKey), range.min, range.max);
          }, 0) / burdenMetricsForGap.length;

        const resourceScore =
          RESOURCE_METRICS.reduce((sum, metricKey) => {
            const value = getMetricValue(state, metricKey);
            const range = resourceRangeByMetric[metricKey];
            return sum + normalize(value, range.min, range.max);
          }, 0) / RESOURCE_METRICS.length;

        return [state.abbreviation, Math.round((burdenScore - resourceScore) * 100) / 100] as const;
      })
    );
  }, [mentalRangeByMetric, resourceRangeByMetric, selectedYear]);
  const gapRange = useMemo(() => {
    const values = Array.from(burdenGapByAbbreviation.values());
    return { min: Math.min(...values), max: Math.max(...values) };
  }, [burdenGapByAbbreviation]);
  const getGapValue = (state: StateData) => burdenGapByAbbreviation.get(state.abbreviation) ?? 0;
  const burdenCompositeByAbbreviation = useMemo(() => {
    return new Map(
      stateData.map((state) => {
        const burdenScore =
          burdenMetricsForGap.reduce((sum, metricKey) => {
            const range = mentalRangeByMetric[metricKey];
            return sum + normalize(getMetricValue(state, metricKey), range.min, range.max);
          }, 0) / burdenMetricsForGap.length;
        return [state.abbreviation, Math.round(burdenScore * 100) / 100] as const;
      })
    );
  }, [mentalRangeByMetric, selectedYear]);
  const resourceCompositeByAbbreviation = useMemo(() => {
    return new Map(
      stateData.map((state) => {
        const resourceScore =
          RESOURCE_METRICS.reduce((sum, metricKey) => {
            const value = getMetricValue(state, metricKey);
            const range = resourceRangeByMetric[metricKey];
            return sum + normalize(value, range.min, range.max);
          }, 0) / RESOURCE_METRICS.length;
        return [state.abbreviation, Math.round(resourceScore * 100) / 100] as const;
      })
    );
  }, [resourceRangeByMetric, selectedYear]);
  const getDisplayValue = (state: StateData, metricKey: Metric) => {
    if (metricKey === GAP_METRIC) return getGapValue(state);
    if (metricKey === NEED_FUNDING_GAP_METRIC) {
      return financingByAbbreviation.get(state.abbreviation)?.funding_gap_per_capita ?? 0;
    }
    if (metricKey === TYPOLOGY_METRIC) {
      return financingByAbbreviation.get(state.abbreviation)?.typology_cluster_id ?? 0;
    }
    return getMetricValue(state, metricKey);
  };
  const getFillColor = (metricKey: Metric, value: number): string => {
    if (metricKey === GAP_METRIC) {
      const maxAbs = Math.max(Math.abs(gapRange.min), Math.abs(gapRange.max)) || 1;
      const normalized = Math.max(-1, Math.min(1, value / maxAbs));
      const hue = normalized >= 0 ? 0 : 120;
      const lightness = 62 - Math.abs(normalized) * 20;
      return `hsl(${hue}, 75%, ${lightness}%)`;
    }
    if (metricKey === NEED_FUNDING_GAP_METRIC) {
      const maxAbs = Math.max(Math.abs(fundingGapRange.min), Math.abs(fundingGapRange.max)) || 1;
      const normalized = Math.max(-1, Math.min(1, value / maxAbs));
      const hue = normalized >= 0 ? 210 : 0;
      const lightness = 64 - Math.abs(normalized) * 18;
      return `hsl(${hue}, 72%, ${lightness}%)`;
    }
    if (metricKey === TYPOLOGY_METRIC) {
      return selectedTypologySummary.find((cluster) => cluster.clusterId === value)?.color ?? "#7c3aed";
    }
    if ((MENTAL_METRICS as readonly string[]).includes(metricKey)) {
      const { min, max } = mentalRangeByMetric[metricKey as MentalMetric];
      if (max === min) return "#84cc16";
      const normalized = (value - min) / (max - min);
      const hue = (1 - normalized) * 120;
      return `hsl(${hue}, 70%, 50%)`;
    }
    if ((FINANCING_METRICS as readonly string[]).includes(metricKey)) {
      const { min, max } = financingRangeByMetric[metricKey as FinancingMetric];
      if (max === min) return "#2563eb";
      const normalized = (value - min) / (max - min);
      const lightness = 92 - normalized * 42;
      return `hsl(214, 78%, ${lightness}%)`;
    }

    const { min, max } = resourceRangeByMetric[metricKey as ResourceMetric];
    if (max === min) return "#84cc16";
    const normalized = (value - min) / (max - min);
    const hue = normalized * 120;
    return `hsl(${hue}, 70%, 45%)`;
  };

  const sortedStates = [...stateData].sort((a, b) => {
    const aVal = getDisplayValue(a, selectedMetric);
    const bVal = getDisplayValue(b, selectedMetric);
    return bVal - aVal;
  });

  const geoJsonKey = `${selectedMetric}-${selectedYear}-${hoveredState?.abbreviation || ""}`;
  const mapDescription =
    metricGroup === "gap"
      ? "Gap index = normalized burden composite minus normalized resource composite for the selected year. Positive values mean burden is outpacing resource capacity."
      : metricGroup === "financing"
        ? "State financing values are shown for the selected year using official CMS, MHBG, and URS inputs where available."
        : metricGroup === "needFunding"
          ? "Funding gap = actual public mental health spending per capita minus predicted spending per capita given modeled need."
          : metricGroup === "typology"
            ? "States are grouped into four unique need-funding typologies using need, financing, Medicaid share, and provider density."
            : "Move the year slider to recalculate state-specific values for the selected year; both fill shading and rankings update with the selected year.";
  const formatMetricValue = (metricKey: Metric, value: number) => {
    if (metricKey === GAP_METRIC) return value.toFixed(2);
    if (metricKey === NEED_FUNDING_GAP_METRIC) {
      return `${value >= 0 ? "+" : ""}$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (metricKey === TYPOLOGY_METRIC) {
      return selectedTypologySummary.find((cluster) => cluster.clusterId === value)?.label ?? "Typology";
    }
    if (metricKey === "suicide_rate") return value.toFixed(1);
    if ((MENTAL_METRICS as readonly string[]).includes(metricKey)) return `${value.toFixed(2)}%`;
    if ((RESOURCE_METRICS as readonly string[]).includes(metricKey)) {
      return value.toLocaleString(undefined, { maximumFractionDigits: 1 });
    }
    if (metricKey === "medicaid_share_of_public_mh") {
      return `${value.toFixed(1)}%`;
    }
    if (metricKey === "behavioral_health_policy_score") {
      return value.toFixed(1);
    }
    if (metricKey === "medicaid_expenditure_per_enrollee") {
      return `$${Math.round(value).toLocaleString()}`;
    }
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  const formatCount = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 0 });
  const formatPeopleCount = (
    state: StateData,
    metricKey:
      | "ami"
      | "smi"
      | "mde_adult"
      | "mde_youth"
      | "anxiety_disorder"
      | "ptsd"
      | "substance_use_disorder"
      | "opioid_use_disorder"
      | "alcohol_use_disorder"
      | "bipolar_disorder"
      | "schizophrenia"
      | "eating_disorder"
      | "adhd"
  ) => {
    const totalMetricKey = `${metricKey}_total` as TotalMetricKey;
    const explicitTotal = state[totalMetricKey];

    if (typeof explicitTotal === "number") {
      return `${explicitTotal.toLocaleString()} people`;
    }

    const estimated = Math.round((state[metricKey] / 100) * state.population);
    return `${estimated.toLocaleString()} people (est.)`;
  };
  const selectedResources = selectedState ? getStateResources(selectedState.abbreviation) : null;
  const selectedBurdenComposite = selectedState ? burdenCompositeByAbbreviation.get(selectedState.abbreviation) ?? 0 : 0;
  const selectedResourceComposite = selectedState ? resourceCompositeByAbbreviation.get(selectedState.abbreviation) ?? 0 : 0;
  const provenanceTone: Record<NonNullable<typeof selectedFinancingProvenance>["level"], string> = {
    official_urs: "bg-emerald-100 text-emerald-800",
    official_cms_mhbg: "bg-blue-100 text-blue-800",
    mixed_official: "bg-indigo-100 text-indigo-800",
    modeled: "bg-amber-100 text-amber-800",
  };

  return (
    <div className="space-y-6">
      {/* Metric Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            setMetricGroup("conditions");
            setSelectedYear(nationalTrendData[nationalTrendData.length - 1].year);
            if (!(MENTAL_METRICS as readonly string[]).includes(selectedMetric)) {
              setSelectedMetric("ami");
            }
          }}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            metricGroup === "conditions"
              ? "bg-primary text-primary-foreground shadow-lg"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Mental Health Burden
        </button>
        <button
          onClick={() => {
            setMetricGroup("resources");
            setSelectedYear(nationalTrendData[nationalTrendData.length - 1].year);
            if (!(RESOURCE_METRICS as readonly string[]).includes(selectedMetric)) {
              setSelectedMetric("providers_per_100k");
            }
          }}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            metricGroup === "resources"
              ? "bg-primary text-primary-foreground shadow-lg"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Resource Availability
        </button>
        <button
          onClick={() => {
            setMetricGroup("financing");
            setSelectedYear(FINANCING_YEARS[FINANCING_YEARS.length - 1]);
            if (!(FINANCING_METRICS as readonly string[]).includes(selectedMetric)) {
              setSelectedMetric("mhbg_per_capita");
            }
          }}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            metricGroup === "financing"
              ? "bg-primary text-primary-foreground shadow-lg"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Financing
        </button>
        <button
          onClick={() => {
            setMetricGroup("needFunding");
            setSelectedYear(FINANCING_YEARS[FINANCING_YEARS.length - 1]);
            setSelectedMetric(NEED_FUNDING_GAP_METRIC);
          }}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            metricGroup === "needFunding"
              ? "bg-primary text-primary-foreground shadow-lg"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Underfunded vs Overfunded
        </button>
        <button
          onClick={() => {
            setMetricGroup("typology");
            setSelectedYear(FINANCING_YEARS[FINANCING_YEARS.length - 1]);
            setSelectedMetric(TYPOLOGY_METRIC);
          }}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            metricGroup === "typology"
              ? "bg-primary text-primary-foreground shadow-lg"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          System Typology
        </button>
        <button
          onClick={() => {
            setMetricGroup("gap");
            setSelectedYear(nationalTrendData[nationalTrendData.length - 1].year);
            setSelectedMetric(GAP_METRIC);
          }}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            metricGroup === "gap"
              ? "bg-primary text-primary-foreground shadow-lg"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Gap Analysis
        </button>
      </div>
      <div className="flex gap-2 flex-wrap">
        {(metricGroup === "conditions"
          ? MENTAL_METRICS
          : metricGroup === "resources"
            ? RESOURCE_METRICS
            : metricGroup === "financing"
              ? FINANCING_METRICS
              : metricGroup === "needFunding"
                ? [NEED_FUNDING_GAP_METRIC]
                : metricGroup === "typology"
                  ? [TYPOLOGY_METRIC]
              : [GAP_METRIC]).map((m) => (
          <button
            key={m}
            onClick={() => setSelectedMetric(m)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedMetric === m
                ? "bg-primary text-primary-foreground shadow-lg"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {metricLabels[m]}
          </button>
        ))}
      </div>
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>US Mental Health Choropleth Map</CardTitle>
          <CardDescription>
            Click on any state to view detailed statistics and forecasts. {mapDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div style={{ height: "600px", borderRadius: "8px", overflow: "visible" }}>
            <MapContainer className="choropleth-map" center={[37.8, -96] as any} zoom={4} style={{ height: "100%", width: "100%" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <GeoJSON
                  key={`fill-${geoJsonKey}`}
                  data={usStatesGeoJSON as any}
                  style={(feature: any) => {
                    const state = stateByName.get(feature.properties.name);
                    if (!state) {
                      return {
                        fillColor: "#10b981",
                        color: "transparent",
                        weight: 0,
                        fillOpacity: 0.75,
                        opacity: 1,
                      };
                    }

                    const value = getDisplayValue(state, selectedMetric);
                    const isHovered = hoveredState?.abbreviation === state.abbreviation;

                    return {
                      fillColor: getFillColor(selectedMetric, value),
                      color: "transparent",
                      weight: 0,
                      fillOpacity: isHovered ? 1 : 0.8,
                      opacity: 1,
                    };
                  }}
                  onEachFeature={(feature: any, layer: any) => {
                    const state = stateByName.get(feature.properties.name);
                    if (!state) return;
                    const value = getDisplayValue(state, selectedMetric);
                    layer.bindPopup(
                      `<strong>${state.state}</strong><br/>${metricLabels[selectedMetric]}: ${formatMetricValue(selectedMetric, value)}`,
                      { className: "state-map-popup" }
                    );
                    layer.on("click", () => {
                      setSelectedState(state);
                    });
                    layer.on("mouseover", () => setHoveredState(state));
                    layer.on("mouseout", () => setHoveredState(null));
                  }}
                />
              <GeoJSON
                  key={`borders-${selectedMetric}`}
                  data={usStatesGeoJSON as any}
                  interactive={false}
                  style={() => ({
                    fill: false,
                    color: "#ffffff",
                    weight: 1,
                    opacity: 1,
                    lineJoin: "round",
                    lineCap: "round",
                  })}
                />
            </MapContainer>
          </div>

          {/* Legend */}
          <div className="mt-6 flex items-center gap-4 flex-wrap">
            <span className="text-sm font-semibold text-foreground">Legend:</span>
            {metricGroup === "typology" ? (
              selectedTypologySummary.map((cluster) => (
                <div key={cluster.clusterId} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: cluster.color }} />
                  <span className="text-sm text-muted-foreground">{cluster.label}</span>
                </div>
              ))
            ) : metricGroup === "needFunding" ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: "#dc2626" }} />
                  <span className="text-sm text-muted-foreground">Underfunded</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: "#fca5a5" }} />
                  <span className="text-sm text-muted-foreground">Slightly Under</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: "#e5e7eb" }} />
                  <span className="text-sm text-muted-foreground">Near Expected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: "#93c5fd" }} />
                  <span className="text-sm text-muted-foreground">Slightly Over</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: "#1d4ed8" }} />
                  <span className="text-sm text-muted-foreground">Overfunded</span>
                </div>
              </>
            ) : metricGroup === "financing" ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: "#dbeafe" }} />
                  <span className="text-sm text-muted-foreground">Lowest value</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: "#93c5fd" }} />
                  <span className="text-sm text-muted-foreground">Low-Medium</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: "#60a5fa" }} />
                  <span className="text-sm text-muted-foreground">Medium</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: "#2563eb" }} />
                  <span className="text-sm text-muted-foreground">High</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: "#1d4ed8" }} />
                  <span className="text-sm text-muted-foreground">Highest value</span>
                </div>
              </>
            ) : metricGroup === "gap" ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: "#15803d" }} />
                  <span className="text-sm text-muted-foreground">Resources exceed burden</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: "#86efac" }} />
                  <span className="text-sm text-muted-foreground">Slight resource surplus</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: "#e5e7eb" }} />
                  <span className="text-sm text-muted-foreground">Near balance</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: "#fca5a5" }} />
                  <span className="text-sm text-muted-foreground">Burden slightly exceeds resources</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: "#dc2626" }} />
                  <span className="text-sm text-muted-foreground">Burden strongly exceeds resources</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: "#10b981" }} />
                  <span className="text-sm text-muted-foreground">Lowest</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: "#84cc16" }} />
                  <span className="text-sm text-muted-foreground">Low-Medium</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: "#eab308" }} />
                  <span className="text-sm text-muted-foreground">Medium</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: "#f97316" }} />
                  <span className="text-sm text-muted-foreground">High</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: "#dc2626" }} />
                  <span className="text-sm text-muted-foreground">Highest</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Map Year</p>
              <p className="text-xs text-muted-foreground">
                {metricGroup === "financing" || metricGroup === "needFunding" || metricGroup === "typology"
                  ? "Adjust the choropleth by year. Financing-related map views are limited to 2020-2024 because earlier years are not shown in the public choropleth."
                  : "Adjust the choropleth by year. Burden, resource, and gap views recalculate state-specific values from the national trend series plus state-level variation."}
              </p>
            </div>
            <div className="text-2xl font-bold text-foreground">{selectedYear}</div>
          </div>
          <Slider
            min={activeYearOptions[0]}
            max={activeYearOptions[activeYearOptions.length - 1]}
            step={1}
            value={[selectedYear]}
            onValueChange={(value) => setSelectedYear(value[0])}
          />
          <div className="mt-3 flex justify-between text-xs text-muted-foreground">
            {(activeYearOptions.length > 10
              ? activeYearOptions.filter((year) => year % 4 === 0 || year === activeYearOptions[0] || year === activeYearOptions[activeYearOptions.length - 1])
              : activeYearOptions).map((year) => (
              <span key={year}>{year}</span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rankings / Typology */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>
            {metricGroup === "typology" ? "State Typology Clusters" : `State Rankings by ${metricLabels[selectedMetric]}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {metricGroup === "typology" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {selectedTypologySummary.map((cluster) => (
                <div key={cluster.clusterId} className="rounded-lg border p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: cluster.color }} />
                    <div>
                      <p className="font-semibold text-foreground">{cluster.label}</p>
                      <p className="text-xs text-muted-foreground">{cluster.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {cluster.states.map((abbreviation) => {
                      const state = stateData.find((entry) => entry.abbreviation === abbreviation)!;
                      return (
                        <button
                          key={abbreviation}
                          onClick={() => setSelectedState(state)}
                          className={`rounded-full px-3 py-1 text-xs transition-colors ${
                            selectedState?.abbreviation === abbreviation
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {abbreviation}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-sm mb-3">
                  {selectedMetric === NEED_FUNDING_GAP_METRIC ? "Most Overfunded" : "Highest"}
                </h4>
                <div className="space-y-2">
                  {sortedStates.slice(0, 5).map((state, idx) => (
                    <div
                      key={state.abbreviation}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                        selectedState?.abbreviation === state.abbreviation
                          ? "bg-primary/20"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => setSelectedState(state)}
                    >
                      <span className="text-sm">
                        #{idx + 1} {state.abbreviation} - {state.state}
                      </span>
                      <span className="font-bold" style={{ color: metricColors[selectedMetric] }}>
                        {formatMetricValue(selectedMetric, getDisplayValue(state, selectedMetric))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-3">
                  {selectedMetric === NEED_FUNDING_GAP_METRIC ? "Most Underfunded" : "Lowest"}
                </h4>
                <div className="space-y-2">
                  {sortedStates.slice(-5).reverse().map((state, idx) => (
                    <div
                      key={state.abbreviation}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                        selectedState?.abbreviation === state.abbreviation
                          ? "bg-primary/20"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => setSelectedState(state)}
                    >
                      <span className="text-sm">
                        #{sortedStates.length - idx} {state.abbreviation} - {state.state}
                      </span>
                      <span className="font-bold" style={{ color: metricColors[selectedMetric] }}>
                        {formatMetricValue(selectedMetric, getDisplayValue(state, selectedMetric))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {(metricGroup === "financing" || metricGroup === "needFunding" || metricGroup === "typology") && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>
              {metricGroup === "financing"
                ? "National Financing Trend Context"
                : metricGroup === "needFunding"
                  ? "Need-Funding Gap Validation"
                  : "Mental Health System Typology Context"}
            </CardTitle>
            <CardDescription>
              {metricGroup === "financing"
                ? "Source-aligned dashboard design for annual financing comparisons across SAMHSA block grant, public mental health spending, and Medicaid financing context."
                : metricGroup === "needFunding"
                  ? "Regression-based validation of whether public mental health financing aligns with burden. Gap values show actual minus predicted funding given state need."
                  : "K-means clustering groups states into comparable mental health system types using need, funding, Medicaid financing share, and provider density."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-800">
                mixed official: {selectedFinancingCoverage.mixed_official}
              </span>
              <span className="rounded-full bg-sky-100 px-3 py-1 font-medium text-sky-800">
                URS-backed: {selectedFinancingCoverage.official_urs}
              </span>
              <span className="rounded-full bg-indigo-100 px-3 py-1 font-medium text-indigo-800">
                CMS/MHBG-backed: {selectedFinancingCoverage.official_cms_mhbg}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                modeled: {selectedFinancingCoverage.modeled}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Coverage snapshot for {selectedYear} across {selectedFinancingCoverage.total} state financing records. URS indicates direct SAMHSA public
              mental health spending and funding-share values; CMS/MHBG indicates direct Medicaid expenditure and block grant components without URS-backed
              public system shares.
            </p>
            {metricGroup === "needFunding" && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="rounded-lg bg-blue-50 p-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Regression Slope</p>
                  <p className="text-lg font-bold text-foreground">${selectedNeedFundingRegression.slope}</p>
                </div>
                <div className="rounded-lg bg-indigo-50 p-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Intercept</p>
                  <p className="text-lg font-bold text-foreground">${selectedNeedFundingRegression.intercept}</p>
                </div>
                <div className="rounded-lg bg-teal-50 p-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">R²</p>
                  <p className="text-lg font-bold text-foreground">{selectedNeedFundingRegression.rSquared}</p>
                </div>
                <div className="rounded-lg bg-amber-50 p-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">t-statistic</p>
                  <p className="text-lg font-bold text-foreground">{selectedNeedFundingRegression.tStatistic}</p>
                </div>
                <div className="rounded-lg bg-rose-50 p-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Model Signal</p>
                  <p className="text-lg font-bold text-foreground">
                    {selectedNeedFundingRegression.significant ? "Significant" : "Weak"}
                  </p>
                </div>
              </div>
            )}
            {metricGroup === "typology" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedTypologySummary.map((cluster) => (
                  <div key={cluster.clusterId} className="rounded-lg border p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: cluster.color }} />
                      <p className="font-semibold text-foreground">{cluster.label}</p>
                      <span className="text-xs text-muted-foreground">{cluster.count} states</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{cluster.description}</p>
                  </div>
                ))}
              </div>
            )}
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={nationalFinancingTrend} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="year" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                  formatter={(value: number, name: string) => {
                    if (name === "medicaid_share_of_public_mh") return [`${value}%`, "Avg Medicaid Share"];
                    if (name === "medicaid_total_expenditures_billions") return [`$${value}B`, "Total Medicaid Expenditures"];
                    return [`$${Number(value).toLocaleString()}M`, name === "mhbg_allotment_millions" ? "MHBG Allotment" : name === "federal_mental_health_funding_millions" ? "Federal Mental Health Funding" : "Public MH Spending"];
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="mhbg_allotment_millions" stroke="#2563eb" strokeWidth={2} name="MHBG Allotment" dot={false} />
                <Line type="monotone" dataKey="federal_mental_health_funding_millions" stroke="#1d4ed8" strokeWidth={2} name="Federal MH Funding" dot={false} />
                <Line type="monotone" dataKey="public_mh_spending_millions" stroke="#0f766e" strokeWidth={2} name="Public MH Spending" dot={false} />
                <Line type="monotone" dataKey="medicaid_total_expenditures_billions" stroke="#0e7490" strokeWidth={2} name="Medicaid Expenditures (B)" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* State Details Modal */}
      <Dialog open={!!selectedState} onOpenChange={(open) => !open && setSelectedState(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedState && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedState.state}</DialogTitle>
                <DialogDescription>{selectedState.abbreviation}</DialogDescription>
              </DialogHeader>

              {metricGroup === "conditions" && (MENTAL_METRICS as readonly string[]).includes(selectedMetric) && (
                <div className="space-y-4 my-6">
                  <h3 className="font-semibold text-lg">Selected Mental Health Burden Metric</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg border bg-card md:col-span-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">{metricLabels[selectedMetric]}</p>
                      <p className="text-3xl font-bold text-foreground">{formatMetricValue(selectedMetric, getDisplayValue(selectedState, selectedMetric))}</p>
                      {selectedMetric === "suicide_rate" ? (
                        <>
                          <p className="text-sm text-muted-foreground mt-2">Deaths per 100,000 people in the selected year view.</p>
                          {selectedState.suicide_deaths && (
                            <p className="text-sm text-muted-foreground">
                              {formatCount(selectedState.suicide_deaths)} total deaths ({selectedState.suicide_source_year ?? "official"})
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-muted-foreground mt-2">
                            {Math.round((getDisplayValue(selectedState, selectedMetric as MentalMetric) / 100) * 100000).toLocaleString()} per 100,000 people
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {Math.round((getDisplayValue(selectedState, selectedMetric as MentalMetric) / 100) * selectedState.population).toLocaleString()} people (estimated)
                          </p>
                        </>
                      )}
                    </div>
                    <div className="p-4 rounded-lg border bg-muted/30">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Selected Year</p>
                      <p className="text-3xl font-bold text-foreground">{selectedYear}</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        This modal is scoped to the currently selected burden metric rather than all disorder and resource sections.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {metricGroup === "resources" && selectedResources && (
                <div className="space-y-4 my-6">
                  <h3 className="font-semibold text-lg">Mental Health Resource Availability</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {RESOURCE_METRICS.map((resourceMetric) => {
                      const displayValue = getDisplayValue(selectedState, resourceMetric);
                      const total =
                        resourceMetric === "crisis_centers_per_million"
                          ? Math.round((displayValue / 1_000_000) * selectedState.population)
                          : Math.round((displayValue / 100_000) * selectedState.population);
                      return (
                        <div
                          key={resourceMetric}
                          className={`p-4 rounded-lg border ${selectedMetric === resourceMetric ? "border-primary bg-primary/5" : "bg-card"}`}
                        >
                          <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">{metricLabels[resourceMetric]}</p>
                          <p className="text-2xl font-bold text-foreground">{formatMetricValue(resourceMetric, displayValue)}</p>
                          <p className="text-sm text-muted-foreground mt-2">
                            {resourceMetric === "crisis_centers_per_million" ? "per 1,000,000 people" : "per 100,000 people"}
                          </p>
                          <p className="text-sm text-muted-foreground">{formatCount(total)} total</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {metricGroup === "gap" && (
                <div className="space-y-4 my-6">
                  <h3 className="font-semibold text-lg">Burden-Resource Gap Snapshot</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg border bg-rose-50">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Gap Index</p>
                      <p className="text-3xl font-bold text-foreground">{getGapValue(selectedState).toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Positive values mean burden is outpacing resource capacity.
                      </p>
                    </div>
                    <div className="p-4 rounded-lg border bg-orange-50">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Burden Composite</p>
                      <p className="text-3xl font-bold text-foreground">{selectedBurdenComposite.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground mt-2">Normalized across burden indicators for the selected year.</p>
                    </div>
                    <div className="p-4 rounded-lg border bg-emerald-50">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Resource Composite</p>
                      <p className="text-3xl font-bold text-foreground">{selectedResourceComposite.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground mt-2">Normalized across providers, therapists, psychiatrists, and crisis-capable facilities.</p>
                    </div>
                  </div>
                </div>
              )}

              {(metricGroup === "financing" || metricGroup === "needFunding" || metricGroup === "typology") && selectedFinancingRecord && (
                <div className="space-y-4 my-6">
                  <h3 className="font-semibold text-lg">Mental Health Financing Snapshot ({selectedYear})</h3>
                  {selectedFinancingProvenance && (
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${provenanceTone[selectedFinancingProvenance.level]}`}>
                          {selectedFinancingProvenance.label}
                        </span>
                        {selectedFinancingProvenance.badges.map((badge) => (
                          <span key={badge} className="px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                            {badge}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">{selectedFinancingProvenance.note}</p>
                    </div>
                  )}
                  {selectedFinancingGapNote && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                      Source note: {selectedFinancingGapNote}
                    </div>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Need Index</p>
                      <p className="text-lg font-bold text-foreground">{selectedFinancingRecord.need_index}</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Predicted Funding</p>
                      <p className="text-lg font-bold text-foreground">${selectedFinancingRecord.predicted_public_mh_spending_per_capita}</p>
                      <p className="text-xs text-muted-foreground mt-1">per capita from need model</p>
                    </div>
                    <div className="p-3 bg-rose-50 rounded-lg">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Need-Funding Gap</p>
                      <p className="text-lg font-bold text-foreground">
                        {formatMetricValue(NEED_FUNDING_GAP_METRIC, selectedFinancingRecord.funding_gap_per_capita)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{selectedFinancingRecord.funding_gap_percent}% vs predicted</p>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-lg">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Average Gap</p>
                      <p className="text-lg font-bold text-foreground">${selectedFinancingRecord.average_gap_per_capita}</p>
                      <p className="text-xs text-muted-foreground mt-1">{selectedFinancingRecord.gap_trend_per_year}/yr trend</p>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-lg">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Persistence Flag</p>
                      <p className="text-lg font-bold text-foreground">
                        {selectedFinancingRecord.persistent_underfunding ? "Persistent gap" : "Not persistent"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {Math.round(selectedFinancingRecord.negative_gap_years_share * 100)}% of years negative
                      </p>
                    </div>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: `${selectedFinancingRecord.typology_cluster_color}15` }}>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">System Typology</p>
                      <p className="text-sm font-bold text-foreground">{selectedFinancingRecord.typology_cluster_label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{selectedFinancingRecord.typology_cluster_description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">MHBG per Capita</p>
                      <p className="text-lg font-bold text-foreground">{formatMetricValue("mhbg_per_capita", selectedFinancingRecord.mhbg_per_capita)}</p>
                      <p className="text-xs text-muted-foreground mt-1">${selectedFinancingRecord.mhbg_allotment_millions.toLocaleString()}M total</p>
                    </div>
                    <div className="p-3 bg-indigo-50 rounded-lg">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Federal MH Funding</p>
                      <p className="text-lg font-bold text-foreground">{formatMetricValue("federal_mental_health_funding_per_capita", selectedFinancingRecord.federal_mental_health_funding_per_capita)}</p>
                      <p className="text-xs text-muted-foreground mt-1">${selectedFinancingRecord.federal_mental_health_funding_millions.toLocaleString()}M total</p>
                    </div>
                    <div className="p-3 bg-teal-50 rounded-lg">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Public MH Spending</p>
                      <p className="text-lg font-bold text-foreground">{formatMetricValue("public_mh_spending_per_capita", selectedFinancingRecord.public_mh_spending_per_capita)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        ${selectedFinancingRecord.public_mh_spending_millions.toLocaleString()}M total
                        {selectedFinancingRecord.official_urs_total_smha_expenditures_millions ? " (URS)" : ""}
                      </p>
                    </div>
                    <div className="p-3 bg-cyan-50 rounded-lg">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Medicaid per Enrollee</p>
                      <p className="text-lg font-bold text-foreground">{formatMetricValue("medicaid_expenditure_per_enrollee", selectedFinancingRecord.medicaid_expenditure_per_enrollee)}</p>
                      <p className="text-xs text-muted-foreground mt-1">{selectedFinancingRecord.medicaid_enrollment.toLocaleString()} enrollees</p>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-lg">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Medicaid Share</p>
                      <p className="text-lg font-bold text-foreground">{formatMetricValue("medicaid_share_of_public_mh", selectedFinancingRecord.medicaid_share_of_public_mh)}</p>
                      <p className="text-xs text-muted-foreground mt-1">of public mental health financing</p>
                    </div>
                    <div className="p-3 bg-violet-50 rounded-lg">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Policy Context Score</p>
                      <p className="text-lg font-bold text-foreground">{formatMetricValue("behavioral_health_policy_score", selectedFinancingRecord.behavioral_health_policy_score)}</p>
                      <p className="text-xs text-muted-foreground mt-1">KFF-informed policy context index</p>
                    </div>
                  </div>

                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={selectedFinancingTrend} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="year" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                        formatter={(value: number, name: string) => {
                          if (name === "medicaid_share_of_public_mh") return [`${value}%`, "Medicaid Share of Public MH"];
                          if (name === "behavioral_health_policy_score") return [value, "Policy Context Score"];
                          return [`$${Number(value).toLocaleString()}`, name === "medicaid_expenditure_per_enrollee" ? "Medicaid per Enrollee" : name === "public_mh_spending_per_capita" ? "Public MH Spending per Capita" : "MHBG per Capita"];
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="mhbg_per_capita" stroke="#2563eb" strokeWidth={2} name="MHBG per Capita" dot={false} />
                      <Line type="monotone" dataKey="public_mh_spending_per_capita" stroke="#0f766e" strokeWidth={2} name="Public MH Spending per Capita" dot={false} />
                      <Line type="monotone" dataKey="medicaid_expenditure_per_enrollee" stroke="#0e7490" strokeWidth={2} name="Medicaid per Enrollee" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">State Funds Share</p>
                      <p className="text-lg font-bold text-foreground">{selectedFinancingRecord.state_share_of_public_mh}%</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Other Federal Share</p>
                      <p className="text-lg font-bold text-foreground">{selectedFinancingRecord.other_federal_share_of_public_mh}%</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Local / Other Share</p>
                      <p className="text-lg font-bold text-foreground">{selectedFinancingRecord.local_other_share_of_public_mh}%</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Medicaid Expenditures</p>
                      <p className="text-lg font-bold text-foreground">${selectedFinancingRecord.medicaid_total_expenditures_millions.toLocaleString()}M</p>
                      {selectedFinancingRecord.official_cms_federal_share_millions && selectedFinancingRecord.official_cms_state_share_millions ? (
                        <p className="text-xs text-muted-foreground mt-1">
                          Fed ${selectedFinancingRecord.official_cms_federal_share_millions.toLocaleString()}M / State ${selectedFinancingRecord.official_cms_state_share_millions.toLocaleString()}M
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Footnote: `URS` indicates direct SAMHSA public mental health spending and financing-share data for this state-year. `CMS` indicates direct Medicaid expenditure totals from the CMS Financial Management Report. `MHBG` indicates direct SAMHSA Community Mental Health Block Grant values. `Modeled` indicates the harmonized fallback layer where official extracts are not yet available.
                  </p>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
