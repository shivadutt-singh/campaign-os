import os
import pickle
import time
from typing import Any, Dict, Tuple
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score

# Dynamic Imports for tree libraries to fail gracefully if not fully compiled
try:
    from xgboost import XGBRegressor
except ImportError:
    XGBRegressor = None

try:
    from lightgbm import LGBMRegressor
except ImportError:
    LGBMRegressor = None

try:
    from catboost import CatBoostRegressor
except ImportError:
    CatBoostRegressor = None

# Column candidate maps
SPEND_CANDIDATES = ["metrics_cost_micros", "spend", "Spend", "cost", "Cost"]
REVENUE_CANDIDATES = ["metrics_conversions_value", "conversion", "conversion_value", "Conversion", "Revenue", "revenue"]


def parse_columns(df: pd.DataFrame) -> Tuple[str, str]:
    """
    Finds the spend feature and revenue target columns in the dataframe.
    """
    spend_col = None
    rev_col = None
    
    for c in df.columns:
        if c in SPEND_CANDIDATES:
            spend_col = c
            break
            
    for c in df.columns:
        if c in REVENUE_CANDIDATES:
            rev_col = c
            break
            
    if not spend_col or not rev_col:
        # Fallback to first two columns
        if len(df.columns) >= 2:
            return df.columns[0], df.columns[1]
        raise ValueError(f"Could not find spend/revenue columns in columns: {list(df.columns)}")
        
    return spend_col, rev_col


class AutoMLPipeline:
    @staticmethod
    def train_and_select(dataset_path: str, output_model_dir: str) -> Dict[str, Any]:
        """
        Trains baseline and tree models on the given dataset, selects the best model,
        and saves it to the model registry folder.
        """
        if not os.path.exists(dataset_path):
            raise FileNotFoundError(f"Dataset file {dataset_path} not found.")

        # Load dataset
        df = pd.read_csv(dataset_path)
        
        # Clean rows
        df = df.dropna().copy()
        
        spend_col, rev_col = parse_columns(df)
        
        # Convert Google Ads micros if needed
        X = df[[spend_col]].copy()
        if spend_col == "metrics_cost_micros":
            X[spend_col] = X[spend_col] / 1000000.0
            
        y = df[rev_col]
        
        # Train/test split
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        models = {
            "Linear Regression": LinearRegression(),
            "Random Forest": RandomForestRegressor(n_estimators=50, random_state=42)
        }
        
        if XGBRegressor:
            models["XGBoost"] = XGBRegressor(n_estimators=50, random_state=42)
        if LGBMRegressor:
            models["LightGBM"] = LGBMRegressor(n_estimators=50, random_state=42, verbose=-1)
        if CatBoostRegressor:
            models["CatBoost"] = CatBoostRegressor(iterations=50, random_state=42, verbose=0)

        # Dynamic imports for PyTorch deep models and FB Prophet
        try:
            from forecasting.deep_models import ProphetForecaster, PyTorchEstimator
            import torch
            from prophet import Prophet
        except ImportError:
            ProphetForecaster = None
            PyTorchEstimator = None
            torch = None
            Prophet = None

        if ProphetForecaster and Prophet:
            try:
                models["Prophet"] = ProphetForecaster()
            except Exception:
                pass
        if PyTorchEstimator and torch:
            try:
                models["LSTM"] = PyTorchEstimator("lstm")
                models["GRU"] = PyTorchEstimator("gru")
                models["Transformer"] = PyTorchEstimator("transformer")
            except Exception:
                pass
            
        best_model_name = None
        best_r2 = -float("inf")
        best_metrics = {}
        best_model_obj = None
        
        # Run training loop (AutoML Comparison)
        for name, model in models.items():
            try:
                model.fit(X_train, y_train)
                preds = model.predict(X_test)
                
                mse = float(mean_squared_error(y_test, preds))
                r2 = float(r2_score(y_test, preds))
                
                # Keep track of the best model based on R2
                if r2 > best_r2:
                    best_r2 = r2
                    best_model_name = name
                    best_model_obj = model
                    best_metrics = {
                        "algorithm": name,
                        "r2": r2,
                        "mse": mse,
                        "rmse": float(mse ** 0.5),
                        "features": [spend_col],
                        "target": rev_col,
                        "training_rows": len(df)
                    }
            except Exception:
                # If a specific library fails during fit/predict, fallback gracefully
                continue
                
        if not best_model_obj:
            raise RuntimeError("AutoML training failed for all algorithms.")
            
        # Serialize and save the best model
        os.makedirs(output_model_dir, exist_ok=True)
        model_version = f"v_{int(time.time())}"
        model_filename = f"{best_model_name.lower().replace(' ', '_')}_{model_version}.pkl"
        model_path = os.path.join(output_model_dir, model_filename)
        
        with open(model_path, "wb") as f:
            pickle.dump(best_model_obj, f)
            
        return {
            "name": best_model_name,
            "version": model_version,
            "metrics": best_metrics,
            "filepath": model_path,
            "status": "active"
        }
