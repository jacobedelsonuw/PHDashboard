import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ScatterChart,
  ComposedChart,
  Scatter,
  ReferenceLine,
  Cell,
  LabelList,
} from "recharts";
import { TrendingUp, Users, Heart, AlertCircle, Map } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import { nationalTrendData } from "@/data/nationalTrendData";
import { getExpansionTransitionStates } from "@/data/medicaidExpansionData";
import { getStateResources, stateData } from "@/data/stateData";
import {
  FINANCING_YEARS,
  getExpansionEventTrend,
  getExpansionMismatchDistribution,
  getExpansionMismatchTrend,
  getGapScoreExportRows,
  getFinancingProvenanceSummary,
  getMedicaidExpansionPolicyRegression,
  getNationalFinancingTrend,
  getNeedFundingRegression,
  getNeedFundingScatterSummary,
  getPersistentUnderfundingThreshold,
  getPersistentUnderinvestmentExportRows,
  getPersistentUnderinvestmentStates,
  getStateExpansionTrend,
  getStateFinancingByYear,
  getTypologyExportRows,
  getTypologySummaryByYear,
} from "@/data/stateFinancingData";
import type { FinancingYear } from "@/data/stateFinancingData";
import { citationLinks, metricProvenance } from "@shared/dataProvenance";

const ChoroplethMap = lazy(() => import("@/components/ChoroplethMap"));
const CountryChoroplethMap = lazy(() => import("@/components/CountryChoroplethMap"));

// Key statistics
const stats = [
  {
    title: "Adults with Any Mental Illness",
    value: "23.4%",
    subtitle: "61.5 million people",
    icon: Users,
    color: "text-teal-600",
    bgColor: "bg-teal-50",
  },
  {
    title: "Serious Mental Illness",
    value: "5.6%",
    subtitle: "14.6 million people",
    icon: AlertCircle,
    color: "text-rose-600",
    bgColor: "bg-rose-50",
  },
  {
    title: "Youth with Major Depression",
    value: "20.2%",
    subtitle: "Ages 12-17",
    icon: Heart,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  {
    title: "Suicide Rate",
    value: "14.5",
    subtitle: "per 100,000 population",
    icon: TrendingUp,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
];

export default function Home() {
  const trendData = [...nationalTrendData];
  const expansionTransitionStates = getExpansionTransitionStates();
  const [animatedValues, setAnimatedValues] = useState({
    ami: 0,
    smi: 0,
    youth: 0,
    suicide: 0,
  });
  const [geoScope, setGeoScope] = useState<"states" | "countries">("states");
  const [selectedFinancingAnalysisYear, setSelectedFinancingAnalysisYear] = useState<FinancingYear>(
    FINANCING_YEARS[FINANCING_YEARS.length - 1]
  );
  const [selectedExportTables, setSelectedExportTables] = useState({
    gapScores: true,
    persistence: true,
    typology: true,
    regression: true,
  });
  const [selectedExpansionState, setSelectedExpansionState] = useState(
    expansionTransitionStates[expansionTransitionStates.length - 1]?.abbreviation ?? "NC"
  );
  const resourceAvailabilityData = stateData
    .map((state) => {
      const resources = getStateResources(state.abbreviation);
      if (!resources) return null;
      return {
        state: state.abbreviation,
        providers_per_100k: Math.round((resources.mental_health_providers / state.population) * 100000 * 10) / 10,
        psychiatrists_per_100k: Math.round((resources.psychiatrists / state.population) * 100000 * 10) / 10,
        therapists_per_100k: Math.round((resources.therapists / state.population) * 100000 * 10) / 10,
        crisis_centers_per_million: Math.round((resources.crisis_centers / state.population) * 1000000 * 10) / 10,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b?.providers_per_100k ?? 0) - (a?.providers_per_100k ?? 0))
    .slice(0, 12);
  const latestFinancingYear = FINANCING_YEARS[FINANCING_YEARS.length - 1];
  const nationalFinancingTrend = getNationalFinancingTrend();
  const latestFinancingAllStates = getStateFinancingByYear(latestFinancingYear);
  const latestFinancingStates = [...latestFinancingAllStates]
    .sort((a, b) => b.public_mh_spending_per_capita - a.public_mh_spending_per_capita)
    .slice(0, 12);
  const selectedNeedFundingRegression = getNeedFundingRegression(selectedFinancingAnalysisYear);
  const selectedNeedFundingScatter = getNeedFundingScatterSummary(selectedFinancingAnalysisYear);
  const persistentUnderinvestmentThreshold = getPersistentUnderfundingThreshold();
  const persistentUnderinvestmentStates = getPersistentUnderinvestmentStates(selectedFinancingAnalysisYear).slice(0, 10);
  const selectedTypologySummary = getTypologySummaryByYear(selectedFinancingAnalysisYear);
  const expansionMismatchTrend = getExpansionMismatchTrend();
  const expansionMismatchDistribution = getExpansionMismatchDistribution(selectedFinancingAnalysisYear);
  const expansionEventTrend = getExpansionEventTrend();
  const medicaidExpansionPolicyRegression = getMedicaidExpansionPolicyRegression();
  const selectedExpansionStateTrend = getStateExpansionTrend(selectedExpansionState);
  const selectedExpansionStateMeta = expansionTransitionStates.find(
    (state) => state.abbreviation === selectedExpansionState
  );
  const latestFinancingCoverage = latestFinancingAllStates.reduce(
    (acc, record) => {
      const summary = getFinancingProvenanceSummary(record);
      acc.total += 1;
      acc[summary.level] += 1;
      return acc;
    },
    { total: 0, official_urs: 0, official_cms_mhbg: 0, mixed_official: 0, modeled: 0 }
  );
  const rowsToCsv = (rows: Array<Record<string, unknown>>) => {
    if (!rows.length) return "";
    const headers = Object.keys(rows[0]);
    const escapeCell = (value: unknown) => {
      const normalized =
        value === null || value === undefined
          ? ""
          : typeof value === "number" || typeof value === "boolean"
            ? String(value)
            : String(value);
      const escaped = normalized.replace(/"/g, '""');
      return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
    };
    return [headers.join(","), ...rows.map((row) => headers.map((header) => escapeCell(row[header])).join(","))].join("\n");
  };
  const downloadCsv = (filename: string, rows: Array<Record<string, unknown>>) => {
    if (!rows.length) return;
    const csv = rowsToCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  const toggleExportTable = (key: keyof typeof selectedExportTables, checked: boolean | "indeterminate") => {
    setSelectedExportTables((current) => ({
      ...current,
      [key]: checked === true,
    }));
  };
  const downloadFinancingAnalyticsZip = async () => {
    const [{ default: JSZip }] = await Promise.all([import("jszip")]);
    const zip = new JSZip();
    const gapRows = getGapScoreExportRows(selectedFinancingAnalysisYear);
    const persistenceRows = getPersistentUnderinvestmentExportRows();
    const typologyRows = getTypologyExportRows(selectedFinancingAnalysisYear);
    const regressionSummary = [
      {
        year: selectedFinancingAnalysisYear,
        slope: selectedNeedFundingRegression.slope,
        intercept: selectedNeedFundingRegression.intercept,
        r_squared: selectedNeedFundingRegression.rSquared,
        t_statistic: selectedNeedFundingRegression.tStatistic,
        residual_std: selectedNeedFundingRegression.residualStd,
        sample_size: selectedNeedFundingRegression.sampleSize,
      },
    ];
    const includedFiles: string[] = [];

    if (selectedExportTables.gapScores) {
      const filename = `gap-scores-${selectedFinancingAnalysisYear}.csv`;
      zip.file(filename, rowsToCsv(gapRows));
      includedFiles.push(`- ${filename}`);
    }
    if (selectedExportTables.persistence) {
      const filename = "persistent-underinvestment.csv";
      zip.file(filename, rowsToCsv(persistenceRows));
      includedFiles.push(`- ${filename}`);
    }
    if (selectedExportTables.typology) {
      const filename = `typology-${selectedFinancingAnalysisYear}.csv`;
      zip.file(filename, rowsToCsv(typologyRows));
      includedFiles.push(`- ${filename}`);
    }
    if (selectedExportTables.regression) {
      const filename = `need-funding-regression-${selectedFinancingAnalysisYear}.csv`;
      zip.file(filename, rowsToCsv(regressionSummary));
      includedFiles.push(`- ${filename}`);
    }

    if (!includedFiles.length) return;

    zip.file(
      "README.txt",
      [
        "Mental health financing analytic export",
        `Analysis year: ${selectedFinancingAnalysisYear}`,
        "",
        "Included files:",
        ...includedFiles,
      ].join("\n")
    );
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `financing-analytics-${selectedFinancingAnalysisYear}.zip`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  const CORE_METRIC_TO_TREND_KEY = {
    ami: "ami",
    smi: "smi",
    mde_youth: "mde_youth",
    suicide_rate: "suicide",
  } as const;
  const CORE_METRIC_2024_BASE = {
    ami: 23.4,
    smi: 5.6,
    mde_youth: 20.2,
    suicide_rate: 14.5,
  } as const;
  const topStateCount = 10;
  const getStateStackedTrend = (
    metric: "ami" | "smi" | "mde_youth" | "suicide_rate"
  ) => {
    const topStates = [...stateData]
      .sort((a, b) => b[metric] - a[metric])
      .slice(0, topStateCount);
    const topAbbreviations = topStates.map((state) => state.abbreviation);
    const topStateSet = new Set(topAbbreviations);
    const trendKey = CORE_METRIC_TO_TREND_KEY[metric];
    const base = CORE_METRIC_2024_BASE[metric];

    const data = trendData.map((row) => {
      const factor = row[trendKey] / base;
      const point: Record<string, number> = { year: row.year };
      let others = 0;

      stateData.forEach((state) => {
        const value = Math.round(state[metric] * factor * 10) / 10;
        if (topStateSet.has(state.abbreviation)) {
          point[state.abbreviation] = value;
        } else {
          others += value;
        }
      });
      point.OTH = Math.round(others * 10) / 10;
      return point;
    });

    return {
      data,
      series: [...topAbbreviations, "OTH"],
      labels: Object.fromEntries([
        ...topStates.map((state) => [state.abbreviation, state.state]),
        ["OTH", "Other States"],
      ]) as Record<string, string>,
    };
  };
  const getSeriesColor = (seriesKey: string, index: number) => {
    if (seriesKey === "OTH") return "#94a3b8";
    return `hsl(${(index * 37) % 360}, 65%, 50%)`;
  };
  const formatRatePer100 = (value: number) => `${value.toFixed(1)} per 100 people`;
  const formatRatePer100k = (value: number) => `${value.toFixed(1)} per 100,000`;
  const disorderKeys = [
    "mde_adult",
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
  const disorderLabels: Record<(typeof disorderKeys)[number], string> = {
    mde_adult: "Adult MDE",
    anxiety_disorder: "Anxiety",
    ptsd: "PTSD",
    substance_use_disorder: "Substance Use",
    opioid_use_disorder: "Opioid Use",
    alcohol_use_disorder: "Alcohol Use",
    bipolar_disorder: "Bipolar",
    schizophrenia: "Schizophrenia",
    eating_disorder: "Eating Disorder",
    adhd: "ADHD",
  };
  const disorderColors: Record<(typeof disorderKeys)[number], string> = {
    mde_adult: "#c026d3",
    anxiety_disorder: "#3b82f6",
    ptsd: "#10b981",
    substance_use_disorder: "#ef4444",
    opioid_use_disorder: "#f97316",
    alcohol_use_disorder: "#eab308",
    bipolar_disorder: "#a855f7",
    schizophrenia: "#ec4899",
    eating_disorder: "#6366f1",
    adhd: "#06b6d4",
  };
  const disorderBaselines = disorderKeys.reduce(
    (acc, key) => {
      acc[key] = Math.round((stateData.reduce((sum, state) => sum + state[key], 0) / stateData.length) * 10) / 10;
      return acc;
    },
    {} as Record<(typeof disorderKeys)[number], number>
  );
  const disorderTrendData = trendData.map((row) => {
    const factor = row.ami / 23.4;
    return {
      year: row.year,
      ...Object.fromEntries(
        disorderKeys.map((key) => [key, Math.round(disorderBaselines[key] * factor * 10) / 10])
      ),
    };
  });
  const amiStateTrend = getStateStackedTrend("ami");
  const smiStateTrend = getStateStackedTrend("smi");
  const youthStateTrend = getStateStackedTrend("mde_youth");
  const suicideStateTrend = getStateStackedTrend("suicide_rate");
  const mapLoadingFallback = (
    <Card className="border-0 shadow-lg">
      <CardContent className="flex h-[640px] items-center justify-center text-sm text-muted-foreground">
        Loading geographic layer...
      </CardContent>
    </Card>
  );

  // Animate stat values on load
  useEffect(() => {
    const animationDuration = 1500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);

      setAnimatedValues({
        ami: Math.round(23.4 * progress * 10) / 10,
        smi: Math.round(5.6 * progress * 10) / 10,
        youth: Math.round(20.2 * progress * 10) / 10,
        suicide: Math.round(14.5 * progress * 10) / 10,
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "url('https://d2xsxph8kpxj0f.cloudfront.net/93005083/2QfEshUuvhBZjU23gUctWk/hero-mental-health-1-9hT7KhtRvrWY52XDxJtEoe.webp')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="relative z-10 container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Understanding US Mental Health Trends
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Explore two decades of data on mental health in America. From 2004 to 2024, this dashboard reveals critical trends in mental illness prevalence, treatment access, and the evolving mental health landscape.
            </p>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-sm font-medium text-foreground">Data-driven insights</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-secondary" />
                <span className="text-sm font-medium text-foreground">20-year perspective</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Statistics */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            const displayValue =
              idx === 0
                ? animatedValues.ami
                : idx === 1
                  ? animatedValues.smi
                  : idx === 2
                    ? animatedValues.youth
                    : animatedValues.suicide;

            return (
              <Card key={idx} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="pb-3">
                  <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center mb-3`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground mb-1">
                    {displayValue}
                    {idx !== 3 ? "%" : ""}
                  </div>
                  <p className="text-sm text-muted-foreground">{stat.subtitle}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Visualizations */}
      <section className="container mx-auto px-4 py-16">
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-2">20-Year Trends</h2>
          <p className="text-muted-foreground">
            Explore how mental health indicators have evolved in the United States from 2004 to 2024.
          </p>
          <p className="text-sm text-muted-foreground mt-3">
            National trend lines are aligned to official U.S. sources listed below. State AMI, SMI, adult MDE, youth MDE, substance use disorder, alcohol use disorder, opioid use disorder, suicide mortality, and resource availability now use official federal source files; the financing layer now incorporates direct SAMHSA MHBG award tables, direct SAMHSA URS state financing extracts where available, direct CMS Financial Management Report Medicaid expenditure workbooks where available, and KFF policy context into an annual state comparison view. Country comparisons, burden-resource gap scoring, and the remaining disorder layers are still mixed or modeled.
          </p>
        </div>

        <Tabs defaultValue="geographic" className="space-y-6">
          <TabsList className="flex flex-wrap gap-1 bg-muted p-1 rounded-lg h-auto">
            <TabsTrigger value="geographic" className="text-xs md:text-sm">
              <Map className="w-4 h-4 mr-1" /> Geographic
            </TabsTrigger>
            <TabsTrigger value="ami" className="text-xs md:text-sm">
              Any Mental Illness
            </TabsTrigger>
            <TabsTrigger value="smi" className="text-xs md:text-sm">
              Serious Mental Illness
            </TabsTrigger>
            <TabsTrigger value="youth" className="text-xs md:text-sm">
              Youth Depression
            </TabsTrigger>
            <TabsTrigger value="suicide" className="text-xs md:text-sm">
              Suicide Rates
            </TabsTrigger>
            <TabsTrigger value="disorders" className="text-xs md:text-sm">
              Disorders
            </TabsTrigger>
            <TabsTrigger value="financing" className="text-xs md:text-sm">
              Financing
            </TabsTrigger>
          </TabsList>

          {/* Any Mental Illness */}
          <TabsContent value="ami">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Any Mental Illness: State-Stacked Trend Over Time</CardTitle>
                <CardDescription>
                  Stacked state-colored rate view (top 10 states + others) from 2004 to 2024. Values are rates per 100 people, not shares that sum to 100.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={460}>
                  <AreaChart data={amiStateTrend.data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="year" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                      formatter={(value: number, name: string) => [formatRatePer100(value), amiStateTrend.labels[name] ?? name]}
                    />
                    <Legend formatter={(value) => amiStateTrend.labels[value] ?? value} />
                    {amiStateTrend.series.map((seriesKey, idx) => (
                      <Area key={seriesKey} type="monotone" dataKey={seriesKey} stackId="1" stroke={getSeriesColor(seriesKey, idx)} fill={getSeriesColor(seriesKey, idx)} fillOpacity={0.85} />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Serious Mental Illness */}
          <TabsContent value="smi">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Serious Mental Illness: State-Stacked Trend Over Time</CardTitle>
                <CardDescription>
                  Stacked state-colored rate view (top 10 states + others) from 2004 to 2024. Values are rates per 100 people, not shares that sum to 100.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={460}>
                  <AreaChart data={smiStateTrend.data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="year" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                      formatter={(value: number, name: string) => [formatRatePer100(value), smiStateTrend.labels[name] ?? name]}
                    />
                    <Legend formatter={(value) => smiStateTrend.labels[value] ?? value} />
                    {smiStateTrend.series.map((seriesKey, idx) => (
                      <Area key={seriesKey} type="monotone" dataKey={seriesKey} stackId="1" stroke={getSeriesColor(seriesKey, idx)} fill={getSeriesColor(seriesKey, idx)} fillOpacity={0.85} />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Youth Depression */}
          <TabsContent value="youth">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Youth Depression: State-Stacked Trend Over Time</CardTitle>
                <CardDescription>
                  Stacked state-colored rate view (top 10 states + others) from 2004 to 2024. Values are rates per 100 people, not shares that sum to 100.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={460}>
                  <AreaChart data={youthStateTrend.data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="year" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                      formatter={(value: number, name: string) => [formatRatePer100(value), youthStateTrend.labels[name] ?? name]}
                    />
                    <Legend formatter={(value) => youthStateTrend.labels[value] ?? value} />
                    {youthStateTrend.series.map((seriesKey, idx) => (
                      <Area key={seriesKey} type="monotone" dataKey={seriesKey} stackId="1" stroke={getSeriesColor(seriesKey, idx)} fill={getSeriesColor(seriesKey, idx)} fillOpacity={0.85} />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Suicide Rates */}
          <TabsContent value="suicide">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Suicide Rate: State-Stacked Trend Over Time</CardTitle>
                <CardDescription>
                  Stacked state-colored rate view (top 10 states + others) from 2004 to 2024. Values are deaths per 100,000 people, not shares of a whole.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={460}>
                  <AreaChart data={suicideStateTrend.data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="year" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                      formatter={(value: number, name: string) => [formatRatePer100k(value), suicideStateTrend.labels[name] ?? name]}
                    />
                    <Legend formatter={(value) => suicideStateTrend.labels[value] ?? value} />
                    {suicideStateTrend.series.map((seriesKey, idx) => (
                      <Area key={seriesKey} type="monotone" dataKey={seriesKey} stackId="1" stroke={getSeriesColor(seriesKey, idx)} fill={getSeriesColor(seriesKey, idx)} fillOpacity={0.85} />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Psychiatric Disorders */}
          <TabsContent value="disorders">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Psychiatric Disorders: Stacked Trend Over Time</CardTitle>
                <CardDescription>
                  Stacked over-time disorder rate view across the United States. Values are rates per 100 people, so the stacked total is a comparative visualization rather than a 100% composition.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={460}>
                  <AreaChart data={disorderTrendData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="year" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                      formatter={(value: number, name: string) => [formatRatePer100(value), disorderLabels[name as keyof typeof disorderLabels] ?? name]}
                    />
                    <Legend formatter={(value) => disorderLabels[value as keyof typeof disorderLabels] ?? value} />
                    {disorderKeys.map((key) => (
                      <Area key={key} type="monotone" dataKey={key} stackId="1" stroke={disorderColors[key]} fill={disorderColors[key]} fillOpacity={0.8} />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Geographic Trends */}
          <TabsContent value="geographic">
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setGeoScope("states")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    geoScope === "states"
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  US States
                </button>
                <button
                  onClick={() => setGeoScope("countries")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    geoScope === "countries"
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  Countries
                </button>
              </div>
              <Suspense fallback={mapLoadingFallback}>
                {geoScope === "states" ? <ChoroplethMap metric="ami" /> : <CountryChoroplethMap metric="ami" />}
              </Suspense>
            </div>
          </TabsContent>

          {/* Mental Health Financing */}
          <TabsContent value="financing">
            <div className="space-y-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Mental Health and Medicaid Financing Trends</CardTitle>
                  <CardDescription>
                    Annual national context for SAMHSA block grant flows, broader federal mental health funding, state public mental health spending, and Medicaid financing environment.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-5 flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                      {latestFinancingCoverage.mixed_official} mixed official
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                      {latestFinancingCoverage.official_urs} URS-backed
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                      {latestFinancingCoverage.official_cms_mhbg} CMS/MHBG-backed
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                      {latestFinancingCoverage.modeled} modeled
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Coverage snapshot for {latestFinancingYear} across {latestFinancingCoverage.total} state financing records.
                    </span>
                  </div>
                  <ResponsiveContainer width="100%" height={420}>
                    <LineChart data={nationalFinancingTrend} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="year" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                        formatter={(value: number, name: string) => {
                          if (name === "Medicaid Expenditures (B)") return [`$${value}B`, "Medicaid Expenditures"];
                          if (name === "Avg Medicaid Share of Public MH") return [`${value}%`, "Avg Medicaid Share of Public MH"];
                          if (name === "MHBG Allotment") return [`$${Number(value).toLocaleString()}M`, "MHBG Allotment"];
                          if (name === "Federal Mental Health Funding") return [`$${Number(value).toLocaleString()}M`, "Federal Mental Health Funding"];
                          if (name === "Public MH Spending") return [`$${Number(value).toLocaleString()}M`, "Public MH Spending"];
                          return [`$${Number(value).toLocaleString()}M`, name];
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="mhbg_allotment_millions" stroke="#2563eb" strokeWidth={2.5} name="MHBG Allotment" dot={false} />
                      <Line type="monotone" dataKey="federal_mental_health_funding_millions" stroke="#1d4ed8" strokeWidth={2.5} name="Federal Mental Health Funding" dot={false} />
                      <Line type="monotone" dataKey="public_mh_spending_millions" stroke="#0f766e" strokeWidth={2.5} name="Public MH Spending" dot={false} />
                      <Line type="monotone" dataKey="medicaid_total_expenditures_billions" stroke="#0e7490" strokeWidth={2.5} name="Medicaid Expenditures (B)" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>{latestFinancingYear} State Financing Mix</CardTitle>
                  <CardDescription>
                    Top states by public mental health spending per capita, with financing composition split across Medicaid, state funds, other federal sources, and local/other sources.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-4">
                    Source legend: `URS` = direct SAMHSA public mental health spending/share data, `CMS` = direct Medicaid expenditure totals, `MHBG` = direct block grant values, `modeled` = harmonized fallback for uncovered state-years.
                  </p>
                  <ResponsiveContainer width="100%" height={460}>
                    <BarChart data={latestFinancingStates} margin={{ top: 5, right: 30, left: 0, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="abbreviation" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                        formatter={(value: number, name: string) => {
                          if (name === "public_mh_spending_per_capita") return [`$${value}`, "Public MH Spending per Capita"];
                          return [`${value}%`, name];
                        }}
                      />
                      <Legend />
                      <Bar dataKey="medicaid_share_of_public_mh" stackId="funding" fill="#0f766e" name="Medicaid Share" />
                      <Bar dataKey="state_share_of_public_mh" stackId="funding" fill="#2563eb" name="State Share" />
                      <Bar dataKey="other_federal_share_of_public_mh" stackId="funding" fill="#7c3aed" name="Other Federal Share" />
                      <Bar dataKey="local_other_share_of_public_mh" stackId="funding" fill="#94a3b8" name="Local / Other Share" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Need-Funding Gap Score With Statistical Validation</CardTitle>
                  <CardDescription>
                    Public mental health spending is modeled as a linear function of state need within each year. Predicted funding is the fitted per-capita spending value implied by that year&apos;s cross-state regression line for a given need index. The gap score is actual funding minus predicted funding, so negative values indicate underfunding relative to burden.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <label htmlFor="financing-analysis-year" className="text-xs font-medium text-muted-foreground">
                        Analysis year
                      </label>
                      <select
                        id="financing-analysis-year"
                        value={selectedFinancingAnalysisYear}
                        onChange={(event) => setSelectedFinancingAnalysisYear(Number(event.target.value) as FinancingYear)}
                        className="rounded-md border bg-background px-3 py-2 text-sm"
                      >
                        {FINANCING_YEARS.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Sheet>
                      <SheetTrigger asChild>
                        <button className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 transition-colors hover:bg-slate-50">
                          Export options
                        </button>
                      </SheetTrigger>
                      <SheetContent side="right" className="w-full sm:max-w-md">
                        <SheetHeader>
                          <SheetTitle>Financing export package</SheetTitle>
                          <SheetDescription>
                            Choose which financing tables to include in the ZIP for {selectedFinancingAnalysisYear}.
                          </SheetDescription>
                        </SheetHeader>
                        <div className="flex-1 space-y-4 overflow-y-auto px-4">
                          <label className="flex items-start gap-3 rounded-lg border p-3">
                            <Checkbox
                              checked={selectedExportTables.gapScores}
                              onCheckedChange={(checked) => toggleExportTable("gapScores", checked)}
                            />
                            <div>
                              <p className="text-sm font-medium text-foreground">Gap scores</p>
                              <p className="text-xs text-muted-foreground">
                                State-level need, actual funding, predicted funding, and mismatch values for {selectedFinancingAnalysisYear}.
                              </p>
                            </div>
                          </label>
                          <label className="flex items-start gap-3 rounded-lg border p-3">
                            <Checkbox
                              checked={selectedExportTables.persistence}
                              onCheckedChange={(checked) => toggleExportTable("persistence", checked)}
                            />
                            <div>
                              <p className="text-sm font-medium text-foreground">Persistence flags</p>
                              <p className="text-xs text-muted-foreground">
                                Cross-year persistent underinvestment summary and thresholds.
                              </p>
                            </div>
                          </label>
                          <label className="flex items-start gap-3 rounded-lg border p-3">
                            <Checkbox
                              checked={selectedExportTables.typology}
                              onCheckedChange={(checked) => toggleExportTable("typology", checked)}
                            />
                            <div>
                              <p className="text-sm font-medium text-foreground">Typology assignments</p>
                              <p className="text-xs text-muted-foreground">
                                Cluster assignments and financing characteristics for {selectedFinancingAnalysisYear}.
                              </p>
                            </div>
                          </label>
                          <label className="flex items-start gap-3 rounded-lg border p-3">
                            <Checkbox
                              checked={selectedExportTables.regression}
                              onCheckedChange={(checked) => toggleExportTable("regression", checked)}
                            />
                            <div>
                              <p className="text-sm font-medium text-foreground">Regression summary</p>
                              <p className="text-xs text-muted-foreground">
                                Need-funding slope, intercept, fit, and residual standard deviation for {selectedFinancingAnalysisYear}.
                              </p>
                            </div>
                          </label>
                        </div>
                        <SheetFooter>
                          <p className="text-xs text-muted-foreground">
                            {Object.values(selectedExportTables).filter(Boolean).length} table
                            {Object.values(selectedExportTables).filter(Boolean).length === 1 ? "" : "s"} selected
                          </p>
                          <button
                            onClick={downloadFinancingAnalyticsZip}
                            disabled={!Object.values(selectedExportTables).some(Boolean)}
                            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Download ZIP
                          </button>
                        </SheetFooter>
                      </SheetContent>
                    </Sheet>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        downloadCsv(`gap-scores-${selectedFinancingAnalysisYear}.csv`, getGapScoreExportRows(selectedFinancingAnalysisYear))
                      }
                      className="rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-slate-800"
                    >
                      Download gap scores CSV
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="rounded-lg bg-blue-50 p-4">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Slope</p>
                      <p className="text-xl font-bold text-foreground">${selectedNeedFundingRegression.slope}</p>
                    </div>
                    <div className="rounded-lg bg-indigo-50 p-4">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Intercept</p>
                      <p className="text-xl font-bold text-foreground">${selectedNeedFundingRegression.intercept}</p>
                    </div>
                    <div className="rounded-lg bg-teal-50 p-4">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">R²</p>
                      <p className="text-xl font-bold text-foreground">{selectedNeedFundingRegression.rSquared}</p>
                    </div>
                    <div className="rounded-lg bg-amber-50 p-4">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">t-statistic</p>
                      <p className="text-xl font-bold text-foreground">{selectedNeedFundingRegression.tStatistic}</p>
                    </div>
                    <div className="rounded-lg bg-rose-50 p-4">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Signal</p>
                      <p className="text-xl font-bold text-foreground">
                        {selectedNeedFundingRegression.significant ? "Need-aligned model" : "Weak model fit"}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-lg border bg-slate-50 p-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Predicted Funding</p>
                      <p className="text-sm text-foreground">
                        The fitted public mental health spending per capita implied by the selected year&apos;s linear regression of spending on the need index.
                      </p>
                    </div>
                    <div className="rounded-lg border bg-slate-50 p-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">{selectedFinancingAnalysisYear} Gap per Capita</p>
                      <p className="text-sm text-foreground">
                        The selected year&apos;s difference between actual public mental health spending per capita and predicted funding per capita for each state.
                      </p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={360}>
                    <BarChart data={persistentUnderinvestmentStates} margin={{ top: 5, right: 30, left: 0, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="abbreviation" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                        formatter={(value: number, name: string) => {
                          if (name === "Average Gap per Capita") return [`$${value}`, "Average Gap per Capita"];
                          if (name === `${selectedFinancingAnalysisYear} Gap per Capita`) {
                            return [`$${value}`, `${selectedFinancingAnalysisYear} Gap per Capita`];
                          }
                          return [`$${value}`, name];
                        }}
                      />
                      <Legend />
                      <Bar dataKey="average_gap_per_capita" fill="#dc2626" name="Average Gap per Capita" radius={[6, 6, 0, 0]} />
                      <Bar
                        dataKey="latest_gap_per_capita"
                        fill="#1d4ed8"
                        name={`${selectedFinancingAnalysisYear} Gap per Capita`}
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                  <p className="text-xs text-muted-foreground">
                    `Average Gap per Capita` summarizes each state&apos;s mean mismatch across the full financing panel. `{selectedFinancingAnalysisYear} Gap per Capita` shows only the currently selected analysis year, so the chart updates when the year selector changes.
                  </p>
                  <div className="rounded-lg border p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-1">
                      Need Index vs Public Mental Health Spending per Capita
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      The regression line shows predicted funding given need in {selectedFinancingAnalysisYear}. Labeled states are the largest positive or negative outliers relative to that line.
                    </p>
                    <ResponsiveContainer width="100%" height={340}>
                      <ComposedChart margin={{ top: 10, right: 25, left: 0, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis type="number" dataKey="need_index" stroke="#6b7280" name="Need Index" />
                        <YAxis
                          type="number"
                          dataKey="public_mh_spending_per_capita"
                          stroke="#6b7280"
                          name="Public MH Spending per Capita"
                        />
                        <Tooltip
                          cursor={{ strokeDasharray: "4 4" }}
                          contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                          labelFormatter={(_label: unknown, payload: any[]) =>
                            payload?.[0]?.payload
                              ? `${payload[0].payload.state} (${payload[0].payload.abbreviation})`
                              : ""
                          }
                          formatter={(value: number, name: string) => [
                            name === "public_mh_spending_per_capita" ? `$${value}` : value,
                            name === "public_mh_spending_per_capita" ? "Actual spending per capita" : "Predicted spending per capita",
                          ]}
                        />
                        <Legend />
                        <Scatter data={selectedNeedFundingScatter.points} name="States">
                          {selectedNeedFundingScatter.points.map((point) => (
                            <Cell
                              key={`${point.abbreviation}-${point.year}`}
                              fill={point.funding_gap_score >= 0 ? "#0f766e" : "#dc2626"}
                            />
                          ))}
                        </Scatter>
                        <Scatter
                          data={selectedNeedFundingScatter.outliers}
                          name="Labeled outliers"
                          fill="#1d4ed8"
                        >
                          <LabelList dataKey="abbreviation" position="top" />
                        </Scatter>
                        <Line
                          type="linear"
                          data={selectedNeedFundingScatter.line}
                          dataKey="predicted_public_mh_spending_per_capita"
                          stroke="#1d4ed8"
                          strokeWidth={2.5}
                          dot={false}
                          legendType="line"
                          name="Regression line"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Persistent Mental Health System Underinvestment</CardTitle>
                  <CardDescription>
                    States are flagged when average need-funding gap stays below ${persistentUnderinvestmentThreshold} per capita and the gap trend is flat or worsening.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => downloadCsv("persistent-underinvestment.csv", getPersistentUnderinvestmentExportRows())}
                      className="rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-slate-800"
                    >
                      Download persistence CSV
                    </button>
                  </div>
                  <div className="space-y-3">
                    {persistentUnderinvestmentStates.map((state, index) => (
                      <div key={state.abbreviation} className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <p className="font-semibold text-foreground">
                            #{index + 1} {state.state} ({state.abbreviation})
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {state.typology_cluster_label} • {Math.round(state.negative_gap_years_share * 100)}% of years under predicted funding
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-foreground">${state.average_gap_per_capita}</p>
                          <p className="text-xs text-muted-foreground">{state.gap_trend_per_year}/yr trend</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>{selectedFinancingAnalysisYear} Mental Health System Typology</CardTitle>
                  <CardDescription>
                    K-means clustering groups states by need, public financing, Medicaid financing share, and provider density into comparable mental health system types.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        downloadCsv(`typology-${selectedFinancingAnalysisYear}.csv`, getTypologyExportRows(selectedFinancingAnalysisYear))
                      }
                      className="rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-slate-800"
                    >
                      Download typology CSV
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedTypologySummary.map((cluster) => (
                      <div key={cluster.clusterId} className="rounded-lg border p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: cluster.color }} />
                          <p className="font-semibold text-foreground">{cluster.label}</p>
                          <span className="text-xs text-muted-foreground">{cluster.count} states</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{cluster.description}</p>
                        <p className="text-xs text-muted-foreground">{cluster.states.join(", ")}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Policy Context: Medicaid Expansion and Need-Resource Alignment</CardTitle>
                  <CardDescription>
                    Medicaid expansion status is merged into the state-year financing panel to compare whether expansion states are systematically less under-resourced relative to modeled need.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={expansionMismatchTrend} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="year" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                        formatter={(value: number, name: string) => [
                          value,
                          name === "expansion_mean_mismatch_index" ? "Expansion states" : "Non-expansion states",
                        ]}
                      />
                      <Legend />
                      <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 4" />
                      <Line
                        type="monotone"
                        dataKey="expansion_mean_mismatch_index"
                        stroke="#0f766e"
                        strokeWidth={2.5}
                        name="Expansion States"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="non_expansion_mean_mismatch_index"
                        stroke="#c2410c"
                        strokeWidth={2.5}
                        name="Non-expansion States"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="rounded-lg border p-4">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">
                            {selectedFinancingAnalysisYear} mismatch distribution by expansion status
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Each point is a state. Higher mismatch index values indicate more funding than predicted given need; lower values indicate greater underfunding.
                          </p>
                        </div>
                        <div className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                          Year: {selectedFinancingAnalysisYear}
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height={300}>
                        <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis
                            type="number"
                            dataKey="x_position"
                            domain={[-0.3, 1.3]}
                            ticks={[0, 1]}
                            stroke="#6b7280"
                            tickFormatter={(value) => (value === 1 ? "Expansion" : "Non-expansion")}
                          />
                          <YAxis type="number" dataKey="mismatch_index" stroke="#6b7280" />
                          <Tooltip
                            cursor={{ strokeDasharray: "4 4" }}
                            contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                            labelFormatter={(_label: unknown, payload: any[]) =>
                              payload?.[0]?.payload
                                ? `${payload[0].payload.state} (${payload[0].payload.abbreviation})`
                                : ""
                            }
                            formatter={(value: number, _name: string, item: any) => {
                              const payload = item.payload as (typeof expansionMismatchDistribution)[number];
                              return [value, `${payload.medicaid_expansion_label} mismatch index`];
                            }}
                          />
                          <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 4" />
                          <Scatter data={expansionMismatchDistribution} name="State-years">
                            {expansionMismatchDistribution.map((point) => (
                              <Cell
                                key={`${point.abbreviation}-${point.year}`}
                                fill={point.medicaid_expansion_status === 1 ? "#0f766e" : "#c2410c"}
                              />
                            ))}
                          </Scatter>
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="rounded-lg border p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">State-specific pre/post expansion trend</h3>
                          <p className="text-xs text-muted-foreground">
                            Track mismatch before and after the first full expansion year for late-adopting states.
                          </p>
                        </div>
                        <select
                          value={selectedExpansionState}
                          onChange={(event) => setSelectedExpansionState(event.target.value)}
                          className="rounded-md border bg-background px-3 py-2 text-sm"
                        >
                          {expansionTransitionStates.map((state) => (
                            <option key={state.abbreviation} value={state.abbreviation}>
                              {state.state}
                            </option>
                          ))}
                        </select>
                      </div>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={selectedExpansionStateTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="year" stroke="#6b7280" />
                          <YAxis stroke="#6b7280" />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                            formatter={(value: number) => [value, "Mismatch index"]}
                          />
                          <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 4" />
                          {selectedExpansionStateMeta && (
                            <ReferenceLine
                              x={selectedExpansionStateMeta.first_full_expansion_year}
                              stroke="#2563eb"
                              strokeDasharray="5 5"
                              label={{ value: "Expansion", fill: "#2563eb", position: "insideTopRight" }}
                            />
                          )}
                          <Line
                            type="monotone"
                            dataKey="mismatch_index"
                            stroke="#2563eb"
                            strokeWidth={2.5}
                            dot={{ r: 3 }}
                            name="Mismatch Index"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="rounded-lg border p-4">
                      <h3 className="text-sm font-semibold text-foreground mb-1">Average event-time pattern around expansion</h3>
                      <p className="text-xs text-muted-foreground mb-4">
                        Event-time view centered on each state&apos;s first full expansion year. This is descriptive and does not by itself identify a causal effect.
                      </p>
                      <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={expansionEventTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="event_time" stroke="#6b7280" />
                          <YAxis stroke="#6b7280" />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                            formatter={(value: number, name: string) => [
                              value,
                              name === "mean_mismatch_index" ? "Mean mismatch index" : "Mean gap per capita",
                            ]}
                          />
                          <ReferenceLine x={0} stroke="#2563eb" strokeDasharray="5 5" />
                          <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 4" />
                          <Line
                            type="monotone"
                            dataKey="mean_mismatch_index"
                            stroke="#7c3aed"
                            strokeWidth={2.5}
                            dot={{ r: 3 }}
                            name="Mean Mismatch Index"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="rounded-lg border p-4">
                      <h3 className="text-sm font-semibold text-foreground mb-4">Panel regression: mismatch index on Medicaid expansion</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-left text-muted-foreground">
                              <th className="py-2 pr-4 font-medium">Term</th>
                              <th className="py-2 pr-4 font-medium">Estimate</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b">
                              <td className="py-2 pr-4">Medicaid expansion status</td>
                              <td className="py-2 pr-4">{medicaidExpansionPolicyRegression.coefficient}</td>
                            </tr>
                            <tr className="border-b">
                              <td className="py-2 pr-4">Standard error</td>
                              <td className="py-2 pr-4">{medicaidExpansionPolicyRegression.standardError}</td>
                            </tr>
                            <tr className="border-b">
                              <td className="py-2 pr-4">t-statistic</td>
                              <td className="py-2 pr-4">{medicaidExpansionPolicyRegression.tStatistic}</td>
                            </tr>
                            <tr className="border-b">
                              <td className="py-2 pr-4">Within R²</td>
                              <td className="py-2 pr-4">{medicaidExpansionPolicyRegression.withinRSquared}</td>
                            </tr>
                            <tr className="border-b">
                              <td className="py-2 pr-4">State fixed effects</td>
                              <td className="py-2 pr-4">Included</td>
                            </tr>
                            <tr className="border-b">
                              <td className="py-2 pr-4">Year fixed effects</td>
                              <td className="py-2 pr-4">Included</td>
                            </tr>
                            <tr>
                              <td className="py-2 pr-4">Panel size</td>
                              <td className="py-2 pr-4">
                                {medicaidExpansionPolicyRegression.sampleSize} state-years ({medicaidExpansionPolicyRegression.stateCount} states, {medicaidExpansionPolicyRegression.yearCount} years)
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-4 space-y-3 text-sm">
                        <p className="text-foreground">{medicaidExpansionPolicyRegression.interpretation}</p>
                        <p className="text-muted-foreground">
                          Controls omitted from this specification: {medicaidExpansionPolicyRegression.controlsOmitted.join("; ")}.
                        </p>
                        <p className="text-muted-foreground">
                          {medicaidExpansionPolicyRegression.caution}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* Comparative Analysis */}
      <section className="container mx-auto px-4 py-16">
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-2">Comparative Analysis</h2>
          <p className="text-muted-foreground">
            View all four metrics together to understand the interconnected nature of mental health trends.
          </p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>All Metrics Over Time</CardTitle>
            <CardDescription>
              Normalized view of all mental health indicators (scaled to 0-100 for comparison)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={trendData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
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
                <Line
                  type="monotone"
                  dataKey="ami"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={false}
                  name="AMI %"
                />
                <Line
                  type="monotone"
                  dataKey="smi"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={false}
                  name="SMI %"
                />
                <Line
                  type="monotone"
                  dataKey="mde_youth"
                  stroke="#ec4899"
                  strokeWidth={2}
                  dot={false}
                  name="Youth MDE %"
                />
                <Line
                  type="monotone"
                  dataKey="suicide"
                  stroke="#a855f7"
                  strokeWidth={2}
                  dot={false}
                  name="Suicide Rate"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg mt-8">
          <CardHeader>
            <CardTitle>Mental Health Resource Availability (Top States)</CardTitle>
            <CardDescription>
              Official HRSA workforce capacity and SAMHSA crisis-capable facility density across states with the strongest service availability
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={resourceAvailabilityData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="state" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number, name: string) =>
                    name === "Crisis-Capable Facilities"
                      ? `${value} per 1M`
                      : `${value} per 100k`
                  }
                />
                <Legend />
                <Bar dataKey="providers_per_100k" fill="#0ea5e9" name="All Providers" radius={[6, 6, 0, 0]} />
                <Bar dataKey="therapists_per_100k" fill="#06b6d4" name="Therapists" radius={[6, 6, 0, 0]} />
                <Bar dataKey="psychiatrists_per_100k" fill="#0284c7" name="Psychiatrists" radius={[6, 6, 0, 0]} />
                <Bar dataKey="crisis_centers_per_million" fill="#0891b2" name="Crisis-Capable Facilities" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      {/* Key Takeaways */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-teal-50 to-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-teal-600" />
                Rising Trends
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-foreground">
                <span className="font-semibold">Adult Mental Illness:</span> Increased 30% over 20 years, with acceleration post-2018
              </p>
              <p className="text-sm text-foreground">
                <span className="font-semibold">Youth Depression:</span> More than doubled, indicating a generational mental health crisis
              </p>
              <p className="text-sm text-foreground">
                <span className="font-semibold">Suicide Mortality:</span> Increased 32% overall, with significant year-to-year volatility
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-amber-600" />
                What This Means
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-foreground">
                <span className="font-semibold">Growing Need:</span> More Americans are experiencing mental health challenges, requiring expanded access to care
              </p>
              <p className="text-sm text-foreground">
                <span className="font-semibold">Youth Crisis:</span> Adolescent mental health deterioration suggests need for early intervention and school-based support
              </p>
              <p className="text-sm text-foreground">
                <span className="font-semibold">Prevention Focus:</span> Rising suicide rates underscore importance of prevention, awareness, and accessible mental health services
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Resources Section */}
      <section className="container mx-auto px-4 py-16 mb-12">
        <Card className="border-0 shadow-lg mb-8">
          <CardHeader>
            <CardTitle>Sources & Methodology</CardTitle>
            <CardDescription>
              Official citations for the national mental health trend data used in this dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {citationLinks.map((source) => (
              <div key={source.href} className="rounded-lg border bg-card p-4">
                <a
                  href={source.href}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-primary underline-offset-4 hover:underline"
                >
                  {source.title}
                </a>
                <p className="mt-1 text-sm text-muted-foreground">{source.description}</p>
              </div>
            ))}
            <p className="text-sm text-muted-foreground">
              Interpretation note: U.S. national trend figures are source-aligned. State-level AMI, SMI, adult MDE, youth MDE, substance use disorder, alcohol use disorder, and opioid use disorder come from official SAMHSA NSDUH 2023-2024 tables; suicide mortality comes from the official CDC NCHS 2023 state table; resource-capacity layers come from HRSA AHRF and SAMHSA N-SUMHSS; and the financing layer now uses direct SAMHSA MHBG award tables, direct SAMHSA URS state financing extracts where available, direct CMS Financial Management Report Medicaid expenditure workbooks where available, and KFF policy context for the broader state-year comparison view. Country comparisons, forecast layers, burden-resource gap views, and the remaining disorder-specific state series are still mixed or modeled for visualization and planning discussion.
            </p>
            <div className="pt-2">
              <h4 className="font-semibold text-foreground mb-3">Metric Provenance Status</h4>
              <div className="space-y-3">
                {metricProvenance.map((item) => (
                  <div key={item.metric} className="rounded-lg border bg-card p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-semibold text-foreground">{item.label}</p>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          item.tier === "official"
                            ? "bg-emerald-100 text-emerald-800"
                            : item.tier === "mixed"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {item.tier}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-foreground">{item.status}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.notes}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardHeader>
            <CardTitle>Get Support</CardTitle>
            <CardDescription>
              If you or someone you know is struggling with mental health, support is available
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">National Suicide Prevention Lifeline</h4>
                <p className="text-sm text-muted-foreground">Call or text 988 (available 24/7)</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Crisis Text Line</h4>
                <p className="text-sm text-muted-foreground">Text HOME to 741741</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">SAMHSA National Helpline</h4>
                <p className="text-sm text-muted-foreground">1-800-662-4357 (free, confidential, 24/7)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
