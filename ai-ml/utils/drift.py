from typing import Any, Dict, List
import numpy as np
from scipy.stats import ks_2samp


class DriftMonitor:
    @staticmethod
    def calculate_psi(expected: np.ndarray, actual: np.ndarray, num_buckets: int = 10) -> float:
        """
        Computes the Population Stability Index (PSI) between two numeric arrays.
        PSI < 0.1: No change
        PSI 0.1 - 0.2: Moderate change
        PSI > 0.2: Significant change / drift detected
        """
        if len(expected) == 0 or len(actual) == 0:
            return 0.0
            
        # Determine quantiles based on expected distribution
        percentiles = np.linspace(0, 100, num_buckets + 1)
        buckets = np.percentile(expected, percentiles)
        # Ensure unique bucket edges
        buckets = np.unique(buckets)
        if len(buckets) < 2:
            return 0.0
            
        # Count values in buckets
        expected_counts, _ = np.histogram(expected, bins=buckets)
        actual_counts, _ = np.histogram(actual, bins=buckets)
        
        # Calculate percentages, adding small epsilon to avoid divide-by-zero
        expected_pct = (expected_counts + 1e-4) / len(expected)
        actual_pct = (actual_counts + 1e-4) / len(actual)
        
        # Compute PSI
        psi_value = np.sum((actual_pct - expected_pct) * np.log(actual_pct / expected_pct))
        return float(psi_value)

    @staticmethod
    def detect_data_drift(reference_data: List[float], current_data: List[float]) -> Dict[str, Any]:
        """
        Performs Kolmogorov-Smirnov test to detect feature data drift.
        If p_value < 0.05, drift is detected.
        """
        if len(reference_data) < 5 or len(current_data) < 5:
            return {
                "drift_detected": False,
                "p_value": 1.0,
                "statistic": 0.0,
                "status": "Insufficient data to run KS test"
            }
            
        ref_arr = np.array(reference_data)
        curr_arr = np.array(current_data)
        
        stat, p_val = ks_2samp(ref_arr, curr_arr)
        
        return {
            "drift_detected": bool(p_val < 0.05),
            "p_value": float(p_val),
            "statistic": float(stat),
            "status": "completed"
        }

    @classmethod
    def audit_drift(
        cls,
        ref_features: List[float],
        curr_features: List[float],
        ref_predictions: List[float],
        curr_predictions: List[float]
    ) -> Dict[str, Any]:
        """
        Audits both feature data drift (KS) and prediction/model drift (PSI).
        """
        data_drift = cls.detect_data_drift(ref_features, curr_features)
        
        ref_preds = np.array(ref_predictions)
        curr_preds = np.array(curr_predictions)
        psi_val = cls.calculate_psi(ref_preds, curr_preds)
        
        model_drift_detected = psi_val > 0.2
        
        return {
            "data_drift": data_drift,
            "prediction_drift": {
                "psi": psi_val,
                "drift_detected": model_drift_detected,
                "status": "completed"
            },
            "system_health": "warning" if (data_drift["drift_detected"] or model_drift_detected) else "healthy"
        }
