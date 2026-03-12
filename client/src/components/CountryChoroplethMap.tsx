import { useMemo, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getMetricColor } from "@/data/stateData";
import { countryData, CountryData } from "@/data/countryData";
import { feature } from "topojson-client";
import worldAtlas from "world-atlas/countries-110m.json";
import "leaflet/dist/leaflet.css";

type Metric =
  | "ami"
  | "smi"
  | "mde_adult"
  | "mde_youth"
  | "suicide_rate"
  | "anxiety_disorder"
  | "ptsd"
  | "substance_use_disorder"
  | "opioid_use_disorder"
  | "alcohol_use_disorder"
  | "bipolar_disorder"
  | "schizophrenia"
  | "eating_disorder"
  | "adhd";

const METRICS: Metric[] = [
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
};

interface CountryChoroplethMapProps {
  metric?: Metric;
}

export default function CountryChoroplethMap({ metric = "ami" }: CountryChoroplethMapProps) {
  const [hoveredCountry, setHoveredCountry] = useState<CountryData | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<Metric>(metric);

  const worldGeoJSON = useMemo(
    () => feature(worldAtlas as any, (worldAtlas as any).objects.countries) as any,
    []
  );
  const countryByName = useMemo(
    () => new Map(countryData.map((country) => [country.country, country])),
    []
  );
  const sortedCountries = [...countryData].sort((a, b) => b[selectedMetric] - a[selectedMetric]);
  const geoJsonKey = `${selectedMetric}-${hoveredCountry?.code || ""}`;

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        {METRICS.map((m) => (
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
          <CardTitle>Country-Level Mental Health Choropleth</CardTitle>
          <CardDescription>Country-level prevalence and severity by selected metric</CardDescription>
        </CardHeader>
        <CardContent>
          <div style={{ height: "600px", borderRadius: "8px", overflow: "hidden" }}>
            <MapContainer center={[20, 0] as any} zoom={2} style={{ height: "100%", width: "100%" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <GeoJSON
                key={`fill-${geoJsonKey}`}
                data={worldGeoJSON}
                style={(feature: any) => {
                  const country = countryByName.get(feature.properties.name);
                  const isHovered = hoveredCountry?.code === country?.code;
                  if (!country) {
                    return {
                      fillColor: "#e5e7eb",
                      color: "transparent",
                      weight: 0,
                      fillOpacity: 0.45,
                      opacity: 1,
                    };
                  }

                  return {
                    fillColor: getMetricColor(selectedMetric, country[selectedMetric]),
                    color: "transparent",
                    weight: 0,
                    fillOpacity: isHovered ? 1 : 0.85,
                    opacity: 1,
                  };
                }}
                onEachFeature={(feature: any, layer: any) => {
                  const country = countryByName.get(feature.properties.name);
                  if (!country) return;
                  const value = country[selectedMetric];
                  layer.bindPopup(
                    `<strong>${country.country}</strong><br/>${metricLabels[selectedMetric]}: ${value}${
                      selectedMetric === "suicide_rate" ? "" : "%"
                    }`
                  );
                  layer.on("click", () => setSelectedCountry(country));
                  layer.on("mouseover", () => setHoveredCountry(country));
                  layer.on("mouseout", () => setHoveredCountry(null));
                }}
              />
              <GeoJSON
                key={`borders-${selectedMetric}`}
                data={worldGeoJSON}
                interactive={false}
                style={() => ({
                  fill: false,
                  color: "#ffffff",
                  weight: 0.7,
                  opacity: 1,
                  lineJoin: "round",
                  lineCap: "round",
                })}
              />
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Country Rankings by {metricLabels[selectedMetric]}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-sm mb-3">Highest</h4>
              <div className="space-y-2">
                {sortedCountries.slice(0, 5).map((country, idx) => (
                  <div
                    key={country.code}
                    className="flex items-center justify-between p-2 rounded cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => setSelectedCountry(country)}
                  >
                    <span className="text-sm">
                      #{idx + 1} {country.country}
                    </span>
                    <span className="font-bold">
                      {country[selectedMetric]}
                      {selectedMetric === "suicide_rate" ? "" : "%"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Lowest</h4>
              <div className="space-y-2">
                {sortedCountries.slice(-5).reverse().map((country, idx) => (
                  <div
                    key={country.code}
                    className="flex items-center justify-between p-2 rounded cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => setSelectedCountry(country)}
                  >
                    <span className="text-sm">
                      #{sortedCountries.length - idx} {country.country}
                    </span>
                    <span className="font-bold">
                      {country[selectedMetric]}
                      {selectedMetric === "suicide_rate" ? "" : "%"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedCountry} onOpenChange={(open) => !open && setSelectedCountry(null)}>
        <DialogContent className="max-w-2xl">
          {selectedCountry && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedCountry.country}</DialogTitle>
                <DialogDescription>{selectedCountry.code}</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {METRICS.map((m) => (
                  <div key={m} className="p-3 rounded-lg bg-muted/40">
                    <p className="text-xs font-semibold text-muted-foreground">{metricLabels[m]}</p>
                    <p className="text-lg font-bold">
                      {selectedCountry[m]}
                      {m === "suicide_rate" ? "" : "%"}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
