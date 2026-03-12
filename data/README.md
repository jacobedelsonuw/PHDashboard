# Hybrid Data Workspace

This workspace is for replacing the dashboard's hardcoded mixed estimates with a documented hybrid-source pipeline.

Current target source families:

- `SAMHSA NSDUH state releases`
  - official state small-area estimates for AMI, SMI, youth MDE, and several substance-use indicators
- `CDC WONDER / NCHS`
  - official suicide mortality by state
- `HRSA AHRF`
  - official workforce counts and clinician-capacity measures
- `SAMHSA N-SUMHSS`
  - official treatment facility capacity and service-system coverage

Directory layout:

- `raw/official`
  - downloaded or manually placed federal source files
- `raw/source-checks`
  - machine-generated checks confirming source landing pages are reachable

Important:

- Not every dashboard metric has a direct federal annual state table.
- Some disorder-specific state measures will require a mixed-source approach, combining official anchors with research or modeled sources.
- The dashboard now pulls state-level `AMI`, `SMI`, `youth MDE`, `substance use disorder`, `alcohol use disorder`, and `opioid use disorder` from the official SAMHSA NSDUH 2023-2024 state-specific tables.
- The dashboard now pulls state-level `suicide_rate` from the official CDC NCHS final 2023 state suicide table.
- The dashboard now pulls state-level provider capacity from HRSA AHRF and facility capacity from SAMHSA N-SUMHSS 2024.
- Rebuild the generated SAMHSA state metric module with `pnpm sources:extract`.
- Country comparisons, burden-gap scoring, and the remaining disorder-specific state series still need additional source normalization.
