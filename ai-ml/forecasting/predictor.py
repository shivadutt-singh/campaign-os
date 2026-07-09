import csv
import math
import os
import random
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# Candidate column names from historical data
SPEND_CANDIDATES = ["metrics_cost_micros", "spend", "Spend", "cost", "Cost"]
REVENUE_CANDIDATES = ["metrics_conversions_value", "conversion", "conversion_value", "Conversion", "Revenue", "revenue"]
CLICKS_CANDIDATES = ["metrics_clicks", "clicks", "Clicks"]
IMPRESSIONS_CANDIDATES = ["metrics_impressions", "impressions", "Impressions"]
CONVERSIONS_CANDIDATES = ["metrics_conversions", "conversions", "Conversions"]
DATE_CANDIDATES = ["segments_date", "date_start", "TimePeriod", "date", "Date"]

# Default metrics based on industry benchmarks
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


def calculate_historical_metrics() -> Dict[str, Dict[str, float]]:
    """
    Streams CSV rows from raw historical files and calculates metrics.
    """
    # Resolve historical data path relative to this file
    base_dir = Path(__file__).resolve().parent.parent.parent
    data_dir = base_dir / "python-engine" / "data"
    
    metrics = {k: dict(v) for k, v in INDUSTRY_DEFAULTS.items()}
    
    file_mappings = {
        "google_ads_campaign_stats.csv": "google_ads",
        "meta_ads_campaign_stats.csv": "meta_ads",
        "bing_campaign_stats.csv": "bing_ads"
    }
    
    for filename, channel_key in file_mappings.items():
        file_path = data_dir / filename
        if not file_path.exists():
            continue
            
        try:
            with open(file_path, mode="r", encoding="utf-8") as f:
                headers_reader = csv.reader(f)
                try:
                    headers = next(headers_reader)
                except StopIteration:
                    continue
            
            spend_col = find_column(headers, SPEND_CANDIDATES)
            rev_col = find_column(headers, REVENUE_CANDIDATES)
            clicks_col = find_column(headers, CLICKS_CANDIDATES)
            impr_col = find_column(headers, IMPRESSIONS_CANDIDATES)
            conv_col = find_column(headers, CONVERSIONS_CANDIDATES)
            date_col = find_column(headers, DATE_CANDIDATES) or "Date"
            
            if not (spend_col and rev_col and clicks_col and impr_col):
                continue
                
            total_spend = 0.0
            total_revenue = 0.0
            total_clicks = 0
            total_impressions = 0
            total_conversions = 0.0
            daily_spends = defaultdict(float)
            
            with open(file_path, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    try:
                        date = row.get(date_col, "Unknown")
                        raw_spend = float(row[spend_col])
                        spend = raw_spend / 1000000.0 if spend_col == "metrics_cost_micros" else raw_spend
                        rev = float(row[rev_col])
                        clicks = int(float(row[clicks_col]))
                        impr = int(float(row[impr_col]))
                        conv = float(row[conv_col]) if (conv_col and row.get(conv_col)) else 0.0
                        
                        total_spend += spend
                        total_revenue += rev
                        total_clicks += clicks
                        total_impressions += impr
                        total_conversions += conv
                        daily_spends[date] += spend
                    except (ValueError, TypeError, KeyError):
                        continue
            
            ind_avg = INDUSTRY_DEFAULTS[channel_key]
            if total_spend <= 0 or total_clicks <= 0:
                cpc = ind_avg["cpc"]
                ctr = ind_avg["ctr"]
                roi = ind_avg["roi"]
                cvr = ind_avg["cvr"]
            else:
                cpc = total_spend / total_clicks
                ctr = total_clicks / total_impressions if total_impressions > 0 else ind_avg["ctr"]
                roi = total_revenue / total_spend
                cvr = total_conversions / total_clicks if total_clicks > 0 else ind_avg["cvr"]
            
            # Constraints and defaults
            cpc = max(0.01, cpc)
            ctr = max(0.0001, ctr)
            roi = max(0.1, roi)
            cvr = max(0.0001, cvr)
            
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
        except Exception:
            continue
            
    return metrics


class SimulationEngine:
    @staticmethod
    def simulate(budgets: Dict[str, float]) -> List[Dict[str, Any]]:
        """
        Runs a 10-day marketing simulation.
        Input: budgets dict: { "Google Ads": 10000.0, "Facebook Ads": 8000.0, ... }
        Output: list of daily row projections
        """
        # Load historical metrics
        metrics = calculate_historical_metrics()
        
        # Load custom insights heuristics if present
        base_dir = Path(__file__).resolve().parent.parent.parent
        heuristics_path = base_dir / "src" / "heuristics.json"
        
        heuristics = {}
        if heuristics_path.exists():
            import json
            try:
                with open(heuristics_path, "r", encoding="utf-8") as f:
                    heuristics = json.load(f)
            except Exception:
                pass
                
        default_insight = heuristics.get("default_insight", "AI Insight: Optimal performance detected within bounds.")
        
        # Calculate total budget
        total_budget = sum(float(val) for val in budgets.values() if isinstance(val, (int, float)) or str(val).replace(".", "", 1).isdigit())
        
        start_date = datetime.now()
        daily_totals = {}
        
        # Norm function
        def normalize_channel(ch: str) -> str:
            ch_lower = ch.lower()
            if "google" in ch_lower:
                return "google_ads"
            elif "facebook" in ch_lower or "meta" in ch_lower:
                return "meta_ads"
            elif "bing" in ch_lower:
                return "bing_ads"
            else:
                return "default"

        # Check budget conditions for AI insights
        ai_insight = default_insight
        google_budget = budgets.get("Google Ads", budgets.get("google_ads", 0.0))
        facebook_budget = budgets.get("Facebook Ads", budgets.get("facebook_ads", 0.0))
        
        if google_budget > 5000:
            ai_insight = heuristics.get("high_google", default_insight)
        elif facebook_budget > 5000:
            ai_insight = heuristics.get("high_facebook", default_insight)
        elif 0 < total_budget < 1500:
            ai_insight = heuristics.get("low_overall", default_insight)

        for channel, budget_val in budgets.items():
            try:
                budget = float(budget_val)
            except (ValueError, TypeError):
                budget = 0.0
                
            ch_key = normalize_channel(channel)
            ch_info = metrics.get(ch_key, metrics["default"])
            base_roi = ch_info["roi"]
            threshold_daily = ch_info["threshold"]
            threshold_total = 10.0 * threshold_daily
            
            # Diminishing returns calculation
            saturation_warning = budget > threshold_total
            
            for i in range(10):
                sim_date = (start_date + timedelta(days=i)).strftime("%Y-%m-%d")
                base_daily = budget / 10.0
                
                # Daily saturation calculation
                if base_daily <= threshold_daily:
                    base_revenue = base_daily * base_roi
                else:
                    excess = base_daily - threshold_daily
                    base_revenue = (threshold_daily * base_roi) + (threshold_daily * base_roi * math.log(1.0 + excess / threshold_daily))
                
                # Build seasonality and random noise
                budget_factor = budget / 5000.0
                seasonality = (
                    1.0
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
                best_case = round(expected_revenue * random.uniform(1.18, 1.30), 2)
                worst_case = round(expected_revenue * random.uniform(0.72, 0.88), 2)
                
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

        # Build list of rows
        rows = []
        for date_str, values in daily_totals.items():
            rows.append({
                "Date": date_str,
                "Channel": "All Channels",
                "Expected_Revenue": round(values["Expected_Revenue"], 2),
                "Best_Case": round(values["Best_Case"], 2),
                "Worst_Case": round(values["Worst_Case"], 2),
                "AI_Insight": values["AI_Insight"]
            })
            
        return sorted(rows, key=lambda x: x["Date"])
