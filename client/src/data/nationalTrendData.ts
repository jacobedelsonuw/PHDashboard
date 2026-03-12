export const nationalTrendData = [
  { year: 2004, ami: 18.0, smi: 4.3, suicide: 11.0, mde_youth: 8.7 },
  { year: 2005, ami: 18.1, smi: 4.2, suicide: 10.9, mde_youth: 8.8 },
  { year: 2006, ami: 18.0, smi: 4.1, suicide: 11.0, mde_youth: 8.5 },
  { year: 2007, ami: 18.1, smi: 4.0, suicide: 11.3, mde_youth: 8.2 },
  { year: 2008, ami: 17.7, smi: 3.7, suicide: 11.6, mde_youth: 8.3 },
  { year: 2009, ami: 18.1, smi: 4.0, suicide: 11.8, mde_youth: 8.1 },
  { year: 2010, ami: 18.1, smi: 4.1, suicide: 12.1, mde_youth: 8.0 },
  { year: 2011, ami: 17.8, smi: 3.9, suicide: 12.3, mde_youth: 8.2 },
  { year: 2012, ami: 18.6, smi: 4.1, suicide: 12.6, mde_youth: 9.1 },
  { year: 2013, ami: 18.5, smi: 4.2, suicide: 12.6, mde_youth: 10.7 },
  { year: 2014, ami: 18.1, smi: 4.1, suicide: 13.0, mde_youth: 11.4 },
  { year: 2015, ami: 17.9, smi: 4.0, suicide: 13.3, mde_youth: 12.5 },
  { year: 2016, ami: 18.3, smi: 4.2, suicide: 13.5, mde_youth: 12.8 },
  { year: 2017, ami: 18.9, smi: 4.5, suicide: 14.0, mde_youth: 13.3 },
  { year: 2018, ami: 19.1, smi: 4.6, suicide: 14.2, mde_youth: 14.4 },
  { year: 2019, ami: 20.6, smi: 5.2, suicide: 13.9, mde_youth: 15.7 },
  { year: 2020, ami: 21.0, smi: 5.6, suicide: 13.5, mde_youth: 17.0 },
  { year: 2021, ami: 22.8, smi: 5.5, suicide: 14.1, mde_youth: 20.1 },
  { year: 2022, ami: 23.1, smi: 6.0, suicide: 14.4, mde_youth: 19.5 },
  { year: 2023, ami: 22.8, smi: 5.7, suicide: 14.3, mde_youth: 19.8 },
  { year: 2024, ami: 23.4, smi: 5.6, suicide: 14.5, mde_youth: 20.2 },
] as const;

export type NationalTrendPoint = (typeof nationalTrendData)[number];
export type NationalTrendYear = NationalTrendPoint["year"];
