import pandas as pd
from typing import List, Tuple, Dict, Any


class DatasetValidationError(ValueError):
    """Exception raised when dataset schema validation fails."""
    pass


class DatasetValidator:
    """
    Pandera-style structural and logical schema validator for marketing datasets.
    """

    REQUIRED_COLS = ["date", "spend", "revenue"]
    OPTIONAL_COLS = ["clicks", "impressions", "conversions"]

    @staticmethod
    def validate(df: pd.DataFrame) -> Tuple[bool, List[str]]:
        """
        Validates columns, null counts, numeric bounds, and date parsing consistency.
        Returns a tuple (is_valid, list_of_error_strings).
        """
        errors = []

        # 1. Structural checks
        cols = [c.lower() for c in df.columns]
        missing_required = [c for c in DatasetValidator.REQUIRED_COLS if c not in cols]
        if missing_required:
            errors.append(f"Missing required columns: {missing_required}")
            return False, errors

        # Normalize column cases to lower for validation checks
        df_norm = df.copy()
        df_norm.columns = [c.lower() for c in df_norm.columns]

        # 2. Date parsing check
        try:
            pd.to_datetime(df_norm["date"])
        except Exception:
            errors.append("Column 'date' contains invalid or non-ISO parseable datetime format.")

        # 3. Numeric bounds validation
        numeric_cols = ["spend", "revenue"] + [c for c in DatasetValidator.OPTIONAL_COLS if c in df_norm.columns]
        for col in numeric_cols:
            try:
                df_norm[col] = pd.to_numeric(df_norm[col])
            except Exception:
                errors.append(f"Column '{col}' must be numeric, found invalid string characters.")
                continue

            # No negative values
            if (df_norm[col] < 0).any():
                neg_count = (df_norm[col] < 0).sum()
                errors.append(f"Column '{col}' contains {neg_count} negative entries; spend, revenue, clicks, and conversion metrics must be positive.")

        # 4. Logical assertions
        if "clicks" in df_norm.columns and "impressions" in df_norm.columns:
            # CTR check: clicks should not exceed impressions
            if (df_norm["clicks"] > df_norm["impressions"]).any():
                invalid_rows = (df_norm["clicks"] > df_norm["impressions"]).sum()
                errors.append(f"Logical error: 'clicks' exceeds 'impressions' on {invalid_rows} records.")

        is_valid = len(errors) == 0
        return is_valid, errors
