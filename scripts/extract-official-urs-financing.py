#!/usr/bin/env python3
from __future__ import annotations
import json
import os
import re
import urllib.request
import zlib
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

PROJECT_ROOT = Path('/Users/jacob/Downloads/Public_Health/mental-health-dashboard_2')
OUTPUT_PATH = PROJECT_ROOT / 'client/src/data/officialUrsFinancing.ts'
DEFAULT_YEARS = [2021, 2022, 2023, 2024]
USER_AGENT = 'Mozilla/5.0 (compatible; Codex ETL)'
MAX_WORKERS = int(os.environ.get('URS_MAX_WORKERS', '6'))

SUMMARY_PATTERNS = {
    'community_mh_expenditures_millions': r'SMHA Expenditures for Community Mental Health\*?\s+\$([0-9,]+)',
    'state_expenditures_from_state_sources_millions': r'State Expenditures from State Sources\s+\$([0-9,]+)',
    'total_smha_expenditures_millions': r'Total SMHA Expenditures\s+\$([0-9,]+)',
}

FUNDING_LABELS = {
    'mhbg_millions': 'Mental Health Block Grant',
    'covid_relief_mhbg_millions': 'COVID-19 Relief Funds (MHBG)',
    'arp_mhbg_millions': 'ARP Funds (MHBG)',
    'bsca_mhbg_millions': 'Bipartisan Safer Communities Act Funds (MHBG)',
    'medicaid_millions': 'Medicaid (Federal, State, and Local)',
    'other_federal_millions': 'Other Federal Funds (e.g., ACF (TANF), CDC, CMS (Medicare), SAMHSA, etc.)',
    'state_funds_millions': 'State Funds',
    'local_funds_millions': 'Local Funds (excluding local Medicaid)',
    'other_millions': 'Other',
    'funding_total_millions': 'Total',
}


def load_states() -> list[tuple[str, str]]:
    text = (PROJECT_ROOT / 'client/src/data/stateData.ts').read_text()
    entries = re.findall(r'state: "([^"]+)", abbreviation: "([A-Z]{2})"', text)
    seen = set()
    result = []
    for state, abbr in entries:
        if abbr in seen:
            continue
        seen.add(abbr)
        result.append((state, abbr))
    return result[:50]


def slugify(name: str) -> str:
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')


def fetch_text(url: str) -> str:
    request = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
    with urllib.request.urlopen(request, timeout=120) as response:
        return response.read().decode('utf-8', errors='ignore')


def fetch_bytes(url: str) -> bytes:
    request = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
    with urllib.request.urlopen(request, timeout=180) as response:
        return response.read()


def money_to_millions(raw: str | None) -> float:
    if not raw or raw == '-':
        return 0.0
    return round(int(raw.replace('$', '').replace(',', '')) / 1_000_000, 2)


def extract_pdf_text_chunks(pdf_bytes: bytes) -> list[str]:
    chunks: list[str] = []
    for match in re.finditer(rb'stream\r?\n(.*?)endstream', pdf_bytes, re.S):
        stream = match.group(1)
        try:
            decompressed = zlib.decompress(stream)
        except Exception:
            continue
        text_parts = []
        for token_match in re.finditer(rb'\((.*?)\)\s*Tj', decompressed, re.S):
            text_parts.append(token_match.group(1))
        for token_array_match in re.finditer(rb'\[(.*?)\]\s*TJ', decompressed, re.S):
            for token_match in re.finditer(rb'\((.*?)\)', token_array_match.group(1), re.S):
                text_parts.append(token_match.group(1))
        if not text_parts:
            continue
        text = ' '.join(part.decode('latin1', errors='ignore') for part in text_parts)
        text = re.sub(r'\\([()\\])', r'\1', text)
        text = text.replace('\r', ' ')
        text = re.sub(r'\s+', ' ', text).strip()
        if text:
            chunks.append(text)
    return chunks


def extract_summary_fields(chunks: list[str]) -> dict[str, float]:
    for text in chunks:
        if 'State Mental Health Finance' not in text or 'Total SMHA Expenditures' not in text:
            continue
        values: dict[str, float] = {}
        for field, pattern in SUMMARY_PATTERNS.items():
            match = re.search(pattern, text)
            if match:
                values[field] = money_to_millions(match.group(1))
        if len(values) == len(SUMMARY_PATTERNS):
            return values
    raise ValueError('Could not locate summary finance table in URS PDF')


def extract_source_amount(table_text: str, labels_in_order: list[str], label: str) -> float:
    start = table_text.find(label)
    if start == -1:
        return 0.0

    end = len(table_text)
    for next_label in labels_in_order:
        if next_label == label:
            continue
        candidate = table_text.find(next_label, start + len(label))
        if candidate != -1:
            end = min(end, candidate)
    note_index = table_text.find('Note:', start + len(label))
    if note_index != -1:
        end = min(end, note_index)
    notes_index = table_text.find('Notes:', start + len(label))
    if notes_index != -1:
        end = min(end, notes_index)

    segment = table_text[start:end]
    amounts = re.findall(r'\$[0-9,]+', segment)
    if not amounts:
        return 0.0
    if len(amounts) >= 4:
        community_amount = amounts[0]
        hospital_amount = amounts[2]
    elif len(amounts) >= 2:
        community_amount = amounts[0]
        hospital_amount = amounts[1]
    else:
        community_amount = amounts[0]
        hospital_amount = '-'
    return round(money_to_millions(community_amount) + money_to_millions(hospital_amount), 2)


def extract_funding_fields(chunks: list[str]) -> dict[str, float]:
    labels_in_order = list(FUNDING_LABELS.values())
    for text in chunks:
        if 'Funding Source Ambulatory/Community' not in text or 'Mental Health Block Grant' not in text:
            continue
        table_start = text.find('Mental Health Block Grant')
        if table_start == -1:
            continue
        table_end = len(text)
        for terminator in ('Note:', 'Notes:', 'State Notes:'):
            terminator_index = text.find(terminator, table_start)
            if terminator_index != -1:
                table_end = min(table_end, terminator_index)
        table_text = text[table_start:table_end]
        values = {field: extract_source_amount(table_text, labels_in_order, label) for field, label in FUNDING_LABELS.items()}
        if values.get('funding_total_millions', 0) > 0:
            return values
    raise ValueError('Could not locate funding-source table in URS PDF')


def extract_pdf_url(report_page_html: str) -> str:
    match = re.search(r'href="([^"]+\.pdf)"', report_page_html, re.I)
    if not match:
        raise ValueError('Could not find PDF link in URS report page')
    href = match.group(1)
    if href.startswith('http'):
        return href
    return f'https://www.samhsa.gov{href}'


def parse_years() -> list[int]:
    env_value = os.environ.get('URS_YEARS', '').strip()
    if not env_value:
        return DEFAULT_YEARS
    years = []
    for part in env_value.split(','):
        part = part.strip()
        if not part:
            continue
        years.append(int(part))
    return years or DEFAULT_YEARS


def parse_state_filter() -> set[str] | None:
    env_value = os.environ.get('URS_STATES', '').strip()
    if not env_value:
        return None
    return {part.strip().upper() for part in env_value.split(',') if part.strip()}


def extract_state_year(state_name: str, abbreviation: str, year: int) -> tuple[str, int, dict[str, float | int | str]]:
    report_url = f'https://www.samhsa.gov/data/report/{year}-uniform-reporting-system-urs-table-{slugify(state_name)}'
    report_html = fetch_text(report_url)
    pdf_url = extract_pdf_url(report_html)
    pdf_bytes = fetch_bytes(pdf_url)
    chunks = extract_pdf_text_chunks(pdf_bytes)
    summary_values = extract_summary_fields(chunks)
    funding_values = extract_funding_fields(chunks)
    state_total = funding_values.get('funding_total_millions', 0.0)
    total_smha = summary_values['total_smha_expenditures_millions']
    return (
        abbreviation,
        year,
        {
            'state': state_name,
            'sourceYear': year,
            **summary_values,
            **funding_values,
            'admin_gap_millions': round(max(total_smha - state_total, 0.0), 2),
        },
    )


records: dict[str, dict[int, dict[str, float | int | str]]] = {}
years = parse_years()
states = load_states()
state_filter = parse_state_filter()

for year in years:
    selected_states = [(state_name, abbreviation) for state_name, abbreviation in states if not state_filter or abbreviation in state_filter]
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = [executor.submit(extract_state_year, state_name, abbreviation, year) for state_name, abbreviation in selected_states]
        for future in as_completed(futures):
            abbreviation, completed_year, record = future.result()
            records.setdefault(abbreviation, {})[completed_year] = record
            print(f'Parsed URS {completed_year} {abbreviation}', flush=True)


type_definition = '''export interface OfficialUrsFinancingRecord {
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

'''

serialized = ',\n'.join(
    f"  {abbr}: {json.dumps(records[abbr], indent=2)}".replace('\n', '\n  ')
    for abbr in sorted(records)
)

output = (
    '// Auto-generated from official SAMHSA URS state report pages and PDFs\n'
    '// This extraction is network-backed because the URS PDFs are fetched from the official SAMHSA state report pages at generation time.\n\n'
    + type_definition
    + 'export const officialUrsFinancingByStateYear: Record<string, OfficialUrsFinancingByYear> = {\n'
    + serialized
    + '\n};\n'
)

OUTPUT_PATH.write_text(output)
print(f'Wrote {OUTPUT_PATH} with {len(records)} states across {sum(len(years) for years in records.values())} state-year records.')
