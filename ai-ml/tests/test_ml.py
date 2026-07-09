import sys
import os
import pytest
import numpy as np

# Add parent path to import modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from optimization.solver import OptimizationEngine
from forecasting.predictor import SimulationEngine
from utils.drift import DriftMonitor


def test_optimization_engine():
    # Test baseline
    res = OptimizationEngine.optimize(100000)
    assert res["target_revenue"] == 100000
    assert res["total_recommended_budget"] == 24500
    assert res["allocations"]["google_ads"] == 10000
    assert res["allocations"]["meta_ads"] == 8000
    assert res["allocations"]["bing_ads"] == 6500

    # Test numerical solver
    res_other = OptimizationEngine.optimize(50000)
    assert res_other["target_revenue"] == 50000
    assert res_other["total_recommended_budget"] > 0
    assert sum(res_other["allocations"].values()) == res_other["total_recommended_budget"]


def test_simulation_engine():
    budgets = {"Google Ads": 10000.0, "Facebook Ads": 8000.0}
    rows = SimulationEngine.simulate(budgets)
    assert len(rows) == 10
    for row in rows:
        assert "Expected_Revenue" in row
        assert "Best_Case" in row
        assert "Worst_Case" in row
        assert "AI_Insight" in row
        assert row["Best_Case"] >= row["Expected_Revenue"]
        assert row["Worst_Case"] <= row["Expected_Revenue"]


def test_drift_monitor():
    expected = np.random.normal(100, 10, 100)
    # Similar distribution: PSI should be low
    actual_similar = np.random.normal(100, 10, 100)
    psi_similar = DriftMonitor.calculate_psi(expected, actual_similar)
    assert psi_similar < 0.2

    # Shifted distribution: PSI should be higher
    actual_shifted = np.random.normal(120, 10, 100)
    psi_shifted = DriftMonitor.calculate_psi(expected, actual_shifted)
    assert psi_shifted > 0.1

    # KS Data drift
    ref = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0]
    curr_same = [1.1, 2.0, 2.9, 4.1, 5.0, 6.0, 7.1, 8.0, 9.0, 9.9]
    res_no_drift = DriftMonitor.detect_data_drift(ref, curr_same)
    assert res_no_drift["drift_detected"] is False

    curr_drifted = [10.0, 12.0, 15.0, 20.0, 30.0, 40.0, 50.0, 60.0, 70.0, 80.0]
    res_drift = DriftMonitor.detect_data_drift(ref, curr_drifted)
    assert res_drift["drift_detected"] is True
