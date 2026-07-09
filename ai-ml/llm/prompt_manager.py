import os
from typing import Any, Dict, Optional


class PromptManager:
    """
    Manages and versions LLM prompt templates, providing robust fallbacks if templates are missing.
    """

    DEFAULT_TEMPLATES = {
        "anomaly_insights": (
            "System instruction: You are a Lead Marketing Analyst.\n"
            "Analyze the following campaign metrics and detected anomalies:\n"
            "Metrics Summary:\n{metrics_summary}\n"
            "Anomalies:\n{anomalies}\n"
            "Provide a concise executive analysis of the root causes of these anomalies and specific, actionable recommendations."
        ),
        "explain_predictions": (
            "System instruction: You are a Lead Marketing Analyst explaining ML model projections.\n"
            "The model predicted a final revenue of ${predicted_revenue} with an ROI of {predicted_roi}.\n"
            "Feature importance breakdown (SHAP values):\n{shap_values}\n"
            "Please explain in plain English why the model projected this outcome and what features contributed most significantly."
        ),
        "decision_questions": (
            "System instruction: You are a Lead Marketing Analyst making capital allocation decisions.\n"
            "We have active campaigns: {campaigns_summary}\n"
            "Question: {question}\n"
            "Explain your reasoning and state your allocation recommendation clearly."
        )
    }

    @staticmethod
    def get_template(name: str, db_template: Optional[str] = None) -> str:
        """
        Loads the template by name. Uses database template if provided, else falls back to default.
        """
        if db_template:
            return db_template
        return PromptManager.DEFAULT_TEMPLATES.get(name, "{prompt}")

    @staticmethod
    def render(name: str, variables: Dict[str, Any], db_template: Optional[str] = None) -> str:
        """
        Renders a named template with variables.
        """
        template_str = PromptManager.get_template(name, db_template)
        try:
            return template_str.format(**variables)
        except KeyError as e:
            # Graceful error handling for missing keys
            return f"Prompt Template render error: missing key {str(e)} in template. raw variables: {variables}"
