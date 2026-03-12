export interface CountryData {
  country: string;
  code: string;
  ami: number;
  smi: number;
  mde_adult: number;
  mde_youth: number;
  suicide_rate: number;
  anxiety_disorder: number;
  ptsd: number;
  substance_use_disorder: number;
  opioid_use_disorder: number;
  alcohol_use_disorder: number;
  bipolar_disorder: number;
  schizophrenia: number;
  eating_disorder: number;
  adhd: number;
}

export const countryData: CountryData[] = [
  { country: "United States of America", code: "USA", ami: 23.4, smi: 5.6, mde_adult: 12.5, mde_youth: 20.2, suicide_rate: 14.5, anxiety_disorder: 17.8, ptsd: 5.4, substance_use_disorder: 9.5, opioid_use_disorder: 2.8, alcohol_use_disorder: 6.2, bipolar_disorder: 2.9, schizophrenia: 1.0, eating_disorder: 1.6, adhd: 7.3 },
  { country: "Canada", code: "CAN", ami: 22.1, smi: 5.0, mde_adult: 11.9, mde_youth: 19.1, suicide_rate: 11.8, anxiety_disorder: 16.9, ptsd: 4.7, substance_use_disorder: 8.8, opioid_use_disorder: 2.3, alcohol_use_disorder: 5.9, bipolar_disorder: 2.6, schizophrenia: 0.9, eating_disorder: 1.4, adhd: 6.9 },
  { country: "Mexico", code: "MEX", ami: 19.4, smi: 4.2, mde_adult: 10.1, mde_youth: 16.3, suicide_rate: 6.3, anxiety_disorder: 14.1, ptsd: 3.8, substance_use_disorder: 7.2, opioid_use_disorder: 1.4, alcohol_use_disorder: 5.5, bipolar_disorder: 2.1, schizophrenia: 0.7, eating_disorder: 1.0, adhd: 5.8 },
  { country: "Brazil", code: "BRA", ami: 20.8, smi: 4.7, mde_adult: 11.3, mde_youth: 17.9, suicide_rate: 8.1, anxiety_disorder: 16.1, ptsd: 4.1, substance_use_disorder: 7.9, opioid_use_disorder: 1.6, alcohol_use_disorder: 5.7, bipolar_disorder: 2.4, schizophrenia: 0.8, eating_disorder: 1.2, adhd: 6.1 },
  { country: "Argentina", code: "ARG", ami: 21.6, smi: 4.9, mde_adult: 11.7, mde_youth: 18.5, suicide_rate: 9.6, anxiety_disorder: 16.7, ptsd: 4.4, substance_use_disorder: 8.3, opioid_use_disorder: 1.8, alcohol_use_disorder: 6.0, bipolar_disorder: 2.6, schizophrenia: 0.9, eating_disorder: 1.4, adhd: 6.4 },
  { country: "United Kingdom", code: "GBR", ami: 21.9, smi: 5.1, mde_adult: 11.9, mde_youth: 18.8, suicide_rate: 10.5, anxiety_disorder: 16.8, ptsd: 4.8, substance_use_disorder: 8.5, opioid_use_disorder: 2.1, alcohol_use_disorder: 6.1, bipolar_disorder: 2.6, schizophrenia: 0.9, eating_disorder: 1.5, adhd: 6.5 },
  { country: "France", code: "FRA", ami: 20.7, smi: 4.6, mde_adult: 11.1, mde_youth: 17.6, suicide_rate: 12.1, anxiety_disorder: 16.0, ptsd: 4.2, substance_use_disorder: 8.0, opioid_use_disorder: 1.9, alcohol_use_disorder: 5.8, bipolar_disorder: 2.4, schizophrenia: 0.8, eating_disorder: 1.3, adhd: 6.2 },
  { country: "Germany", code: "DEU", ami: 20.9, smi: 4.7, mde_adult: 11.2, mde_youth: 17.7, suicide_rate: 11.3, anxiety_disorder: 16.2, ptsd: 4.3, substance_use_disorder: 8.2, opioid_use_disorder: 1.9, alcohol_use_disorder: 5.9, bipolar_disorder: 2.4, schizophrenia: 0.8, eating_disorder: 1.3, adhd: 6.3 },
  { country: "Italy", code: "ITA", ami: 19.8, smi: 4.3, mde_adult: 10.6, mde_youth: 16.8, suicide_rate: 7.5, anxiety_disorder: 15.2, ptsd: 3.9, substance_use_disorder: 7.5, opioid_use_disorder: 1.5, alcohol_use_disorder: 5.2, bipolar_disorder: 2.2, schizophrenia: 0.7, eating_disorder: 1.2, adhd: 5.9 },
  { country: "Spain", code: "ESP", ami: 20.1, smi: 4.4, mde_adult: 10.8, mde_youth: 17.0, suicide_rate: 8.4, anxiety_disorder: 15.4, ptsd: 4.0, substance_use_disorder: 7.6, opioid_use_disorder: 1.6, alcohol_use_disorder: 5.3, bipolar_disorder: 2.2, schizophrenia: 0.7, eating_disorder: 1.2, adhd: 6.0 },
  { country: "India", code: "IND", ami: 18.1, smi: 3.8, mde_adult: 9.7, mde_youth: 15.2, suicide_rate: 11.4, anxiety_disorder: 13.4, ptsd: 3.5, substance_use_disorder: 6.8, opioid_use_disorder: 1.3, alcohol_use_disorder: 4.9, bipolar_disorder: 1.9, schizophrenia: 0.7, eating_disorder: 0.9, adhd: 5.4 },
  { country: "China", code: "CHN", ami: 17.4, smi: 3.7, mde_adult: 9.4, mde_youth: 14.8, suicide_rate: 7.9, anxiety_disorder: 13.0, ptsd: 3.3, substance_use_disorder: 6.4, opioid_use_disorder: 1.1, alcohol_use_disorder: 4.7, bipolar_disorder: 1.8, schizophrenia: 0.7, eating_disorder: 0.8, adhd: 5.2 },
  { country: "Japan", code: "JPN", ami: 18.8, smi: 4.0, mde_adult: 10.1, mde_youth: 15.9, suicide_rate: 12.6, anxiety_disorder: 14.4, ptsd: 3.8, substance_use_disorder: 6.7, opioid_use_disorder: 1.0, alcohol_use_disorder: 4.8, bipolar_disorder: 2.0, schizophrenia: 0.8, eating_disorder: 1.1, adhd: 5.5 },
  { country: "Republic of Korea", code: "KOR", ami: 19.3, smi: 4.2, mde_adult: 10.3, mde_youth: 16.1, suicide_rate: 24.1, anxiety_disorder: 14.8, ptsd: 3.9, substance_use_disorder: 6.9, opioid_use_disorder: 1.1, alcohol_use_disorder: 5.1, bipolar_disorder: 2.1, schizophrenia: 0.8, eating_disorder: 1.1, adhd: 5.6 },
  { country: "Australia", code: "AUS", ami: 22.4, smi: 5.2, mde_adult: 12.1, mde_youth: 19.4, suicide_rate: 12.4, anxiety_disorder: 17.2, ptsd: 4.9, substance_use_disorder: 8.9, opioid_use_disorder: 2.2, alcohol_use_disorder: 6.2, bipolar_disorder: 2.7, schizophrenia: 0.9, eating_disorder: 1.5, adhd: 6.8 },
  { country: "New Zealand", code: "NZL", ami: 22.9, smi: 5.4, mde_adult: 12.3, mde_youth: 19.9, suicide_rate: 13.7, anxiety_disorder: 17.5, ptsd: 5.0, substance_use_disorder: 9.1, opioid_use_disorder: 2.2, alcohol_use_disorder: 6.3, bipolar_disorder: 2.8, schizophrenia: 1.0, eating_disorder: 1.5, adhd: 6.9 },
  { country: "South Africa", code: "ZAF", ami: 20.4, smi: 4.8, mde_adult: 11.4, mde_youth: 18.0, suicide_rate: 11.0, anxiety_disorder: 15.9, ptsd: 5.1, substance_use_disorder: 8.4, opioid_use_disorder: 1.8, alcohol_use_disorder: 6.4, bipolar_disorder: 2.4, schizophrenia: 0.9, eating_disorder: 1.1, adhd: 6.0 },
  { country: "Nigeria", code: "NGA", ami: 17.0, smi: 3.6, mde_adult: 9.2, mde_youth: 14.6, suicide_rate: 9.0, anxiety_disorder: 12.7, ptsd: 3.6, substance_use_disorder: 6.5, opioid_use_disorder: 1.2, alcohol_use_disorder: 4.8, bipolar_disorder: 1.8, schizophrenia: 0.7, eating_disorder: 0.8, adhd: 5.1 },
  { country: "Russian Federation", code: "RUS", ami: 19.7, smi: 4.5, mde_adult: 10.7, mde_youth: 16.9, suicide_rate: 21.3, anxiety_disorder: 15.3, ptsd: 4.1, substance_use_disorder: 8.7, opioid_use_disorder: 2.0, alcohol_use_disorder: 6.8, bipolar_disorder: 2.3, schizophrenia: 0.9, eating_disorder: 1.1, adhd: 5.9 },
];
