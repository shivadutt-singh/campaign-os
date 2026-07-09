import numpy as np
import pandas as pd
from typing import Any, Dict, List, Optional
from llm.provider import get_llm_provider
from llm.prompt_manager import PromptManager


class AutonomousMarketingAgent:
    """
    Autonomous Marketing Analyst Agent that parses campaign metrics,
    flags anomalies, generates textual reports, and reasons about budget allocations.
    """

    @staticmethod
    def detect_anomalies(df: pd.DataFrame) -> List[Dict[str, Any]]:
        """
        Scans a metrics DataFrame for statistical anomalies in CTR, CPC, and spend
        using standard rolling window standard deviations.
        """
        anomalies = []
        if len(df) < 5:
            # Not enough history to model volatility
            return anomalies

        # Ensure sorted chronologically
        df = df.sort_values("date").copy()

        metrics_to_check = ["ctr", "cpc", "spend"]
        for metric in metrics_to_check:
            if metric not in df.columns:
                continue
            
            # 7-day rolling window stats
            rolling_mean = df[metric].rolling(window=7, min_periods=1).mean()
            rolling_std = df[metric].rolling(window=7, min_periods=1).std().fillna(0.0)

            # Define outlier as > 2.5 standard deviations from rolling average
            for idx, row in df.iterrows():
                val = row[metric]
                mean_val = rolling_mean.loc[idx]
                std_val = rolling_std.loc[idx]

                if std_val > 0 and abs(val - mean_val) > 2.5 * std_val:
                    anomalies.append({
                        "date": str(row["date"].date()) if isinstance(row["date"], pd.Timestamp) else str(row["date"]),
                        "metric": metric,
                        "value": float(val),
                        "expected_range": f"{float(mean_val - 2.5 * std_val):.4f} to {float(mean_val + 2.5 * std_val):.4f}",
                        "severity": "Warning" if abs(val - mean_val) < 4.0 * std_val else "Critical"
                    })
        return anomalies

    @staticmethod
    async def analyze_and_explain(
        metrics_df: pd.DataFrame, 
        prediction_summary: Dict[str, Any],
        prompt_db_template: Optional[str] = None
    ) -> str:
        """
        Aggregates metrics, detects anomalies, explains SHAP predictions,
        and requests the LLM to write a comprehensive marketing analyst report.
        """
        # Run anomaly detection
        anomalies = AutonomousMarketingAgent.detect_anomalies(metrics_df)
        anomalies_str = "\n".join([
            f"- {a['date']}: {a['metric']} anomaly detected ({a['value']:.4f} vs expected {a['expected_range']}) [{a['severity']}]"
            for a in anomalies
        ]) if anomalies else "No statistical anomalies detected."

        # Summarize metrics
        recent_records = metrics_df.tail(7)
        avg_ctr = float(recent_records["ctr"].mean()) if "ctr" in metrics_df.columns else 0.0
        avg_cpc = float(recent_records["cpc"].mean()) if "cpc" in metrics_df.columns else 0.0
        total_spend = float(recent_records["spend"].sum()) if "spend" in metrics_df.columns else 0.0
        total_rev = float(recent_records["revenue"].sum()) if "revenue" in metrics_df.columns else 0.0
        roas = total_rev / total_spend if total_spend > 0 else 0.0

        summary_text = (
            f"Last 7 days spend: ${total_spend:,.2f}\n"
            f"Last 7 days revenue: ${total_rev:,.2f}\n"
            f"Average ROAS: {roas:.2f}\n"
            f"Average CTR: {avg_ctr:.2%}\n"
            f"Average CPC: ${avg_cpc:.2f}"
        )

        # Build prompts
        variables = {
            "metrics_summary": summary_text,
            "anomalies": anomalies_str,
            "predicted_revenue": f"{prediction_summary.get('predicted_revenue', 0.0):,.2f}",
            "predicted_roi": f"{prediction_summary.get('predicted_roi', 0.0):.2f}",
            "shap_values": str(prediction_summary.get("shap_values", {}))
        }

        rendered_prompt = PromptManager.render("anomaly_insights", variables, prompt_db_template)
        
        # Invoke LLM Factory
        llm = get_llm_provider()
        response_text = llm.generate(
            prompt=rendered_prompt,
            system_instruction="You are a Principal Marketing Growth Architect at a top-tier SaaS platform."
        )

        return response_text
