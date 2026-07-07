import argparse
import csv
import json
import logging
import math
import os
import random
import sys
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# 1. Setup Enterprise Logging to stderr to keep stdout completely clean for JSON output
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)
logger = logging.getLogger("CampaignOS_Predictor")
logger.info("Upgraded prediction engine starting up.")

# Dynamic Header Candidates
SPEND_CANDIDATES = ["metrics_cost_micros", "spend", "Spend", "cost", "Cost"]
REVENUE_CANDIDATES = ["metrics_conversions_value", "conversion", "conversion_value", "Conversion", "Revenue", "revenue"]
CLICKS_CANDIDATES = ["metrics_clicks", "clicks", "Clicks"]
IMPRESSIONS_CANDIDATES = ["metrics_impressions", "impressions", "Impressions"]
CONVERSIONS_CANDIDATES = ["metrics_conversions", "conversions", "Conversions"]
DATE_CANDIDATES = ["segments_date", "date_start", "TimePeriod", "date", "Date"]

# Realistic Industry Fallback defaults
INDUSTRY_DEFAULTS = {
    "google_ads": {"roi": 4.76, "cpc": 2.00, "ctr": 0.0130, "cvr": 0.0306, "threshold": 9711.03},
    "meta_ads": {"roi": 8.44, "cpc": 1.50, "ctr": 0.0325, "cvr": 0.0450, "threshold": 1579.47},
    "bing_ads": {"roi": 4.36, "cpc": 1.00, "ctr": 0.0322, "cvr": 0.0165, "threshold": 167.30},
    "default": {"roi": 1.50, "cpc": 1.00, "ctr": 0.0200, "cvr": 0.0300, "threshold": 500.00}
}

def find_column(headers: List[str], candidates: List[str]) -> Optional[str]:
    """
    Returns the first matching column name from candidate options.
    """
    for c in candidates:
        if c in headers:
            return c
    return None

def load_historical_metrics(script_dir: Path) -> Dict[str, Dict[str, float]]:
    """
    Dynamically resolves CSV files and calculates base metrics (ROI/ROAS, CPC, CTR, CVR, and Saturation Threshold).
    Uses memory-efficient O(N) streaming.
    """
    data_dir = (script_dir / ".." / "python-engine" / "data").resolve()
    
    # Initialize metrics with default fallbacks
    metrics = {k: dict(v) for k, v in INDUSTRY_DEFAULTS.items()}
    
    file_mappings = {
        "google_ads_campaign_stats.csv": "google_ads",
        "meta_ads_campaign_stats.csv": "meta_ads",
        "bing_campaign_stats.csv": "bing_ads"
    }
    
    for filename, channel_key in file_mappings.items():
        try:
            file_path = data_dir / filename
            if not file_path.exists():
                logger.warning(f"Historical file not found: {file_path}. Using fallback metrics.")
                continue
                
            with open(file_path, mode="r", encoding="utf-8") as f:
                # Read headers first to detect columns dynamically
                headers_reader = csv.reader(f)
                try:
                    headers = next(headers_reader)
                except StopIteration:
                    logger.warning(f"Empty CSV file: {file_path}. Using fallbacks.")
                    continue
            
            spend_col = find_column(headers, SPEND_CANDIDATES)
            rev_col = find_column(headers, REVENUE_CANDIDATES)
            clicks_col = find_column(headers, CLICKS_CANDIDATES)
            impr_col = find_column(headers, IMPRESSIONS_CANDIDATES)
            conv_col = find_column(headers, CONVERSIONS_CANDIDATES)
            date_col = find_column(headers, DATE_CANDIDATES) or "Date"
            
            # If crucial columns are missing, fall back directly
            if not (spend_col and rev_col and clicks_col and impr_col):
                logger.warning(f"Missing crucial metrics columns in {filename}. Fallback active.")
                continue
                
            total_spend = 0.0
            total_revenue = 0.0
            total_clicks = 0
            total_impressions = 0
            total_conversions = 0.0
            daily_spends = defaultdict(float)
            
            # Stream file line-by-line
            with open(file_path, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    try:
                        # Extract date
                        date = row.get(date_col, "Unknown")
                        
                        # Extract and parse cost
                        raw_spend = float(row[spend_col])
                        # Handle Google Ads micros: divide by 1,000,000
                        spend = raw_spend / 1000000.0 if spend_col == "metrics_cost_micros" else raw_spend
                        
                        # Extract and parse revenue
                        rev = float(row[rev_col])
                        
                        # Extract clicks & impressions
                        clicks = int(float(row[clicks_col]))
                        impr = int(float(row[impr_col]))
                        
                        # Extract conversions (if present)
                        conv = float(row[conv_col]) if (conv_col and row.get(conv_col)) else 0.0
                        
                        # Sum values to compute weighted averages
                        total_spend += spend
                        total_revenue += rev
                        total_clicks += clicks
                        total_impressions += impr
                        total_conversions += conv
                        daily_spends[date] += spend
                    except (ValueError, TypeError, KeyError):
                        continue
            
            # 2. Check for Safety Fallbacks: If Total Spend or Clicks is 0, default to industry averages
            ind_avg = INDUSTRY_DEFAULTS[channel_key]
            
            if total_spend <= 0 or total_clicks <= 0:
                logger.warning(f"Insufficient spend/clicks data in {filename}. Using safety defaults.")
                cpc = ind_avg["cpc"]
                ctr = ind_avg["ctr"]
                roi = ind_avg["roi"]
                cvr = ind_avg["cvr"]
            else:
                # Calculate True Weighted Averages
                cpc = total_spend / total_clicks
                ctr = total_clicks / total_impressions if total_impressions > 0 else ind_avg["ctr"]
                roi = total_revenue / total_spend
                
                if conv_col:
                    cvr = total_conversions / total_clicks if total_clicks > 0 else ind_avg["cvr"]
                else:
                    # Fallback CVR for channels without conversions counts
                    cvr = ind_avg["cvr"]
            
            # Apply safety minimums to prevent 0 division / high values
            if cpc <= 0:
                cpc = ind_avg["cpc"]
            if ctr <= 0:
                ctr = ind_avg["ctr"]
            if roi <= 0:
                roi = ind_avg["roi"]
            if cvr <= 0:
                cvr = ind_avg["cvr"]
                
            # Determine daily maximum spend threshold (95th percentile)
            spends_list = sorted(daily_spends.values())
            if spends_list:
                p95_idx = int(len(spends_list) * 0.95)
                threshold = spends_list[p95_idx]
            else:
                threshold = ind_avg["threshold"]
                
            metrics[channel_key] = {
                "roi": roi,
                "cpc": cpc,
                "ctr": ctr,
                "cvr": cvr,
                "threshold": threshold
            }
            logger.info(f"Loaded {channel_key} -> ROAS/ROI: {roi:.4f}, CPC: ${cpc:.4f}, CTR: {ctr:.4f}, CVR: {cvr:.4f}, Threshold: ${threshold:.2f}")
            
        except Exception as e:
            logger.error(f"Error parsing historical file {filename}: {e}. Using fallback.")
            
    return metrics

def main():
    try:
        # Set up argument parsing
        parser = argparse.ArgumentParser(description="Predict digital marketing performance.")
        parser.add_argument("--input", required=True, help="Path to input JSON file.")
        parser.add_argument("--output", required=True, help="Path to output CSV file.")
        args = parser.parse_args()

        # Input Validation
        if not os.path.exists(args.input):
            logger.error(f"Input file not found at: {args.input}")
            sys.exit(1)

        with open(args.input, "r", encoding="utf-8") as f:
            try:
                budget_data = json.load(f)
            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON format in input file: {e}")
                sys.exit(1)

        # Heuristics Loading for Insights
        script_dir = Path(__file__).resolve().parent
        heuristics_path = script_dir / "heuristics.json"
        
        heuristics = {}
        if heuristics_path.exists():
            with open(heuristics_path, "r", encoding="utf-8") as hf:
                try:
                    heuristics = json.load(hf)
                except json.JSONDecodeError as e:
                    logger.warning(f"heuristics.json is corrupted ({e}). Falling back to default AI insights.")
        else:
            logger.warning("heuristics.json not found. Proceeding with default AI insights.")

        default_insight = heuristics.get("default_insight", "AI Insight: Optimal performance detected within bounds.")

        # Calculate total budget safely
        try:
            total_budget = sum(float(val) for val in budget_data.values() if str(val).replace(".", "", 1).isdigit())
        except Exception as e:
            logger.warning(f"Error calculating total budget: {e}. Setting to 0.")
            total_budget = 0.0

        # Load dynamic performance metrics from CSVs
        metrics = load_historical_metrics(script_dir)

        headers = ["Date", "Channel", "Expected_Revenue", "Best_Case", "Worst_Case", "AI_Insight"]
        start_date = datetime.now()
        daily_totals = {}
        
        channel_metrics = {}
        total_predicted_revenue = 0.0

        for channel, budget_val in budget_data.items():
            try:
                budget = float(budget_val)
            except (ValueError, TypeError):
                logger.warning(f"Invalid budget value for {channel}: '{budget_val}'. Defaulting to 0.0")
                budget = 0.0

            # Normalize channel key to match CSV metric keys
            ch_lower = channel.lower()
            if "google" in ch_lower:
                ch_key = "google_ads"
            elif "facebook" in ch_lower or "meta" in ch_lower:
                ch_key = "meta_ads"
            elif "bing" in ch_lower:
                ch_key = "bing_ads"
            else:
                ch_key = "default"

            ch_info = metrics.get(ch_key, metrics["default"])
            base_roi = ch_info["roi"]
            cpc = ch_info["cpc"]
            ctr = ch_info["ctr"]
            cvr = ch_info["cvr"]
            threshold_daily = ch_info["threshold"]
            threshold_total = 10.0 * threshold_daily

            # 1. Apply Diminishing Returns logic for overall predicted revenue
            saturation_warning = budget > threshold_total
            if not saturation_warning:
                predicted_revenue = budget * base_roi
            else:
                predicted_revenue = (threshold_total * base_roi) + (threshold_total * base_roi * math.log(1.0 + (budget - threshold_total) / threshold_total))

            # 2. Calculate dynamic sub-metrics safely
            expected_clicks = budget / cpc if cpc > 0 else 0.0
            impressions = expected_clicks / ctr if ctr > 0 else 0.0
            calculated_roas = predicted_revenue / budget if budget > 0 else 0.0

            # Build granular response metrics
            channel_metrics[ch_key] = {
                "predicted_revenue": round(predicted_revenue, 1),
                "impressions": int(round(impressions)),
                "expected_clicks": int(round(expected_clicks)),
                "ctr": round(ctr, 4),
                "conversion_rate": round(cvr, 4),
                "roas": round(calculated_roas, 2),
                "saturation_warning": saturation_warning
            }
            total_predicted_revenue += predicted_revenue

            # 3. Simulate 10-day daily records for CSV file output (preserves route.ts integration)
            if channel in ["Google Ads", "google_ads"] and budget > 5000:
                ai_insight = heuristics.get("high_google", default_insight)
            elif channel in ["Facebook Ads", "facebook_ads"] and budget > 5000:
                ai_insight = heuristics.get("high_facebook", default_insight)
            elif total_budget < 1500 and total_budget > 0:
                ai_insight = heuristics.get("low_overall", default_insight)
            else:
                ai_insight = default_insight

            for i in range(10):
                sim_date = (start_date + timedelta(days=i)).strftime("%Y-%m-%d")
                base_daily = budget / 10
                
                # Daily saturation calculation
                if base_daily <= threshold_daily:
                    base_revenue = base_daily * base_roi
                else:
                    excess = base_daily - threshold_daily
                    base_revenue = (threshold_daily * base_roi) + (threshold_daily * base_roi * math.log(1.0 + excess / threshold_daily))

                budget_factor = budget / 5000
                seasonality = (
                    1
                    + budget_factor * 0.15 * math.sin(i * 0.35)
                    + budget_factor * 0.08 * math.sin(i * 0.9)
                    + random.uniform(-0.02, 0.02)
                )

                expected_revenue = round(
                    base_revenue
                    * seasonality
                    * random.uniform(0.95, 1.08),
                    2
                )

                best_case = round(
                    expected_revenue * random.uniform(1.18, 1.30),
                    2
                )

                worst_case = round(
                    expected_revenue * random.uniform(0.72, 0.88),
                    2
                )

                if sim_date not in daily_totals:
                    daily_totals[sim_date] = {
                        "Expected_Revenue": 0.0,
                        "Best_Case": 0.0,
                        "Worst_Case": 0.0,
                        "AI_Insight": ai_insight
                    }

                daily_totals[sim_date]["Expected_Revenue"] += expected_revenue
                daily_totals[sim_date]["Best_Case"] += best_case
                daily_totals[sim_date]["Worst_Case"] += worst_case
                daily_totals[sim_date]["AI_Insight"] = ai_insight

        # Write simulation daily totals to CSV
        rows = []
        for date, values in daily_totals.items():
            rows.append({
                "Date": date,
                "Channel": "All Channels",
                "Expected_Revenue": round(values["Expected_Revenue"], 2),
                "Best_Case": round(values["Best_Case"], 2),
                "Worst_Case": round(values["Worst_Case"], 2),
                "AI_Insight": values["AI_Insight"]
            })

        rows = sorted(rows, key=lambda x: x["Date"])
        
        output_dir = os.path.dirname(args.output)
        if output_dir and not os.path.exists(output_dir):
            os.makedirs(output_dir, exist_ok=True)

        with open(args.output, "w", newline="", encoding="utf-8") as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=headers)
            writer.writeheader()
            writer.writerows(rows)

        # Output the enriched JSON metrics to stdout as requested by the contract
        stdout_payload = {
            "total_predicted_revenue": round(total_predicted_revenue, 1),
            "channel_metrics": channel_metrics
        }
        print(json.dumps(stdout_payload, indent=2))
        
        logger.info(f"Enriched metrics printed to stdout and simulation CSV saved to {args.output}")
        sys.exit(0)

    except Exception as e:
        logger.critical(f"Fatal unhandled exception in predictor: {e}", exc_info=True)
        # Even on crash, output a parseable JSON error structure to stdout so the caller doesn't break
        err_payload = {
            "error": "Simulation execution failed",
            "details": str(e)
        }
        print(json.dumps(err_payload, indent=2))
        sys.exit(1)

if __name__ == "__main__":
    random.seed()
    main()
