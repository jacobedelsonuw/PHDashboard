#!/usr/bin/env python3
from __future__ import annotations
import json
import os
import re
import time
import urllib.request
import zlib
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

try:
    import fitz  # type: ignore
except ImportError:
    fitz = None

try:
    import numpy as np  # type: ignore
    from rapidocr_onnxruntime import RapidOCR  # type: ignore
except ImportError:
    RapidOCR = None
    np = None

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
    last_error: Exception | None = None
    for attempt in range(3):
        try:
            request = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
            with urllib.request.urlopen(request, timeout=120) as response:
                return response.read().decode('utf-8', errors='ignore')
        except Exception as exc:
            last_error = exc
            if attempt < 2:
                time.sleep(1 + attempt)
    raise last_error or ValueError(f'Could not fetch text from {url}')


def fetch_bytes(url: str) -> bytes:
    last_error: Exception | None = None
    for attempt in range(3):
        try:
            request = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
            with urllib.request.urlopen(request, timeout=180) as response:
                return response.read()
        except Exception as exc:
            last_error = exc
            if attempt < 2:
                time.sleep(1 + attempt)
    raise last_error or ValueError(f'Could not fetch bytes from {url}')


def fetch_text_from_first_available(urls: list[str]) -> str:
    last_error: Exception | None = None
    for url in urls:
        try:
            return fetch_text(url)
        except Exception as exc:
            last_error = exc
    raise last_error or ValueError('Could not fetch any URS report page URL')


def money_to_millions(raw: str | None) -> float:
    if not raw or raw == '-':
        return 0.0
    return round(int(raw.replace('$', '').replace(',', '')) / 1_000_000, 2)


RELEVANT_STREAM_KEYWORDS = (
    b'State Expenditures from State Sources',
    b'Total SMHA Expenditures',
    b'SMHA Expenditures for Community Mental Health',
    b'Funding Source',
    b'Mental Health Block Grant',
    b'Medicaid (Federal, State, and Local)',
    b'Activity Expenditures',
    b'State Mental Health Agency Controlled Expenditures for',
    b'State Revenue Expenditure Data',
    b'Total SMHA Mental Health Expenditure',
)
RELEVANT_TEXT_KEYWORDS = tuple(keyword.decode('latin1', errors='ignore') for keyword in RELEVANT_STREAM_KEYWORDS)


def normalize_pdf_text(text: str) -> str:
    text = re.sub(r'\\([()\\])', r'\1', text)
    text = text.replace('\\', ' ')
    text = text.replace('\r', ' ')
    return re.sub(r'\s+', ' ', text).strip()


def extract_pdf_text_chunks(pdf_bytes: bytes) -> list[str]:
    chunks: list[str] = []
    for match in re.finditer(rb'stream\r?\n(.*?)endstream', pdf_bytes, re.S):
        stream = match.group(1)
        try:
            decompressed = zlib.decompress(stream)
        except Exception:
            continue
        if not any(keyword in decompressed for keyword in RELEVANT_STREAM_KEYWORDS):
            continue
        text_parts = []
        for token_match in re.finditer(rb'\((.*?)\)\s*Tj', decompressed, re.S):
            text_parts.append(token_match.group(1))
        for token_array_match in re.finditer(rb'\[(.*?)\]\s*TJ', decompressed, re.S):
            for token_match in re.finditer(rb'\((.*?)\)', token_array_match.group(1), re.S):
                text_parts.append(token_match.group(1))
        if not text_parts:
            continue
        text = normalize_pdf_text(' '.join(part.decode('latin1', errors='ignore') for part in text_parts))
        if text:
            chunks.append(text)
    return chunks


def extract_pdf_text_chunks_fitz(pdf_bytes: bytes) -> list[str]:
    if fitz is None:
        return []

    doc = fitz.open(stream=pdf_bytes, filetype='pdf')
    chunks: list[str] = []
    try:
        for page in doc:
            text = normalize_pdf_text(page.get_text('text'))
            if text and any(keyword in text for keyword in RELEVANT_TEXT_KEYWORDS):
                chunks.append(text)
    finally:
        doc.close()
    return chunks


def extract_pdf_text_chunks_ocr(pdf_bytes: bytes) -> list[str]:
    if fitz is None or RapidOCR is None or np is None:
        return []

    ocr = RapidOCR()
    doc = fitz.open(stream=pdf_bytes, filetype='pdf')
    chunks: list[str] = []
    try:
        for page in doc:
            pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False)
            image = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)
            result, _ = ocr(image)
            if not result:
                continue
            text = normalize_pdf_text(' '.join(line[1] for line in result))
            if text and any(keyword in text for keyword in RELEVANT_TEXT_KEYWORDS):
                chunks.append(text)
    finally:
        doc.close()
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


def extract_summary_fields_from_state_summary(chunks: list[str], year: int) -> dict[str, float]:
    total_label = rf'FY {year} Total SMHA Mental Health Expenditure'
    community_label = rf'FY {year} SMHA Community MH Expenditures'
    community_percent_label = rf'FY {year} Community Percent of Total SMHA Spending'

    for text in chunks:
        if f'FY {year} Total SMHA Mental Health Expenditure' not in text:
            continue

        total_match = re.search(rf'{total_label}\s+\$([0-9,]+)', text)
        if not total_match:
            continue

        community_match = re.search(rf'{community_label}\s+\$([0-9,]+)', text)
        community_percent_match = re.search(rf'{community_percent_label}\s+([0-9.]+)%', text)

        total_smha = money_to_millions(total_match.group(1))
        community_mh = money_to_millions(community_match.group(1)) if community_match else 0.0
        if community_mh == 0 and community_percent_match:
            community_mh = round(total_smha * (float(community_percent_match.group(1)) / 100), 2)

        if total_smha > 0 and community_mh > 0:
            return {
                'community_mh_expenditures_millions': community_mh,
                'total_smha_expenditures_millions': total_smha,
            }

    raise ValueError('Could not locate state summary finance values in URS PDF')


def extract_summary_fields_from_activity_table(chunks: list[str], funding_values: dict[str, float]) -> dict[str, float]:
    component_patterns = {
        'prevention': [
            r'Mental Health Prevention\s+(\$[0-9,]+|-)',
            r'Primary Prevention\s+(\$[0-9,]+|-)',
        ],
        'esmi': [
            r'EBPs for Early Serious Mental Illness Including First Episode Psychosis\s+(\$[0-9,]+|-)',
            r'EBPs for Early Serious Mental Illness\s+(\$[0-9,]+|-)',
        ],
        'other_24_hour': [r'Other 24-Hour Care\s+(\$[0-9,]+|-)'],
        'ambulatory': [r'Ambulatory/Community\s+(\$[0-9,]+|-)'],
        'crisis': [r'Crisis Services\s+(\$[0-9,]+|-)'],
        'total': [r'Total\s+(\$[0-9,]+)\s+100%'],
    }

    def first_amount(text: str, patterns: list[str]) -> float:
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                return money_to_millions(match.group(1))
        return 0.0

    for text in chunks:
        if 'Activity Expenditures:' not in text or 'State Mental Health Agency Controlled Expenditures for Mental Health' not in text:
            continue

        total_smha = first_amount(text, component_patterns['total'])
        if total_smha <= 0:
            continue

        community_total = round(
            first_amount(text, component_patterns['prevention']) +
            first_amount(text, component_patterns['esmi']) +
            first_amount(text, component_patterns['other_24_hour']) +
            first_amount(text, component_patterns['ambulatory']) +
            first_amount(text, component_patterns['crisis']),
            2
        )
        if community_total <= 0:
            continue

        state_sources = round((funding_values.get('state_funds_millions', 0.0) + funding_values.get('local_funds_millions', 0.0)), 2)
        return {
            'community_mh_expenditures_millions': round(community_total, 2),
            'state_expenditures_from_state_sources_millions': state_sources,
            'total_smha_expenditures_millions': total_smha,
        }

    raise ValueError('Could not locate fallback activity finance table in URS PDF')


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
    money_or_dash = r'(\$[0-9,]+|-)'
    percent_or_dash = r'([0-9.]+%|-)'

    # 2024-style rows include both state and U.S. dollar columns plus states-reporting counts.
    expanded_match = re.search(
        rf'{re.escape(label)}\s+{money_or_dash}\s+{percent_or_dash}\s+{money_or_dash}\s+{percent_or_dash}\s+\d+\s+{money_or_dash}\s+{percent_or_dash}\s+{money_or_dash}\s+{percent_or_dash}\s+\d+',
        segment,
    )
    if expanded_match:
        community_amount = expanded_match.group(1)
        hospital_amount = expanded_match.group(5)
        return round(money_to_millions(community_amount) + money_to_millions(hospital_amount), 2)

    # 2021-2023-style rows include only state dollar columns and percentages.
    compact_match = re.search(
        rf'{re.escape(label)}\s+{money_or_dash}\s+{percent_or_dash}\s+{percent_or_dash}\s+{money_or_dash}\s+{percent_or_dash}\s+{percent_or_dash}',
        segment,
    )
    if compact_match:
        community_amount = compact_match.group(1)
        hospital_amount = compact_match.group(4)
        return round(money_to_millions(community_amount) + money_to_millions(hospital_amount), 2)

    # Some rows have only one state dollar amount and no hospital amount.
    single_amount_match = re.search(rf'{re.escape(label)}\s+{money_or_dash}', segment)
    if single_amount_match:
        return money_to_millions(single_amount_match.group(1))

    return 0.0


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


def build_report_page_urls(state_name: str, abbreviation: str, year: int) -> list[str]:
    return [
        f'https://www.samhsa.gov/data/data-we-collect/urs-uniform-reporting-system/annual-report/{year}-{abbreviation.lower()}',
        f'https://www.samhsa.gov/data/report/{year}-uniform-reporting-system-urs-table-{slugify(state_name)}',
    ]


def extract_state_year(state_name: str, abbreviation: str, year: int) -> tuple[str, int, dict[str, float | int | str]]:
    report_html = fetch_text_from_first_available(build_report_page_urls(state_name, abbreviation, year))
    pdf_url = extract_pdf_url(report_html)
    pdf_bytes = fetch_bytes(pdf_url)
    base_chunks = extract_pdf_text_chunks(pdf_bytes)
    extraction_passes = [base_chunks]

    funding_values: dict[str, float] = {}
    summary_values: dict[str, float] | None = None
    last_error: Exception | None = None
    fitz_chunks: list[str] = []

    for pass_index, candidate_chunks in enumerate(extraction_passes):
        try:
            funding_values = extract_funding_fields(candidate_chunks)
        except ValueError:
            funding_values = {}
        try:
            summary_values = extract_summary_fields(candidate_chunks)
        except ValueError:
            try:
                summary_values = extract_summary_fields_from_activity_table(candidate_chunks, funding_values)
            except ValueError:
                try:
                    summary_values = extract_summary_fields_from_state_summary(candidate_chunks, year)
                except ValueError as exc:
                    last_error = exc
                    if pass_index == 0:
                        fitz_chunks = extract_pdf_text_chunks_fitz(pdf_bytes)
                        if fitz_chunks:
                            extraction_passes.append(base_chunks + fitz_chunks)
                    elif pass_index == 1 and not fitz_chunks:
                        ocr_chunks = extract_pdf_text_chunks_ocr(pdf_bytes)
                        if ocr_chunks:
                            extraction_passes.append(base_chunks + fitz_chunks + ocr_chunks)
                    continue
        break

    if summary_values is None:
        raise last_error or ValueError('Could not extract URS finance values from PDF')
    state_total = funding_values.get('funding_total_millions', 0.0) if funding_values else 0.0
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


type_definition = '''export interface OfficialUrsFinancingRecord {
  state: string;
  sourceYear: number;
  community_mh_expenditures_millions: number;
  state_expenditures_from_state_sources_millions?: number;
  total_smha_expenditures_millions: number;
  mhbg_millions?: number;
  covid_relief_mhbg_millions?: number;
  arp_mhbg_millions?: number;
  bsca_mhbg_millions?: number;
  medicaid_millions?: number;
  other_federal_millions?: number;
  state_funds_millions?: number;
  local_funds_millions?: number;
  other_millions?: number;
  funding_total_millions?: number;
  admin_gap_millions?: number;
}

export type OfficialUrsFinancingByYear = Partial<Record<2021 | 2022 | 2023 | 2024, OfficialUrsFinancingRecord>>;

'''


def main() -> None:
    records: dict[str, dict[int, dict[str, float | int | str]]] = {}
    failures: list[tuple[int, str, str]] = []
    years = parse_years()
    states = load_states()
    state_filter = parse_state_filter()

    for year in years:
        selected_states = [(state_name, abbreviation) for state_name, abbreviation in states if not state_filter or abbreviation in state_filter]
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            futures = {
                executor.submit(extract_state_year, state_name, abbreviation, year): (state_name, abbreviation)
                for state_name, abbreviation in selected_states
            }
            for future in as_completed(futures):
                state_name, abbreviation = futures[future]
                try:
                    _, completed_year, record = future.result()
                except Exception as exc:
                    failures.append((year, abbreviation, str(exc)))
                    print(f'Failed URS {year} {abbreviation}: {exc}', flush=True)
                    continue
                records.setdefault(abbreviation, {})[completed_year] = record
                print(f'Parsed URS {completed_year} {abbreviation}', flush=True)

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
    if failures:
        print('Failures:', flush=True)
        for year, abbreviation, error in failures:
            print(f'  {year} {abbreviation}: {error}', flush=True)


if __name__ == "__main__":
    main()
