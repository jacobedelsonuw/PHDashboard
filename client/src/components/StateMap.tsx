import { useState } from "react";
import { stateData, generateForecast, getStateResources, getMetricColor, StateData } from "@/data/stateData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { Phone, MessageCircle, Users, Stethoscope, TrendingUp } from "lucide-react";

interface StateMapProps {
  metric?: "ami" | "smi" | "mde_youth" | "suicide_rate";
}

export default function StateMap({ metric = "ami" }: StateMapProps) {
  const [hoveredState, setHoveredState] = useState<StateData | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<"ami" | "smi" | "mde_youth" | "suicide_rate">(metric);

  const metricLabels = {
    ami: "Any Mental Illness (%)",
    smi: "Serious Mental Illness (%)",
    mde_youth: "Youth Depression (%)",
    suicide_rate: "Suicide Rate (per 100k)",
  };

  const metricColors = {
    ami: "#8b5cf6",
    smi: "#f97316",
    mde_youth: "#ec4899",
    suicide_rate: "#a855f7",
  };

  // Get sorted states for ranking
  const sortedStates = [...stateData].sort((a, b) => {
    const aVal = a[selectedMetric];
    const bVal = b[selectedMetric];
    return bVal - aVal;
  });

  const topStates = sortedStates.slice(0, 5);
  const bottomStates = sortedStates.slice(-5).reverse();

  // Calculate map dimensions
  const mapWidth = 960;
  const mapHeight = 600;
  const padding = 40;

  // Normalize coordinates to fit in SVG
  const minLat = Math.min(...stateData.map(s => s.lat));
  const maxLat = Math.max(...stateData.map(s => s.lat));
  const minLng = Math.min(...stateData.map(s => s.lng));
  const maxLng = Math.max(...stateData.map(s => s.lng));

  const latRange = maxLat - minLat;
  const lngRange = maxLng - minLng;

  const getX = (lng: number) => {
    return padding + ((lng - minLng) / lngRange) * (mapWidth - 2 * padding);
  };

  const getY = (lat: number) => {
    return mapHeight - padding - ((lat - minLat) / latRange) * (mapHeight - 2 * padding);
  };

  return (
    <div className="space-y-6">
      {/* Metric Selector */}
      <div className="flex gap-2 flex-wrap">
        {(["ami", "smi", "mde_youth", "suicide_rate"] as const).map((m) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Map Area */}
        <div className="lg:col-span-3">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>US Mental Health Geographic Map</CardTitle>
              <CardDescription>Hover over states to see detailed metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-b from-blue-50 to-blue-100 p-4 rounded-lg overflow-auto">
                <svg width="100%" height={mapHeight} viewBox={`0 0 ${mapWidth} ${mapHeight}`} className="bg-white rounded">
                  {/* State circles */}
                  {stateData.map((state) => {
                    const value = state[selectedMetric];
                    const isHovered = hoveredState?.abbreviation === state.abbreviation;
                    const color = getMetricColor(selectedMetric, value);
                    const x = getX(state.lng);
                    const y = getY(state.lat);
                    const radius = isHovered ? 28 : 22;

                    return (
                      <g key={state.abbreviation}>
                        {/* Background circle */}
                        <circle
                          cx={x}
                          cy={y}
                          r={radius}
                          fill={color}
                          opacity={isHovered ? 1 : 0.8}
                          className="transition-all cursor-pointer hover:opacity-100"
                          onMouseEnter={() => setHoveredState(state)}
                          onMouseLeave={() => setHoveredState(null)}
                          onClick={() => setHoveredState(state)}
                          style={{
                            filter: isHovered ? "drop-shadow(0 0 8px rgba(0,0,0,0.3))" : "none",
                          }}
                        />
                        {/* State label */}
                        <text
                          x={x}
                          y={y}
                          textAnchor="middle"
                          dy="0.3em"
                          className="font-bold text-xs pointer-events-none select-none"
                          fill={value > 22 ? "white" : "black"}
                          fontSize={isHovered ? 11 : 9}
                        >
                          {state.abbreviation}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Legend */}
              <div className="mt-6 flex items-center gap-4 flex-wrap">
                <span className="text-sm font-semibold text-foreground">Legend:</span>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: "#10b981" }} />
                  <span className="text-sm text-muted-foreground">Lowest</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: "#eab308" }} />
                  <span className="text-sm text-muted-foreground">Medium</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: "#dc2626" }} />
                  <span className="text-sm text-muted-foreground">Highest</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {hoveredState ? (
            <>
              <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 to-accent/5">
                <CardHeader>
                  <CardTitle className="text-2xl">{hoveredState.state}</CardTitle>
                  <CardDescription>{hoveredState.abbreviation}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Any Mental Illness</p>
                      <p className="text-2xl font-bold text-foreground">{hoveredState.ami}%</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Serious Mental Illness</p>
                      <p className="text-2xl font-bold text-foreground">{hoveredState.smi}%</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Youth Depression</p>
                      <p className="text-2xl font-bold text-foreground">{hoveredState.mde_youth}%</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Suicide Rate</p>
                      <p className="text-2xl font-bold text-foreground">{hoveredState.suicide_rate}</p>
                      <p className="text-xs text-muted-foreground">per 100,000</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Treatment Access</p>
                      <p className="text-2xl font-bold text-foreground">{hoveredState.treatment_access}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Ranking */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-sm">Ranking by {metricLabels[selectedMetric]}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {sortedStates.map((state, idx) => (
                      <div
                        key={state.abbreviation}
                        className={`flex items-center justify-between p-2 rounded text-sm ${
                          state.abbreviation === hoveredState.abbreviation ? "bg-primary/10 font-semibold" : ""
                        }`}
                      >
                        <span>
                          #{idx + 1} {state.abbreviation}
                        </span>
                        <span style={{ color: metricColors[selectedMetric] }}>
                          {state[selectedMetric]}
                          {selectedMetric === "suicide_rate" ? "" : "%"}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="border-0 shadow-lg bg-muted/30">
              <CardHeader>
                <CardTitle className="text-sm">Hover over a state</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Click or hover over any state circle to see detailed metrics, rankings, resources, and forecasts.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* State Details and Forecast */}
      {hoveredState && (
        <>
          {/* Resources */}
          {getStateResources(hoveredState.abbreviation) && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Mental Health Resources in {hoveredState.state}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm">Crisis Hotline</p>
                        <p className="text-sm text-muted-foreground">{getStateResources(hoveredState.abbreviation)?.hotline}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MessageCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm">Crisis Text Line</p>
                        <p className="text-sm text-muted-foreground">{getStateResources(hoveredState.abbreviation)?.crisis_text}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Stethoscope className="w-4 h-4" />
                        Healthcare Providers
                      </p>
                      <div className="text-sm space-y-1 text-muted-foreground">
                        <p>Mental Health Providers: {getStateResources(hoveredState.abbreviation)?.mental_health_providers}</p>
                        <p>Psychiatrists: {getStateResources(hoveredState.abbreviation)?.psychiatrists}</p>
                        <p>Therapists: {getStateResources(hoveredState.abbreviation)?.therapists}</p>
                        <p>Crisis Centers: {getStateResources(hoveredState.abbreviation)?.crisis_centers}</p>
                      </div>
                    </div>
                  </div>
                </div>
                {getStateResources(hoveredState.abbreviation)?.support_organizations && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="font-semibold text-sm mb-2">Support Organizations</p>
                    <div className="flex flex-wrap gap-2">
                      {getStateResources(hoveredState.abbreviation)?.support_organizations.map((org, idx) => (
                        <span key={idx} className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">
                          {org}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Forecast */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                10-Year Forecast for {hoveredState.state}
              </CardTitle>
              <CardDescription>Projected mental health trends through 2034</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={generateForecast(hoveredState)} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
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
                    name="AMI %"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="smi"
                    stroke="#f97316"
                    strokeWidth={2}
                    name="SMI %"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="mde_youth"
                    stroke="#ec4899"
                    strokeWidth={2}
                    name="Youth MDE %"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="suicide_rate"
                    stroke="#a855f7"
                    strokeWidth={2}
                    name="Suicide Rate"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-foreground">
                  <span className="font-semibold">Forecast Note:</span> These projections are based on current trends and assume continuation of existing patterns. Actual outcomes may vary based on policy changes, resource allocation, and intervention effectiveness.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Comparative Analysis */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>State vs National Average</CardTitle>
              <CardDescription>How {hoveredState.state} compares to the US average</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    {
                      metric: "AMI",
                      state: hoveredState.ami,
                      national: 23.4,
                    },
                    {
                      metric: "SMI",
                      state: hoveredState.smi,
                      national: 5.6,
                    },
                    {
                      metric: "Youth MDE",
                      state: hoveredState.mde_youth,
                      national: 20.2,
                    },
                    {
                      metric: "Suicide Rate",
                      state: hoveredState.suicide_rate,
                      national: 14.5,
                    },
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
                  <Bar dataKey="state" fill={metricColors[selectedMetric]} name={`${hoveredState.abbreviation}`} />
                  <Bar dataKey="national" fill="#cbd5e1" name="US Average" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
