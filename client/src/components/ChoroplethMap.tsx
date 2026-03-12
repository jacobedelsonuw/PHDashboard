import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { stateData, generateForecast, getStateResources, StateData } from "@/data/stateData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Phone, MessageCircle, TrendingUp } from "lucide-react";
import { feature } from "topojson-client";
import usAtlas from "us-atlas/states-10m.json";
import {
  FINANCING_METRICS,
  FINANCING_YEARS,
  FinancingMetric,
  financingMetricLabels,
  getFinancingMetricValue,
  getFinancingProvenanceSummary,
  getFinancingSourceGapNote,
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

type MentalMetric = (typeof MENTAL_METRICS)[number];
type ResourceMetric = (typeof RESOURCE_METRICS)[number];
type FinancingMetricKey = FinancingMetric;
type GapMetric = typeof GAP_METRIC;
type Metric = MentalMetric | ResourceMetric | FinancingMetricKey | GapMetric;
type MetricGroup = "conditions" | "resources" | "financing" | "gap";
type TotalMetricKey =
  | "ami_total"
  | "smi_total"
  | "mde_adult_total"
  | "mde_youth_total"
  | "substance_use_disorder_total"
  | "opioid_use_disorder_total"
  | "alcohol_use_disorder_total";

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
  const activeYearOptions: number[] = metricGroup === "financing" ? [...FINANCING_YEARS] : nationalTrendData.map((point) => point.year);
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
  const roundMetricValue = (metricKey: MentalMetric | ResourceMetric, value: number) =>
    metricKey === "suicide_rate" || metricKey === "crisis_centers_per_million"
      ? Math.round(value * 10) / 10
      : Math.round(value * 100) / 100;
  const getMentalAdjustment = (metricKey: MentalMetric) => {
    switch (metricKey) {
      case "ami":
        return selectedTrendPoint.ami / 23.4;
      case "smi":
        return selectedTrendPoint.smi / 5.6;
      case "mde_youth":
        return selectedTrendPoint.mde_youth / 20.2;
      case "mde_adult":
        return (selectedTrendPoint.ami / 23.4 + selectedTrendPoint.mde_youth / 20.2) / 2;
      case "suicide_rate":
        return selectedTrendPoint.suicide / 14.5;
      default:
        return selectedTrendPoint.ami / 23.4;
    }
  };
  const getResourceAdjustment = () => {
    const progress = (selectedYear - nationalTrendData[0].year) / (nationalTrendData[nationalTrendData.length - 1].year - nationalTrendData[0].year);
    return 0.74 + Math.max(0, Math.min(1, progress)) * 0.26;
  };
  const getMetricValue = (state: StateData, metricKey: Metric): number => {
    if ((MENTAL_METRICS as readonly string[]).includes(metricKey)) {
      const typedMetric = metricKey as MentalMetric;
      return roundMetricValue(typedMetric, state[typedMetric] * getMentalAdjustment(typedMetric));
    }
    if ((FINANCING_METRICS as readonly string[]).includes(metricKey)) {
      const financingRecord = financingByAbbreviation.get(state.abbreviation);
      return financingRecord ? getFinancingMetricValue(financingRecord, metricKey as FinancingMetric) : 0;
    }
    const resources = resourcesByAbbreviation.get(state.abbreviation);
    if (!resources) return 0;

    switch (metricKey) {
      case "providers_per_100k":
        return roundMetricValue(metricKey, (resources.mental_health_providers / state.population) * 100000 * getResourceAdjustment());
      case "psychiatrists_per_100k":
        return roundMetricValue(metricKey, (resources.psychiatrists / state.population) * 100000 * getResourceAdjustment());
      case "therapists_per_100k":
        return roundMetricValue(metricKey, (resources.therapists / state.population) * 100000 * getResourceAdjustment());
      case "crisis_centers_per_million":
        return roundMetricValue(metricKey, (resources.crisis_centers / state.population) * 1000000 * getResourceAdjustment());
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
    const burdenRanges = Object.fromEntries(
      burdenMetricsForGap.map((m) => [
        m,
        {
          min: Math.min(...stateData.map((state) => state[m])),
          max: Math.max(...stateData.map((state) => state[m])),
        },
      ])
    ) as Record<MentalMetric, { min: number; max: number }>;

    const resourceRanges = Object.fromEntries(
      RESOURCE_METRICS.map((m) => [
        m,
        {
          min: Math.min(...stateData.map((state) => getMetricValue(state, m))),
          max: Math.max(...stateData.map((state) => getMetricValue(state, m))),
        },
      ])
    ) as Record<ResourceMetric, { min: number; max: number }>;

    return new Map(
      stateData.map((state) => {
        const burdenScore =
          burdenMetricsForGap.reduce((sum, metricKey) => {
            const range = burdenRanges[metricKey];
            return sum + normalize(state[metricKey], range.min, range.max);
          }, 0) / burdenMetricsForGap.length;

        const resourceScore =
          RESOURCE_METRICS.reduce((sum, metricKey) => {
            const value = getMetricValue(state, metricKey);
            const range = resourceRanges[metricKey];
            return sum + normalize(value, range.min, range.max);
          }, 0) / RESOURCE_METRICS.length;

        return [state.abbreviation, Math.round((burdenScore - resourceScore) * 100) / 100] as const;
      })
    );
  }, [resourceRangeByMetric, selectedYear]);
  const gapRange = useMemo(() => {
    const values = Array.from(burdenGapByAbbreviation.values());
    return { min: Math.min(...values), max: Math.max(...values) };
  }, [burdenGapByAbbreviation]);
  const getGapValue = (state: StateData) => burdenGapByAbbreviation.get(state.abbreviation) ?? 0;
  const getDisplayValue = (state: StateData, metricKey: Metric) => {
    if (metricKey === GAP_METRIC) return getGapValue(state);
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
    if ((MENTAL_METRICS as readonly string[]).includes(metricKey)) {
      const { min, max } = mentalRangeByMetric[metricKey as MentalMetric];
      if (max === min) return "#84cc16";
      const normalized = (value - min) / (max - min);
      const hue = (1 - normalized) * 120;
      return `hsl(${hue}, 70%, 50%)`;
    }
    if ((FINANCING_METRICS as readonly string[]).includes(metricKey)) {
      const { min, max } = financingRangeByMetric[metricKey as FinancingMetric];
      if (max === min) return "#84cc16";
      const normalized = (value - min) / (max - min);
      const hue = 210 - normalized * 160;
      return `hsl(${hue}, 72%, 45%)`;
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
  const formatMetricValue = (metricKey: Metric, value: number) => {
    if (metricKey === GAP_METRIC) return value.toFixed(2);
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
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Map Year</p>
              <p className="text-xs text-muted-foreground">
                Adjust the choropleth by year. Financing uses annual state financing records; burden, resource, and gap views scale state baselines against the national trend series.
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

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>US Mental Health Choropleth Map</CardTitle>
          <CardDescription>
            Click on any state to view detailed statistics and forecasts. Financing metrics are year-adjustable with the slider above.
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
          </div>
        </CardContent>
      </Card>

      {/* Rankings */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>State Rankings by {metricLabels[selectedMetric]}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-sm mb-3">Highest</h4>
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
              <h4 className="font-semibold text-sm mb-3">Lowest</h4>
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
        </CardContent>
      </Card>

      {metricGroup === "financing" && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>National Financing Trend Context</CardTitle>
            <CardDescription>
              Source-aligned dashboard design for annual financing comparisons across SAMHSA block grant, public mental health spending, and Medicaid financing context.
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

              {/* Key Metrics - Core */}
              <div className="my-6">
                <h3 className="font-semibold text-lg mb-4">Core Mental Health Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Any Mental Illness</p>
                    <p className="text-2xl font-bold text-foreground">{selectedState.ami}%</p>
                    <p className="text-xs text-muted-foreground mt-2">{selectedState.ami_per_capita.toLocaleString()} per 100k</p>
                    <p className="text-xs text-muted-foreground">{formatPeopleCount(selectedState, "ami")}</p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Serious Mental Illness</p>
                    <p className="text-2xl font-bold text-foreground">{selectedState.smi}%</p>
                    <p className="text-xs text-muted-foreground mt-2">{selectedState.smi_per_capita.toLocaleString()} per 100k</p>
                    <p className="text-xs text-muted-foreground">{formatPeopleCount(selectedState, "smi")}</p>
                  </div>
                  <div className="p-4 bg-fuchsia-50 rounded-lg">
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Adult Major Depressive Episode</p>
                    <p className="text-2xl font-bold text-foreground">{selectedState.mde_adult}%</p>
                    <p className="text-xs text-muted-foreground mt-2">{selectedState.mde_adult_per_capita.toLocaleString()} per 100k</p>
                    <p className="text-xs text-muted-foreground">{formatPeopleCount(selectedState, "mde_adult")}</p>
                  </div>
                  <div className="p-4 bg-pink-50 rounded-lg">
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Youth Depression</p>
                    <p className="text-2xl font-bold text-foreground">{selectedState.mde_youth}%</p>
                    <p className="text-xs text-muted-foreground mt-2">{selectedState.mde_youth_per_capita.toLocaleString()} per 100k</p>
                    <p className="text-xs text-muted-foreground">{formatPeopleCount(selectedState, "mde_youth")}</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Suicide Rate</p>
                    <p className="text-2xl font-bold text-foreground">{selectedState.suicide_rate}</p>
                    <p className="text-xs text-muted-foreground mt-2">per 100k population</p>
                    {selectedState.suicide_deaths && (
                      <p className="text-xs text-muted-foreground">
                        {selectedState.suicide_deaths.toLocaleString()} deaths ({selectedState.suicide_source_year ?? "official"})
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Psychiatric Disorders */}
              <div className="my-6">
                <h3 className="font-semibold text-lg mb-4">Psychiatric Disorders Prevalence</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  <div className="p-3 bg-fuchsia-50 rounded-lg">
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Adult Major Depressive Episode</p>
                    <p className="text-lg font-bold text-foreground">{selectedState.mde_adult}%</p>
                    <p className="text-xs text-muted-foreground mt-1">{selectedState.mde_adult_per_capita.toLocaleString()} per 100k</p>
                    <p className="text-xs text-muted-foreground">{formatPeopleCount(selectedState, "mde_adult")}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Anxiety</p>
                    <p className="text-lg font-bold text-foreground">{selectedState.anxiety_disorder}%</p>
                    <p className="text-xs text-muted-foreground mt-1">{selectedState.anxiety_disorder_per_capita.toLocaleString()} per 100k</p>
                    <p className="text-xs text-muted-foreground">{formatPeopleCount(selectedState, "anxiety_disorder")}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">PTSD</p>
                    <p className="text-lg font-bold text-foreground">{selectedState.ptsd}%</p>
                    <p className="text-xs text-muted-foreground mt-1">{selectedState.ptsd_per_capita.toLocaleString()} per 100k</p>
                    <p className="text-xs text-muted-foreground">{formatPeopleCount(selectedState, "ptsd")}</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Substance Use</p>
                    <p className="text-lg font-bold text-foreground">{selectedState.substance_use_disorder}%</p>
                    <p className="text-xs text-muted-foreground mt-1">{selectedState.substance_use_disorder_per_capita.toLocaleString()} per 100k</p>
                    <p className="text-xs text-muted-foreground">{formatPeopleCount(selectedState, "substance_use_disorder")}</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Opioid Use</p>
                    <p className="text-lg font-bold text-foreground">{selectedState.opioid_use_disorder}%</p>
                    <p className="text-xs text-muted-foreground mt-1">{selectedState.opioid_use_disorder_per_capita.toLocaleString()} per 100k</p>
                    <p className="text-xs text-muted-foreground">{formatPeopleCount(selectedState, "opioid_use_disorder")}</p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Alcohol Use</p>
                    <p className="text-lg font-bold text-foreground">{selectedState.alcohol_use_disorder}%</p>
                    <p className="text-xs text-muted-foreground mt-1">{selectedState.alcohol_use_disorder_per_capita.toLocaleString()} per 100k</p>
                    <p className="text-xs text-muted-foreground">{formatPeopleCount(selectedState, "alcohol_use_disorder")}</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Bipolar</p>
                    <p className="text-lg font-bold text-foreground">{selectedState.bipolar_disorder}%</p>
                    <p className="text-xs text-muted-foreground mt-1">{selectedState.bipolar_disorder_per_capita.toLocaleString()} per 100k</p>
                    <p className="text-xs text-muted-foreground">{formatPeopleCount(selectedState, "bipolar_disorder")}</p>
                  </div>
                  <div className="p-3 bg-pink-50 rounded-lg">
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Schizophrenia</p>
                    <p className="text-lg font-bold text-foreground">{selectedState.schizophrenia}%</p>
                    <p className="text-xs text-muted-foreground mt-1">{selectedState.schizophrenia_per_capita.toLocaleString()} per 100k</p>
                    <p className="text-xs text-muted-foreground">{formatPeopleCount(selectedState, "schizophrenia")}</p>
                  </div>
                  <div className="p-3 bg-indigo-50 rounded-lg">
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Eating Disorder</p>
                    <p className="text-lg font-bold text-foreground">{selectedState.eating_disorder}%</p>
                    <p className="text-xs text-muted-foreground mt-1">{selectedState.eating_disorder_per_capita.toLocaleString()} per 100k</p>
                    <p className="text-xs text-muted-foreground">{formatPeopleCount(selectedState, "eating_disorder")}</p>
                  </div>
                  <div className="p-3 bg-cyan-50 rounded-lg">
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">ADHD</p>
                    <p className="text-lg font-bold text-foreground">{selectedState.adhd}%</p>
                    <p className="text-xs text-muted-foreground mt-1">{selectedState.adhd_per_capita.toLocaleString()} per 100k</p>
                    <p className="text-xs text-muted-foreground">{formatPeopleCount(selectedState, "adhd")}</p>
                  </div>
                </div>
              </div>

              {/* Resources */}
              {getStateResources(selectedState.abbreviation) && (
                <div className="space-y-4 my-6">
                  <h3 className="font-semibold text-lg">Mental Health Resources</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <Phone className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm">Crisis Hotline</p>
                        <p className="text-sm text-muted-foreground">{getStateResources(selectedState.abbreviation)?.hotline}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <MessageCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm">Crisis Text Line</p>
                        <p className="text-sm text-muted-foreground">{getStateResources(selectedState.abbreviation)?.crisis_text}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Mental Health Providers</p>
                      <p className="text-xl font-bold text-foreground">
                        {getStateResources(selectedState.abbreviation)?.mental_health_providers}
                      </p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Psychiatrists</p>
                      <p className="text-xl font-bold text-foreground">
                        {getStateResources(selectedState.abbreviation)?.psychiatrists}
                      </p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Therapists</p>
                      <p className="text-xl font-bold text-foreground">
                        {getStateResources(selectedState.abbreviation)?.therapists}
                      </p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Crisis-Capable Facilities</p>
                      <p className="text-xl font-bold text-foreground">
                        {getStateResources(selectedState.abbreviation)?.crisis_centers}
                      </p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Mental Health Facilities</p>
                      <p className="text-xl font-bold text-foreground">
                        {getStateResources(selectedState.abbreviation)?.mental_health_facilities}
                      </p>
                    </div>
                  </div>

                  {getStateResources(selectedState.abbreviation)?.support_organizations && (
                    <div>
                      <p className="font-semibold text-sm mb-2">Support Organizations</p>
                      <div className="flex flex-wrap gap-2">
                        {getStateResources(selectedState.abbreviation)?.support_organizations.map((org, idx) => (
                          <span key={idx} className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">
                            {org}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedFinancingRecord && (
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

              {/* Forecast */}
              <div className="space-y-4 my-6">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  10-Year Forecast (2024-2034)
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={generateForecast(selectedState)} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="year" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="ami" stroke="#8b5cf6" strokeWidth={2} name="AMI %" dot={false} />
                    <Line type="monotone" dataKey="smi" stroke="#f97316" strokeWidth={2} name="SMI %" dot={false} />
                    <Line type="monotone" dataKey="mde_adult" stroke="#c026d3" strokeWidth={2} name="Adult MDE %" dot={false} />
                    <Line type="monotone" dataKey="mde_youth" stroke="#ec4899" strokeWidth={2} name="Youth MDE %" dot={false} />
                    <Line type="monotone" dataKey="suicide_rate" stroke="#a855f7" strokeWidth={2} name="Suicide Rate" dot={false} />
                    <Line type="monotone" dataKey="anxiety_disorder" stroke="#3b82f6" strokeWidth={1.5} name="Anxiety" dot={false} />
                    <Line type="monotone" dataKey="ptsd" stroke="#10b981" strokeWidth={1.5} name="PTSD" dot={false} />
                    <Line type="monotone" dataKey="substance_use_disorder" stroke="#ef4444" strokeWidth={1.5} name="Substance Use" dot={false} />
                    <Line type="monotone" dataKey="opioid_use_disorder" stroke="#f97316" strokeWidth={1.5} name="Opioid Use" dot={false} />
                    <Line type="monotone" dataKey="alcohol_use_disorder" stroke="#eab308" strokeWidth={1.5} name="Alcohol Use" dot={false} />
                    <Line type="monotone" dataKey="bipolar_disorder" stroke="#a855f7" strokeWidth={1.5} name="Bipolar" dot={false} />
                    <Line type="monotone" dataKey="schizophrenia" stroke="#ec4899" strokeWidth={1.5} name="Schizophrenia" dot={false} />
                    <Line type="monotone" dataKey="eating_disorder" stroke="#6366f1" strokeWidth={1.5} name="Eating Disorder" dot={false} />
                    <Line type="monotone" dataKey="adhd" stroke="#06b6d4" strokeWidth={1.5} name="ADHD" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Comparison */}
              <div className="space-y-4 my-6">
                <h3 className="font-semibold text-lg">State vs National Average</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={[
                      { metric: "AMI", state: selectedState.ami, national: 23.4 },
                      { metric: "SMI", state: selectedState.smi, national: 5.6 },
                      { metric: "Adult MDE", state: selectedState.mde_adult, national: 12.5 },
                      { metric: "Youth MDE", state: selectedState.mde_youth, national: 20.2 },
                      { metric: "Suicide", state: selectedState.suicide_rate, national: 14.5 },
                      { metric: "Anxiety", state: selectedState.anxiety_disorder, national: 17.8 },
                      { metric: "PTSD", state: selectedState.ptsd, national: 5.4 },
                      { metric: "Substance", state: selectedState.substance_use_disorder, national: 9.5 },
                      { metric: "Opioid", state: selectedState.opioid_use_disorder, national: 2.8 },
                      { metric: "Alcohol", state: selectedState.alcohol_use_disorder, national: 6.2 },
                      { metric: "Bipolar", state: selectedState.bipolar_disorder, national: 2.9 },
                      { metric: "Schizo", state: selectedState.schizophrenia, national: 1.0 },
                      { metric: "Eating", state: selectedState.eating_disorder, national: 1.6 },
                      { metric: "ADHD", state: selectedState.adhd, national: 7.3 },
                    ]}
                    margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="metric" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="state" fill={metricColors[selectedMetric]} name={selectedState.abbreviation} />
                    <Bar dataKey="national" fill="#cbd5e1" name="US Average" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
