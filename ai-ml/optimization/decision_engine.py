import numpy as np
from typing import Any, Dict, List


class AIDecisionEngine:
    """
    Decoupled decision logic for budget scaling, ROI decline diagnostic audits,
    channel saturation evaluation, and risk scoring.
    """

    @staticmethod
    def evaluate_risk(
        daily_roas: List[float], 
        drift_score: float, 
        forecast_uncertainty: float
    ) -> Dict[str, Any]:
        """
        Computes a composite risk score (0 to 100) based on ROAS volatility, 
        feature data drift, and forecast margin of error.
        """
        if not daily_roas:
            return {"score": 50.0, "risk_level": "Medium", "factors": ["No historical data"]}

        # 1. Volatility (std dev of ROAS)
        volatility = float(np.std(daily_roas))
        volatility_score = min(volatility * 20.0, 40.0) # max 40 points

        # 2. Drift penalty
        drift_penalty = min(drift_score * 30.0, 30.0) # max 30 points

        # 3. Forecast uncertainty penalty (range 0 to 1)
        uncertainty_penalty = min(forecast_uncertainty * 30.0, 30.0) # max 30 points

        composite_score = float(volatility_score + drift_penalty + uncertainty_penalty)
        composite_score = max(0.0, min(100.0, composite_score))

        if composite_score >= 70.0:
            level = "High"
        elif composite_score >= 40.0:
            level = "Medium"
        else:
            level = "Low"

        return {
            "score": composite_score,
            "risk_level": level,
            "volatility": volatility,
            "drift_score": drift_score,
            "forecast_uncertainty": forecast_uncertainty,
            "factors": {
                "roas_volatility_score": volatility_score,
                "data_drift_score": drift_penalty,
                "model_uncertainty_score": uncertainty_penalty
            }
        }

    @staticmethod
    def audit_roi_decline(
        current_metrics: Dict[str, float], 
        baseline_metrics: Dict[str, float]
    ) -> Dict[str, Any]:
        """
        Diagnoses why campaign ROI dropped by checking changes in CPC, CTR, and CPA.
        """
        cpc_pct = 0.0
        ctr_pct = 0.0
        spend_pct = 0.0
        reasons = []

        cur_cpc = current_metrics.get("cpc", 0.0)
        base_cpc = baseline_metrics.get("cpc", 0.0)
        if base_cpc > 0:
            cpc_pct = (cur_cpc - base_cpc) / base_cpc
            if cpc_pct > 0.1:
                reasons.append(f"Cost-Per-Click (CPC) increased by {cpc_pct:.1%}, inflating costs.")

        cur_ctr = current_metrics.get("ctr", 0.0)
        base_ctr = baseline_metrics.get("ctr", 0.0)
        if base_ctr > 0:
            ctr_pct = (cur_ctr - base_ctr) / base_ctr
            if ctr_pct < -0.1:
                reasons.append(f"Click-Through Rate (CTR) dropped by {abs(ctr_pct):.1%}, indicating ad fatigue.")

        cur_spend = current_metrics.get("spend", 0.0)
        base_spend = baseline_metrics.get("spend", 0.0)
        if base_spend > 0:
            spend_pct = (cur_spend - base_spend) / base_spend
            if spend_pct > 0.2:
                reasons.append(f"Daily spend increased by {spend_pct:.1%}, pushing the channel into saturation.")

        if not reasons:
            reasons.append("ROI variance is within standard statistical bounds.")

        return {
            "roi_dropped": current_metrics.get("roas", 0.0) < baseline_metrics.get("roas", 0.0),
            "cpc_change_pct": cpc_pct,
            "ctr_change_pct": ctr_pct,
            "spend_change_pct": spend_pct,
            "primary_drivers": reasons
        }

    @staticmethod
    def evaluate_saturation(spend: float, saturation_threshold: float) -> Dict[str, Any]:
        """
        Evaluates if a channel is saturated based on log-curves thresholds.
        """
        ratio = spend / saturation_threshold if saturation_threshold > 0 else 0.0
        is_saturated = ratio >= 0.9
        
        return {
            "spend_to_threshold_ratio": ratio,
            "is_saturated": is_saturated,
            "warning": "Channel spend is exceeding the logarithmic yield limit; diminishing returns are active." if is_saturated else "Channel yields remain linear."
        }

    @staticmethod
    def recommend_actions(campaigns: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Analyzes a list of campaigns to identify which should receive more budget, 
        which should scale, and which should be paused.
        """
        recommendations = []
        for c in campaigns:
            name = c.get("name", "Unnamed")
            roas = c.get("roas", 1.0)
            ctr = c.get("ctr", 0.01)
            spend = c.get("spend", 0.0)
            threshold = c.get("saturation_threshold", 5000.0)
            
            if roas < 0.8:
                action = "PAUSE"
                reason = f"Campaign exhibits poor performance with ROAS of {roas:.2f} (below profitability threshold)."
            elif roas >= 2.0 and spend < 0.8 * threshold:
                action = "SCALE"
                reason = f"Campaign exhibits high performance with ROAS of {roas:.2f} and is below its saturation limits."
            elif spend >= 0.9 * threshold:
                action = "REDISTRIBUTE"
                reason = f"Campaign spend (${spend:,.2f}) is hitting saturation. Shift marginal budget to other campaigns."
            else:
                action = "HOLD"
                reason = f"Performance is stable. Maintain current pacing."

            recommendations.append({
                "campaign": name,
                "action": action,
                "reason": reason,
                "current_roas": roas,
                "saturation_ratio": spend / threshold if threshold > 0 else 0.0
            })
        return recommendations
