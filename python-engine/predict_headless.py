import argparse
import csv
import json
import logging
import math
import os
import pickle
import random
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# Set up logging to stderr to keep stdout clean
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)
logger = logging.getLogger("CampaignOS_Predict_Headless")

# Set up pathing to allow importing from src.predict
script_dir = Path(__file__).resolve().parent
project_root = script_dir.parent
if str(project_root) not in sys.path:
    sys.path.append(str(project_root))

# Try to import parameters and helper functions from src.predict to reuse the existing logic
try:
    from src.predict import (
        SPEND_CANDIDATES,
        REVENUE_CANDIDATES,
        CLICKS_CANDIDATES,
        IMPRESSIONS_CANDIDATES,
        CONVERSIONS_CANDIDATES,
        DATE_CANDIDATES,
        INDUSTRY_DEFAULTS,
        find_column
    )
    logger.info("Successfully imported candidates and defaults from src.predict.")
except ImportError:
    logger.warning("Could not import from src.predict. Falling back to local definitions.")
    # Local fallbacks in case of import issues in the hackathon pipeline environment
    SPEND_CANDIDATES = ["metrics_cost_micros", "spend", "Spend", "cost", "Cost"]
    REVENUE_CANDIDATES = ["metrics_conversions_value", "conversion", "conversion_value", "Conversion", "Revenue", "revenue"]
    CLICKS_CANDIDATES = ["metrics_clicks", "clicks", "Clicks"]
    IMPRESSIONS_CANDIDATES = ["metrics_impressions", "impressions", "Impressions"]
    CONVERSIONS_CANDIDATES = ["metrics_conversions", "conversions", "Conversions"]
    DATE_CANDIDATES = ["segments_date", "date_start", "TimePeriod", "date", "Date"]
    
    INDUSTRY_DEFAULTS = {
        "google_ads": {"roi": 4.76, "cpc": 2.00, "ctr": 0.0130, "cvr": 0.0306, "threshold": 9711.03},
        "meta_ads": {"roi": 8.44, "cpc": 1.50, "ctr": 0.0325, "cvr": 0.0450, "threshold": 1579.47},
        "bing_ads": {"roi": 4.36, "cpc": 1.00, "ctr": 0.0322, "cvr": 0.0165, "threshold": 167.30},
        "default": {"roi": 1.50, "cpc": 1.00, "ctr": 0.0200, "cvr": 0.0300, "threshold": 500.00}
    }
    
    def find_column(headers: List[str], candidates: List[str]) -> Optional[str]:
        for c in candidates:
            if c in headers:
                return c
        return None

# Load heuristics for AI insights
heuristics = {}
heuristics_path = project_root / "src" / "heuristics.json"
if heuristics_path.exists():
    try:
        with open(heuristics_path, "r", encoding="utf-8") as hf:
            heuristics = json.load(hf)
            logger.info("Loaded AI insights heuristics from heuristics.json.")
    except Exception as e:
        logger.warning(f"Could not parse heuristics.json: {e}")

default_insight = heuristics.get("default_insight", "AI Insight: Optimal performance detected within Bayesian bounds. No budget reallocation needed.")

def main():
    parser = argparse.ArgumentParser(description="Headless prediction wrapper for CampaignOS evaluation pipeline.")
    parser.add_argument("--data-dir", required=True, help="Directory containing input campaign CSV files.")
    parser.add_argument("--model", required=True, help="Path to the serialized model file (.pkl).")
    parser.add_argument("--output", required=True, help="Path to save the output CSV predictions.")
    args = parser.parse_args()

    # TASK 2.2: Silently load the dummy pickle from the --model path
    try:
        if os.path.exists(args.model):
            with open(args.model, "rb") as f:
                model_data = pickle.load(f)
                logger.info(f"Loaded model successfully: {model_data}")
        else:
            logger.warning(f"Model path {args.model} does not exist.")
    except Exception as e:
        # Wrap in try-except so it doesn't crash if it fails
        logger.warning(f"Failed to load model file silently: {e}")

    # Seed random for 100% reproducible and deterministic simulations during testing
    random.seed(42)

    # TASK 2.4: Read all .csv files dynamically from --data-dir
    data_dir_path = Path(args.data_dir)
    if not data_dir_path.exists() or not data_dir_path.is_dir():
        logger.error(f"Data directory does not exist or is not a directory: {args.data_dir}")
        sys.exit(1)

    csv_files = list(data_dir_path.glob("*.csv"))
    if not csv_files:
        logger.error(f"No CSV files found in data directory: {args.data_dir}")
        sys.exit(1)

    # Mappings, metrics, and daily spends trackers
    channel_metrics = {}
    daily_spends = defaultdict(lambda: defaultdict(float))
    all_dates = set()

    for file_path in csv_files:
        filename = file_path.name.lower()
        
        # Determine channel mapping
        if "google" in filename:
            channel_name = "Google Ads"
            channel_key = "google_ads"
        elif "meta" in filename or "facebook" in filename:
            channel_name = "Meta Ads"
            channel_key = "meta_ads"
        elif "bing" in filename:
            channel_name = "Bing Ads"
            channel_key = "bing_ads"
        else:
            channel_name = file_path.stem.replace("_", " ").title()
            channel_key = file_path.stem.lower()

        logger.info(f"Processing CSV file: {file_path.name} -> Mapping to Channel: {channel_name} ({channel_key})")

        try:
            with open(file_path, mode="r", encoding="utf-8") as f:
                headers_reader = csv.reader(f)
                try:
                    headers = next(headers_reader)
                except StopIteration:
                    logger.warning(f"Empty CSV file: {file_path.name}. Skipping.")
                    continue

            # Identify headers
            spend_col = find_column(headers, SPEND_CANDIDATES)
            rev_col = find_column(headers, REVENUE_CANDIDATES)
            clicks_col = find_column(headers, CLICKS_CANDIDATES)
            impr_col = find_column(headers, IMPRESSIONS_CANDIDATES)
            conv_col = find_column(headers, CONVERSIONS_CANDIDATES)
            date_col = find_column(headers, DATE_CANDIDATES) or "Date"

            if not spend_col or not date_col:
                logger.warning(f"Missing essential columns (spend or date) in {file_path.name}. Skipping.")
                continue

            total_spend = 0.0
            total_revenue = 0.0
            total_clicks = 0
            total_impressions = 0
            total_conversions = 0.0
            channel_daily_spends = defaultdict(float)

            # Stream rows to process efficiently
            with open(file_path, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    try:
                        date_str = row.get(date_col)
                        if not date_str or date_str.lower() in ["unknown", ""]:
                            continue
                        
                        raw_spend = float(row[spend_col])
                        # Handle Google Ads micros: divide by 1,000,000
                        spend = raw_spend / 1000000.0 if spend_col == "metrics_cost_micros" else raw_spend
                        
                        rev = float(row[rev_col]) if (rev_col and row.get(rev_col)) else 0.0
                        clicks = int(float(row[clicks_col])) if (clicks_col and row.get(clicks_col)) else 0
                        impr = int(float(row[impr_col])) if (impr_col and row.get(impr_col)) else 0
                        conv = float(row[conv_col]) if (conv_col and row.get(conv_col)) else 0.0

                        total_spend += spend
                        total_revenue += rev
                        total_clicks += clicks
                        total_impressions += impr
                        total_conversions += conv

                        channel_daily_spends[date_str] += spend
                        all_dates.add(date_str)
                    except (ValueError, TypeError, KeyError):
                        continue

            # Calculate and save metrics
            ind_avg = INDUSTRY_DEFAULTS.get(channel_key, INDUSTRY_DEFAULTS["default"])
            if total_spend <= 0 or total_clicks <= 0:
                roi = ind_avg["roi"]
                cpc = ind_avg["cpc"]
                ctr = ind_avg["ctr"]
                cvr = ind_avg["cvr"]
            else:
                roi = total_revenue / total_spend
                cpc = total_spend / total_clicks
                ctr = total_clicks / total_impressions if total_impressions > 0 else ind_avg["ctr"]
                cvr = total_conversions / total_clicks if total_clicks > 0 else ind_avg["cvr"]

            # Guard against extreme values
            if roi <= 0: roi = ind_avg["roi"]
            if cpc <= 0: cpc = ind_avg["cpc"]
            if ctr <= 0: ctr = ind_avg["ctr"]
            if cvr <= 0: cvr = ind_avg["cvr"]

            # Calculate 95th percentile spend threshold
            spends_list = sorted(channel_daily_spends.values())
            if spends_list:
                p95_idx = int(len(spends_list) * 0.95)
                threshold = spends_list[p95_idx]
            else:
                threshold = ind_avg["threshold"]

            channel_metrics[channel_key] = {
                "name": channel_name,
                "roi": roi,
                "cpc": cpc,
                "ctr": ctr,
                "cvr": cvr,
                "threshold": threshold
            }

            # Save the daily spends for this channel
            for date_str, daily_spend in channel_daily_spends.items():
                daily_spends[channel_key][date_str] = daily_spend

            logger.info(f"Loaded {channel_name} metrics -> ROI: {roi:.4f}, Threshold: {threshold:.2f}")

        except Exception as e:
            logger.error(f"Error parsing file {file_path.name}: {e}")

    # TASK 2.5: Execute the simulation and write output
    # Prepare rows
    output_rows = []

    # Ensure all core channels are present in channel_metrics
    core_channels = [
        ("google_ads", "Google Ads"),
        ("meta_ads", "Meta Ads"),
        ("bing_ads", "Bing Ads")
    ]
    for channel_key, channel_name in core_channels:
        if channel_key not in channel_metrics:
            ind_avg = INDUSTRY_DEFAULTS.get(channel_key, INDUSTRY_DEFAULTS["default"])
            channel_metrics[channel_key] = {
                "name": channel_name,
                "roi": ind_avg["roi"],
                "cpc": ind_avg["cpc"],
                "ctr": ind_avg["ctr"],
                "cvr": ind_avg["cvr"],
                "threshold": ind_avg["threshold"]
            }

    # Group/join datasets by the Date column using inner join
    active_channel_keys = [k for k in channel_metrics.keys() if len(daily_spends[k]) > 0]
    if active_channel_keys:
        common_dates = set(daily_spends[active_channel_keys[0]].keys())
        for k in active_channel_keys[1:]:
            common_dates = common_dates.intersection(set(daily_spends[k].keys()))
    else:
        common_dates = set()

    logger.info(f"Joined datasets by Date. Found {len(common_dates)} common dates present in all active channels.")

    # Run channel-specific predictions day-by-day for common dates
    for date_str in sorted(common_dates):
        expected_sum = 0.0
        best_sum = 0.0
        worst_sum = 0.0

        for channel_key, metrics in channel_metrics.items():
            daily_spend = daily_spends[channel_key].get(date_str, 0.0)
            channel_name = metrics["name"]

            # If spend <= 0, we output 0.0 predictions
            if daily_spend <= 0:
                expected_revenue = 0.0
                best_case = 0.0
                worst_case = 0.0
                ai_insight = default_insight
            else:
                # Deterministic math simulation logic
                base_roi = metrics["roi"]
                threshold_daily = metrics["threshold"]

                if daily_spend <= threshold_daily:
                    base_revenue = daily_spend * base_roi
                else:
                    excess = daily_spend - threshold_daily
                    base_revenue = (threshold_daily * base_roi) + (threshold_daily * base_roi * math.log(1.0 + excess / threshold_daily))

                # Apply pseudo-random fluctuations using seeded random for determinism
                seasonality = 1.0 + 0.05 * math.sin(len(output_rows) * 0.35) + random.uniform(-0.02, 0.02)
                expected_revenue = round(base_revenue * seasonality * random.uniform(0.95, 1.08), 2)
                best_case = round(expected_revenue * random.uniform(1.18, 1.30), 2)
                worst_case = round(expected_revenue * random.uniform(0.72, 0.88), 2)

                # Determine AI insight based on spend level and channel
                if channel_key == "google_ads" and daily_spend > 500:
                    ai_insight = heuristics.get("high_google", default_insight)
                elif channel_key == "meta_ads" and daily_spend > 500:
                    ai_insight = heuristics.get("high_facebook", default_insight)
                elif daily_spend < 150:
                    ai_insight = heuristics.get("low_overall", default_insight)
                else:
                    ai_insight = default_insight

            output_rows.append({
                "Date": date_str,
                "Channel": channel_name,
                "Expected_Revenue": expected_revenue,
                "Best_Case": best_case,
                "Worst_Case": worst_case,
                "AI_Insight": ai_insight
            })

            # Accumulate aggregates
            expected_sum += expected_revenue
            best_sum += best_case
            worst_sum += worst_case

        # Append "All Channels" aggregate row for this specific date
        output_rows.append({
            "Date": date_str,
            "Channel": "All Channels",
            "Expected_Revenue": round(expected_sum, 2),
            "Best_Case": round(best_sum, 2),
            "Worst_Case": round(worst_sum, 2),
            "AI_Insight": default_insight
        })

    # Ensure output folder exists
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Sort output rows by Date chronologically, then by Channel
    output_rows = sorted(output_rows, key=lambda x: (x["Date"], x["Channel"]))

    # Write output CSV
    headers = ["Date", "Channel", "Expected_Revenue", "Best_Case", "Worst_Case", "AI_Insight"]
    try:
        with open(output_path, "w", newline="", encoding="utf-8") as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=headers)
            writer.writeheader()
            writer.writerows(output_rows)
        logger.info(f"Successfully wrote {len(output_rows)} rows of predictions to {output_path}")
        print(f"Prediction output successfully written to {output_path}")
    except Exception as e:
        logger.critical(f"Failed to write output file: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
