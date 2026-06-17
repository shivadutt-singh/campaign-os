import os
import sys
import json
import csv
import argparse
import random
import logging
from datetime import datetime, timedelta

# 1. Setup Enterprise Logging (Replacing print)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("CampaignOS_Predictor")

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
            sys.exit(1) # Graceful failure code for Node.js

        with open(args.input, "r", encoding="utf-8") as f:
            try:
                budget_data = json.load(f)
            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON format in input file: {e}")
                sys.exit(1)

        # Heuristics Loading Logic (Fixing the silent failure)
        script_dir = os.path.dirname(os.path.abspath(__file__))
        heuristics_path = os.path.join(script_dir, "heuristics.json")
        
        heuristics = {}
        if os.path.exists(heuristics_path):
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

        headers = ["Date", "Channel", "Expected_Revenue", "Best_Case", "Worst_Case", "AI_Insight"]
        rows = []
        start_date = datetime.now()

        multipliers = {
            "google_ads": 1.4, "Google Ads": 1.4,
            "facebook_ads": 1.2, "Facebook Ads": 1.2,
            "linkedin_ads": 1.6, "LinkedIn Ads": 1.6,
            "default": 1.1
        }

        output_dir = os.path.dirname(args.output)
        if output_dir and not os.path.exists(output_dir):
            os.makedirs(output_dir, exist_ok=True)

        for channel, budget_val in budget_data.items():
            try:
                budget = float(budget_val)
            except (ValueError, TypeError):
                logger.warning(f"Invalid budget value for {channel}: '{budget_val}'. Defaulting to 0.0")
                budget = 0.0  # Fixed magic number 

            multiplier = multipliers.get(channel, multipliers["default"])

            # Decide AI insight
            if channel in ["Google Ads", "google_ads"] and budget > 5000:
                ai_insight = heuristics.get("high_google", default_insight)
            elif channel in ["Facebook Ads", "facebook_ads"] and budget > 5000:
                ai_insight = heuristics.get("high_facebook", default_insight)
            elif total_budget < 1500 and total_budget > 0:
                ai_insight = heuristics.get("low_overall", default_insight)
            else:
                ai_insight = default_insight

            # Generate Simulation
            for i in range(7):
                sim_date = (start_date + timedelta(days=i)).strftime("%Y-%m-%d")
                
                seed = int(budget) + i
                random.seed(seed)
                noise = random.uniform(0.9, 1.1)
                
                expected_revenue = round(budget * (multiplier / 7.0) * noise, 2)
                best_case = round(expected_revenue * random.uniform(1.15, 1.3), 2)
                worst_case = round(expected_revenue * random.uniform(0.7, 0.85), 2)

                rows.append({
                    "Date": sim_date,
                    "Channel": channel,
                    "Expected_Revenue": str(expected_revenue),
                    "Best_Case": str(best_case),
                    "Worst_Case": str(worst_case),
                    "AI_Insight": ai_insight
                })

        with open(args.output, "w", newline="", encoding="utf-8") as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=headers)
            writer.writeheader()
            writer.writerows(rows) # Optimized using writerows

        # Success Logging instead of print
        logger.info(f"Simulation generated {len(rows)} records successfully -> {args.output}")
        sys.exit(0) # Standard success exit code

    except Exception as e:
        # Global catch-all to prevent raw Python tracebacks from breaking IPC bridge
        logger.critical(f"Fatal unhandled exception in predictor: {e}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    main()