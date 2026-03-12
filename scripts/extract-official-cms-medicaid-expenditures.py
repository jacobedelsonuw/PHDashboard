#!/usr/bin/env python3
from __future__ import annotations
import json
import re
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

PROJECT_ROOT = Path('/Users/jacob/Downloads/Public_Health/mental-health-dashboard_2')
RAW_DIR = PROJECT_ROOT / 'data/raw/official/financing/cms'
OUTPUT_PATH = PROJECT_ROOT / 'client/src/data/officialCmsMedicaidExpenditures.ts'
YEARS = list(range(2016, 2025))
NS = {
    'a': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
    'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
}

LABEL_FIELDS = {
    'Total Net Expenditures': ('total_net_expenditures_millions', 'total_net_expenditures_federal_share_millions', 'total_net_expenditures_state_share_millions'),
    'Mental Health Facility Services - Reg. Payments': (
        'mental_health_facility_reg_payments_millions',
        'mental_health_facility_reg_payments_federal_share_millions',
        'mental_health_facility_reg_payments_state_share_millions',
    ),
    'Mental Health Facility - DSH': (
        'mental_health_facility_dsh_millions',
        'mental_health_facility_dsh_federal_share_millions',
        'mental_health_facility_dsh_state_share_millions',
    ),
    'C-Inpatient Mental Health - Reg. Payment': (
        'inpatient_mental_health_reg_payments_millions',
        'inpatient_mental_health_reg_payments_federal_share_millions',
        'inpatient_mental_health_reg_payments_state_share_millions',
    ),
    'C-Inpatient Mental Health - DSH': (
        'inpatient_mental_health_dsh_millions',
        'inpatient_mental_health_dsh_federal_share_millions',
        'inpatient_mental_health_dsh_state_share_millions',
    ),
    'C-Outpatient Mental Health': (
        'outpatient_mental_health_millions',
        'outpatient_mental_health_federal_share_millions',
        'outpatient_mental_health_state_share_millions',
    ),
    'ARP Section 9813 Qualified Community Based Mobile Crisis Intervention – 85%': (
        'mobile_crisis_millions',
        'mobile_crisis_federal_share_millions',
        'mobile_crisis_state_share_millions',
    ),
}

MANUAL_NAME_MAP = {
    'District of Columbia': None,
}


def load_state_map() -> dict[str, str | None]:
    text = (PROJECT_ROOT / 'client/src/data/stateData.ts').read_text()
    entries = re.findall(r'state: "([^"]+)", abbreviation: "([A-Z]{2})"', text)
    mapping: dict[str, str | None] = {}
    for state, abbr in entries:
        mapping.setdefault(state, abbr)
    mapping.update(MANUAL_NAME_MAP)
    return mapping


def normalize_sheet_state(name: str) -> str:
    state = name.replace('MAP - ', '').strip()
    replacements = {
        'Dist. Of Col.': 'District of Columbia',
        'Amer. Samoa': 'American Samoa',
        'N. Mariana Islands': 'Northern Mariana Islands',
    }
    return replacements.get(state, state)


def parse_shared_strings(workbook: zipfile.ZipFile) -> list[str]:
    shared_strings_path = 'xl/sharedStrings.xml'
    if shared_strings_path not in workbook.namelist():
        return []
    root = ET.fromstring(workbook.read(shared_strings_path))
    values: list[str] = []
    for item in root:
        values.append(''.join(text.text or '' for text in item.iter('{%s}t' % NS['a'])))
    return values


def resolve_sheet_targets(workbook: zipfile.ZipFile) -> list[tuple[str, str]]:
    rels_root = ET.fromstring(workbook.read('xl/_rels/workbook.xml.rels'))
    rel_map = {rel.attrib['Id']: rel.attrib['Target'] for rel in rels_root}
    workbook_root = ET.fromstring(workbook.read('xl/workbook.xml'))
    sheets = []
    for sheet in workbook_root.find('a:sheets', NS):
        rel_id = sheet.attrib['{%s}id' % NS['r']]
        sheets.append((sheet.attrib['name'], rel_map[rel_id]))
    return sheets


def cell_value(cell, shared_strings: list[str]):
    value_node = cell.find('a:v', NS)
    if value_node is None:
        return None
    value = value_node.text or ''
    if cell.attrib.get('t') == 's':
        return shared_strings[int(value)]
    return value


def to_millions(raw: str | None) -> float | None:
    if raw is None or raw == '':
        return None
    try:
        amount = float(raw)
    except ValueError:
        return None
    return round(amount / 1_000_000, 2)


state_map = load_state_map()
records: dict[str, dict[int, dict[str, float | int | str]]] = {}

for year in YEARS:
    zip_path = RAW_DIR / f'financial-management-report-fy{year}.zip'
    if not zip_path.exists():
        continue
    try:
        archive = zipfile.ZipFile(zip_path)
    except zipfile.BadZipFile:
        continue

    workbook_names = [name for name in archive.namelist() if name.endswith('.xlsx') and 'CHIP' not in name]
    if not workbook_names:
        continue

    workbook_bytes = archive.read(workbook_names[0])
    workbook_path = Path('/tmp') / f'cms_fy{year}_map.xlsx'
    workbook_path.write_bytes(workbook_bytes)

    with zipfile.ZipFile(workbook_path) as workbook:
        shared_strings = parse_shared_strings(workbook)
        for sheet_name, target in resolve_sheet_targets(workbook):
            if not sheet_name.startswith('MAP - '):
                continue
            state_name = normalize_sheet_state(sheet_name)
            abbreviation = state_map.get(state_name)
            if not abbreviation:
                continue
            sheet_root = ET.fromstring(workbook.read(f'xl/{target}'))
            row_lookup: dict[str, dict[str, str]] = {}
            for row in sheet_root.find('a:sheetData', NS):
                row_number = row.attrib['r']
                values: dict[str, str] = {}
                for cell in row:
                    ref = cell.attrib['r']
                    value = cell_value(cell, shared_strings)
                    if value is not None:
                        values[ref] = value
                if values:
                    row_lookup[row_number] = values

            year_entry: dict[str, float | int | str] = {'state': state_name, 'sourceYear': year}
            for values in row_lookup.values():
                label = values.get(next((key for key in values if key.startswith('A')), ''), '')
                if label not in LABEL_FIELDS:
                    continue
                total_field, federal_field, state_field = LABEL_FIELDS[label]
                row_number = re.sub(r'^[A-Z]+', '', next(key for key in values if key.startswith('A')))
                year_entry[total_field] = to_millions(values.get(f'B{row_number}')) or 0.0
                year_entry[federal_field] = to_millions(values.get(f'C{row_number}')) or 0.0
                year_entry[state_field] = to_millions(values.get(f'G{row_number}')) or 0.0

            if 'total_net_expenditures_millions' not in year_entry:
                continue
            records.setdefault(abbreviation, {})[year] = year_entry


type_definition = '''export interface OfficialCmsMedicaidExpenditureRecord {
  state: string;
  sourceYear: number;
  total_net_expenditures_millions: number;
  total_net_expenditures_federal_share_millions: number;
  total_net_expenditures_state_share_millions: number;
  mental_health_facility_reg_payments_millions?: number;
  mental_health_facility_reg_payments_federal_share_millions?: number;
  mental_health_facility_reg_payments_state_share_millions?: number;
  mental_health_facility_dsh_millions?: number;
  mental_health_facility_dsh_federal_share_millions?: number;
  mental_health_facility_dsh_state_share_millions?: number;
  inpatient_mental_health_reg_payments_millions?: number;
  inpatient_mental_health_reg_payments_federal_share_millions?: number;
  inpatient_mental_health_reg_payments_state_share_millions?: number;
  inpatient_mental_health_dsh_millions?: number;
  inpatient_mental_health_dsh_federal_share_millions?: number;
  inpatient_mental_health_dsh_state_share_millions?: number;
  outpatient_mental_health_millions?: number;
  outpatient_mental_health_federal_share_millions?: number;
  outpatient_mental_health_state_share_millions?: number;
  mobile_crisis_millions?: number;
  mobile_crisis_federal_share_millions?: number;
  mobile_crisis_state_share_millions?: number;
}

export type OfficialCmsMedicaidExpendituresByYear = Partial<Record<2016 | 2017 | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024, OfficialCmsMedicaidExpenditureRecord>>;

'''

serialized = ',\n'.join(
    f"  {abbr}: {json.dumps(records[abbr], indent=2)}".replace('\n', '\n  ')
    for abbr in sorted(records)
)

output = (
    '// Auto-generated from official CMS Financial Management Report workbooks placed under data/raw/official/financing/cms\n'
    '// Years included depend on which official annual zip files are present locally and valid.\n\n'
    + type_definition
    + 'export const officialCmsMedicaidExpendituresByStateYear: Record<string, OfficialCmsMedicaidExpendituresByYear> = {\n'
    + serialized
    + '\n};\n'
)

OUTPUT_PATH.write_text(output)
print(f'Wrote {OUTPUT_PATH} with {len(records)} states across {sum(len(years) for years in records.values())} state-year records.')
