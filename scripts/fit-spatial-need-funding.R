#!/usr/bin/env Rscript

options(stringsAsFactors = FALSE)

required_packages <- c("readr", "dplyr", "sf", "spdep", "spatialreg")
missing_packages <- required_packages[!vapply(required_packages, requireNamespace, logical(1), quietly = TRUE)]
if (length(missing_packages) > 0) {
  install.packages(missing_packages, repos = "https://cloud.r-project.org")
}

suppressPackageStartupMessages({
  library(readr)
  library(dplyr)
  library(sf)
  library(spdep)
  library(spatialreg)
})

args <- commandArgs(trailingOnly = TRUE)
input_path <- if (length(args) >= 1) args[[1]] else "data/raw/policy/spatial_need_funding_panel.csv"
output_ts_path <- if (length(args) >= 2) args[[2]] else "client/src/data/spatialNeedFundingResults.ts"
results_csv_path <- if (length(args) >= 3) args[[3]] else "data/raw/policy/spatial_need_funding_results.csv"
diagnostics_csv_path <- if (length(args) >= 4) args[[4]] else "data/raw/policy/spatial_need_funding_diagnostics.csv"

panel <- readr::read_csv(input_path, show_col_types = FALSE)
state_lookup <- panel %>%
  distinct(state, abbreviation, lat, lng) %>%
  arrange(abbreviation)

build_weights <- function(lookup) {
  polygon_attempt <- tryCatch({
    if (!requireNamespace("USAboundaries", quietly = TRUE)) {
      stop("USAboundaries package is not installed.")
    }

    states_sf <- USAboundaries::us_states(resolution = "low")
    states_names <- names(states_sf)
    abbr_col <- intersect(states_names, c("state_abbr", "stusps", "STUSPS"))[[1]]

    if (is.null(abbr_col) || is.na(abbr_col)) {
      stop("No state abbreviation column found in USAboundaries output.")
    }

    states_sf <- states_sf %>%
      mutate(abbreviation = .data[[abbr_col]]) %>%
      filter(abbreviation %in% lookup$abbreviation) %>%
      select(abbreviation, geometry)

    state_sf <- lookup %>%
      left_join(st_drop_geometry(states_sf), by = "abbreviation") %>%
      left_join(states_sf, by = "abbreviation") %>%
      st_as_sf()

    if (any(is.na(st_is_empty(state_sf$geometry)))) {
      stop("Missing geometry after joining state polygons.")
    }

    state_sf <- state_sf %>% arrange(abbreviation)
    nb <- spdep::poly2nb(state_sf, queen = TRUE)
    coords <- sf::st_coordinates(sf::st_centroid(sf::st_geometry(state_sf)))
    knn_nb <- spdep::knn2nb(spdep::knearneigh(coords, k = 4))

    for (index in seq_along(nb)) {
      if (length(nb[[index]]) == 0) {
        nb[[index]] <- knn_nb[[index]]
      }
    }

    list(
      listw = spdep::nb2listw(nb, style = "W", zero.policy = TRUE),
      order = state_sf$abbreviation,
      method_note = "queen contiguity weights with centroid k-nearest-neighbor fallback for isolated states"
    )
  }, error = function(error) {
    message("Polygon-based weights unavailable; falling back to centroid k-nearest-neighbor weights: ", error$message)
    coords <- as.matrix(lookup[, c("lng", "lat")])
    nb <- spdep::knn2nb(spdep::knearneigh(coords, k = 4))
    list(
      listw = spdep::nb2listw(nb, style = "W", zero.policy = TRUE),
      order = lookup$abbreviation,
      method_note = "centroid 4-nearest-neighbor weights fallback"
    )
  })

  polygon_attempt
}

weights <- build_weights(state_lookup)

fit_year <- function(year_value) {
  year_data <- panel %>%
    filter(year == year_value) %>%
    mutate(order_index = match(abbreviation, weights$order)) %>%
    arrange(order_index)

  if (any(is.na(year_data$order_index))) {
    stop(sprintf("Year %s has abbreviations not found in the spatial weights ordering.", year_value))
  }

  lag_fit <- spatialreg::lagsarlm(
    public_mh_spending_per_capita ~ need_index,
    data = year_data,
    listw = weights$listw,
    zero.policy = TRUE,
    method = "eigen"
  )

  error_fit <- spatialreg::errorsarlm(
    public_mh_spending_per_capita ~ need_index,
    data = year_data,
    listw = weights$listw,
    zero.policy = TRUE,
    method = "eigen"
  )

  candidates <- list(spatial_lag = lag_fit, spatial_error = error_fit)
  candidate_aics <- vapply(candidates, AIC, numeric(1))
  best_name <- names(which.min(candidate_aics))[[1]]
  best_fit <- candidates[[best_name]]
  fitted_values <- as.numeric(fitted(best_fit))
  gap <- year_data$public_mh_spending_per_capita - fitted_values
  gap_sd <- stats::sd(gap)
  gap_score <- if (is.na(gap_sd) || gap_sd == 0) rep(0, length(gap)) else gap / gap_sd

  parameter_note <- if (best_name == "spatial_lag") {
    sprintf("rho=%.3f", best_fit$rho)
  } else {
    sprintf("lambda=%.3f", best_fit$lambda)
  }

  diagnostic_row <- tibble::tibble(
    year = year_value,
    model_label = sprintf(
      "%s (AIC %.1f)",
      ifelse(best_name == "spatial_lag", "Spatial lag", "Spatial error"),
      AIC(best_fit)
    ),
    model_type = best_name,
    note = sprintf(
      "Estimated offline with spatialreg using %s; formula: public mental health spending per capita ~ need index; %s.",
      weights$method_note,
      parameter_note
    )
  )

  results_rows <- tibble::tibble(
    abbreviation = year_data$abbreviation,
    year = year_data$year,
    predicted_public_mh_spending_per_capita = round(fitted_values, 2),
    funding_gap_per_capita = round(gap, 2),
    funding_gap_score = round(gap_score, 2)
  )

  list(results = results_rows, diagnostics = diagnostic_row)
}

years <- sort(unique(panel$year))
fits <- lapply(years, fit_year)
results_df <- bind_rows(lapply(fits, function(item) item$results))
diagnostics_df <- bind_rows(lapply(fits, function(item) item$diagnostics))

format_ts_value <- function(value) {
  if (is.numeric(value)) {
    if (is.na(value)) return("undefined")
    return(format(value, trim = TRUE, scientific = FALSE))
  }

  if (is.logical(value)) {
    if (is.na(value)) return("undefined")
    return(ifelse(value, "true", "false"))
  }

  if (is.na(value)) return("undefined")

  escaped <- gsub("\\\\", "\\\\\\\\", value)
  escaped <- gsub('"', '\\\\"', escaped)
  sprintf('"%s"', escaped)
}

write_ts_file <- function(results_table, diagnostics_table, output_path) {
  result_lines <- apply(results_table, 1, function(row) {
    sprintf(
      "  { abbreviation: %s, year: %s, predicted_public_mh_spending_per_capita: %s, funding_gap_per_capita: %s, funding_gap_score: %s },",
      format_ts_value(row[["abbreviation"]]),
      format_ts_value(as.numeric(row[["year"]])),
      format_ts_value(as.numeric(row[["predicted_public_mh_spending_per_capita"]])),
      format_ts_value(as.numeric(row[["funding_gap_per_capita"]])),
      format_ts_value(as.numeric(row[["funding_gap_score"]]))
    )
  })

  diagnostic_lines <- apply(diagnostics_table, 1, function(row) {
    sprintf(
      "  { year: %s, model_label: %s, model_type: %s, note: %s },",
      format_ts_value(as.numeric(row[["year"]])),
      format_ts_value(row[["model_label"]]),
      format_ts_value(row[["model_type"]]),
      format_ts_value(row[["note"]])
    )
  })

  ts_lines <- c(
    "export interface ExternalSpatialNeedFundingResult {",
    "  abbreviation: string;",
    "  year: number;",
    "  predicted_public_mh_spending_per_capita: number;",
    "  funding_gap_per_capita?: number;",
    "  funding_gap_score?: number;",
    "}",
    "",
    "export interface ExternalSpatialNeedFundingDiagnostic {",
    "  year: number;",
    "  model_label: string;",
    "  model_type: \"spatial_lag\" | \"spatial_error\" | \"custom_spatial\";",
    "  note?: string;",
    "}",
    "",
    "// Generated by scripts/fit-spatial-need-funding.R",
    "export const externalSpatialNeedFundingResults: ExternalSpatialNeedFundingResult[] = [",
    result_lines,
    "];",
    "",
    "export const externalSpatialNeedFundingDiagnostics: ExternalSpatialNeedFundingDiagnostic[] = [",
    diagnostic_lines,
    "];",
    ""
  )

  writeLines(ts_lines, con = output_path, useBytes = TRUE)
}

readr::write_csv(results_df, results_csv_path)
readr::write_csv(diagnostics_df, diagnostics_csv_path)
write_ts_file(results_df, diagnostics_df, output_ts_path)

message(sprintf("Wrote %s", results_csv_path))
message(sprintf("Wrote %s", diagnostics_csv_path))
message(sprintf("Wrote %s", output_ts_path))
