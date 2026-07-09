import datetime
from typing import Any, Dict, List


class ExecutiveReportGenerator:
    """
    Formulates a formatted textual/markdown executive summary of marketing performance,
    optimization results, and predictive drift diagnostics.
    """

    @staticmethod
    def generate_report(
        campaign_name: str,
        current_metrics: Dict[str, float],
        predictions: Dict[str, Any],
        allocations: Dict[str, float],
        anomalies: List[Dict[str, Any]],
        risk_score: Dict[str, Any]
    ) -> str:
        """
        Synthesizes a complete markdown executive summary report.
        """
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Format anomalies list
        anomalies_md = ""
        if anomalies:
            for a in anomalies:
                anomalies_md += f"- **{a['date']}**: Spike in *{a['metric']}* ({a['value']:.4f} vs range {a['expected_range']}) - Severity: {a['severity']}\n"
        else:
            anomalies_md = "*No significant anomalies detected in recent cycles.*\n"

        # Format allocation channels list
        allocations_md = ""
        for channel, spend in allocations.items():
            allocations_md += f"- **{channel.replace('_', ' ').title()}**: ${spend:,.2f}\n"

        report = f"""# Executive Marketing Intelligence Report
**Campaign**: {campaign_name}
**Generated At**: {now_str}
**Security Level**: Internal Confidential

---

## 📊 1. Core Performance Metrics (Recent Window)
- **Spend**: ${current_metrics.get('spend', 0.0):,.2f}
- **Revenue**: ${current_metrics.get('revenue', 0.0):,.2f}
- **ROAS**: {current_metrics.get('roas', 0.0):.2f}x
- **Average CTR**: {current_metrics.get('ctr', 0.0):.2%}
- **Average CPC**: ${current_metrics.get('cpc', 0.0):,.2f}

## 🔮 2. Projections & AI Forecasts (10-Day Horizon)
- **Expected Revenue Target**: ${predictions.get('predicted_revenue', 0.0):,.2f}
- **Forecasted ROI**: {predictions.get('predicted_roi', 0.0):.2f}x
- **Model Explainability (Top Drivers)**:
  - Spend coefficient weight: {predictions.get('shap_values', {}).get('spend', 0.85):.3f}
  - Conversion seasonality weight: {predictions.get('shap_values', {}).get('seasonality', 0.12):.3f}

## ⚙️ 3. Capital Optimization & Allocations
Recommended channel spend distribution:
{allocations_md}

## 🚨 4. Risk & Statistical Anomalies
- **Composite Risk Rating**: {risk_score.get('risk_level', 'Medium')} ({risk_score.get('score', 0.0):.1f}/100)
- **Factors**: Volatility rating ({risk_score.get('factors', {}).get('roas_volatility_score', 0.0):.1f}), Drift rating ({risk_score.get('factors', {}).get('data_drift_score', 0.0):.1f})

### Anomalies Log:
{anomalies_md}

---
*Report compiled automatically by CampaignOS Autonomous Analyst Agent.*
"""
        return report
