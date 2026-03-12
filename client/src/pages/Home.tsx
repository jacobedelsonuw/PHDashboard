import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { TrendingUp, Users, Heart, AlertCircle, Map } from "lucide-react";
import { useEffect, useState } from "react";
import ChoroplethMap from "@/components/ChoroplethMap";
import CountryChoroplethMap from "@/components/CountryChoroplethMap";
import { nationalTrendData } from "@/data/nationalTrendData";
import { getStateResources, stateData } from "@/data/stateData";
import { FINANCING_YEARS, getNationalFinancingTrend, getStateFinancingByYear } from "@/data/stateFinancingData";
import { citationLinks, metricProvenance } from "@shared/dataProvenance";

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
  const [animatedValues, setAnimatedValues] = useState({
    ami: 0,
    smi: 0,
    youth: 0,
    suicide: 0,
  });
  const [geoScope, setGeoScope] = useState<"states" | "countries">("states");
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
  const latestFinancingStates = getStateFinancingByYear(latestFinancingYear)
    .sort((a, b) => b.public_mh_spending_per_capita - a.public_mh_spending_per_capita)
    .slice(0, 12);
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
            National trend lines are aligned to official U.S. sources listed below. State AMI, SMI, adult MDE, youth MDE, substance use disorder, alcohol use disorder, opioid use disorder, suicide mortality, and resource availability now use official federal source files; the financing layer now incorporates direct SAMHSA MHBG award tables, direct CMS Financial Management Report Medicaid expenditure workbooks where available, and KFF policy context into an annual state comparison view. A direct SAMHSA URS extractor is now included in the repo for the next financing-source materialization pass. Country comparisons, burden-resource gap scoring, and the remaining disorder layers are still mixed or modeled.
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
                  Stacked state-colored trend view (top 10 states + others) from 2004 to 2024.
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
                      formatter={(value: number, name: string) => [`${value}%`, amiStateTrend.labels[name] ?? name]}
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
                  Stacked state-colored trend view (top 10 states + others) from 2004 to 2024.
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
                      formatter={(value: number, name: string) => [`${value}%`, smiStateTrend.labels[name] ?? name]}
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
                  Stacked state-colored trend view (top 10 states + others) from 2004 to 2024.
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
                      formatter={(value: number, name: string) => [`${value}%`, youthStateTrend.labels[name] ?? name]}
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
                  Stacked state-colored trend view (top 10 states + others) from 2004 to 2024.
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
                      formatter={(value: number, name: string) => [`${value}`, suicideStateTrend.labels[name] ?? name]}
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
                  Stacked over-time trend of disorder prevalence across the United States.
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
                      formatter={(value: number, name: string) => [`${value}%`, disorderLabels[name as keyof typeof disorderLabels] ?? name]}
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
              {geoScope === "states" ? <ChoroplethMap metric="ami" /> : <CountryChoroplethMap metric="ami" />}
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
                  <ResponsiveContainer width="100%" height={420}>
                    <LineChart data={nationalFinancingTrend} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="year" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                        formatter={(value: number, name: string) => {
                          if (name === "medicaid_total_expenditures_billions") return [`$${value}B`, "Medicaid Expenditures"];
                          if (name === "medicaid_share_of_public_mh") return [`${value}%`, "Avg Medicaid Share of Public MH"];
                          return [`$${Number(value).toLocaleString()}M`, name === "mhbg_allotment_millions" ? "MHBG Allotment" : name === "federal_mental_health_funding_millions" ? "Federal Mental Health Funding" : "Public MH Spending"];
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
              Interpretation note: U.S. national trend figures are source-aligned. State-level AMI, SMI, adult MDE, youth MDE, substance use disorder, alcohol use disorder, and opioid use disorder come from official SAMHSA NSDUH 2023-2024 tables; suicide mortality comes from the official CDC NCHS 2023 state table; resource-capacity layers come from HRSA AHRF and SAMHSA N-SUMHSS; and the financing layer now uses direct SAMHSA MHBG award tables, direct CMS Financial Management Report Medicaid expenditure workbooks where available, and KFF policy context for the broader state-year comparison view. A direct SAMHSA URS extractor is also included for the next financing-source materialization pass. Country comparisons, forecast layers, burden-resource gap views, and the remaining disorder-specific state series are still mixed or modeled for visualization and planning discussion.
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
