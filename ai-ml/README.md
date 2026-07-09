# CampaignOS AI & Machine Learning Module

This directory contains the core intelligence, optimization engines, and time-series forecasting modules for the CampaignOS platform. It is packaged as a high-performance Python library imported directly by the FastAPI backend and scheduled Celery workers.

---

## 📂 Folder Structure

```
ai-ml/
├── README.md                 # This file
├── requirements.txt          # AI/ML specific libraries (numpy, scipy, pandas, torch, prophet)
├── .env.example              # ML/LLM specific environment configurations
├── optimization/             # Solver engines
│   ├── solver.py             # SLSQP and Genetic optimization algorithms
│   └── decision_engine.py    # Saturation curves and ROI threshold warning systems
├── forecasting/              # Predictors
│   ├── predictor.py          # Daily forecast simulators
│   └── deep_models.py        # PyTorch sequence forecasters (LSTM/GRU/Transformer) and Prophet
├── training/                 # AutoML scoring pipeline
│   └── pipeline.py           # Evaluates model performance across linear, tree, and deep networks
├── inference/                # Real-time score generators
│   └── pipeline.py           # Exposes inference queries to FastAPI endpoints
├── llm/                      # Prompt management
│   ├── provider.py           # Swappable LLM clients (Gemini, OpenAI, Anthropic, Groq, Ollama)
│   └── prompt_manager.py     # Versioned prompt string formats
├── embeddings/               # Local search indexing
│   └── cached_embedder.py    # SQLite-cached text vectorization
├── vector_store/             # Vector indexing
│   └── chroma_wrapper.py     # Local ChromaDB integration interface
├── recommendation/           # Decision helpers
│   └── engine.py             # Segmentations, Dayparting schedules, and creative suggestions
├── tests/                    # Pytest ML verification scripts
└── utils/                    # Data preparation and validation
    ├── drift.py              # Kolmogorov-Smirnov and PSI statistics
    ├── validation.py         # Pandera data boundary checkers
    └── report_generator.py   # Markdown executive reporter
```

---

## 📈 Supported AI/ML Models

Our AutoML system dynamically trains and compares **9 models** to select the champion architecture based on Mean Absolute Error (MAE) and R² metrics:

1.  **Linear Models**: Ridge Regression, Lasso.
2.  **Tree Ensembles**: XGBoost, LightGBM, CatBoost, Random Forest.
3.  **Bayesian Time-Series**: Facebook Prophet (seasonal decomposition).
4.  **Deep Sequence Networks**: PyTorch Long Short-Term Memory (LSTM), Gated Recurrent Unit (GRU).
5.  **Attention Networks**: PyTorch Sequence Transformer (Attention-based forecasting).

---

## ⚙️ Feature Engineering & Store

The **Feature Store** (`backend/app/core/feature_store.py` and `ai-ml/utils/validation.py`) automatically engineers rolling campaign indicators:
-   **Performance Metrics**: Click-Through Rate (CTR), Cost Per Click (CPC), Cost Per Acquisition (CPA), and Return on Ad Spend (ROAS).
-   **Trends**: 7-day and 30-day rolling moving averages.
-   **Seasonality**: Weekly seasonality indices using standard ratio-to-moving-average decompositions.
-   **Data Validation**: Prohibits anomalous inputs (e.g. clicks exceeding impressions, negative spend) before calculations.

---

## 🚀 Installation & Environment Setup

### 1. Setup Active Environment
```bash
# Navigate to ai-ml folder and load virtual env
cd ai-ml
python3.12 -m venv .venv
source .venv/bin/activate
```

### 2. Install Package Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. LLM API Key Configuration
Create a local config file inside `ai-ml`:
```bash
cp .env.example .env
```
Populate the API keys for the desired provider (e.g. `GEMINI_API_KEY`, `OPENAI_API_KEY`). If no keys are specified, the system gracefully falls back to a deterministic `FallbackTextProvider` to prevent server runtime exceptions.

---

## ⚡ Training & Execution Commands

### 1. Run AutoML Retraining Pipeline
Triggers model retraining, evaluates scores, compares them against current registry champions, and saves updated weights:
```bash
# Executing training pipeline
PYTHONPATH=. python3.12 training/pipeline.py
```

### 2. Run Data Drift Audit
Detects covariates shifts in incoming ad performance relative to baseline distributions:
```bash
# Run drift checker
PYTHONPATH=. python3.12 -c "from utils.drift import DriftMonitor; print(DriftMonitor.detect_data_drift([1,2,3,4,5], [1.1,2.0,3.1,4.0,4.9]))"
```

### 3. Run Inference Simulation
Simulates revenue projections on target ad-spend allocations:
```bash
# Run manual simulation check
PYTHONPATH=. python3.12 -c "from forecasting.predictor import SimulationEngine; print(SimulationEngine.simulate({'Google Ads': 10000.0}))"
```

---

## 🧠 LLM Providers & RAG Architecture

The platform supports a swappable interface to leverage LLM APIs:
-   **Providers**: Google Gemini, OpenAI, Anthropic Claude, Groq, OpenRouter, and local Ollama nodes.
-   **RAG Engine** (`rag/engine.py`): Performs semantic lookup inside a local vector database, injecting relevant campaign history into prompts.
-   **Embeddings Cache** (`embeddings/cached_embedder.py`): Stores text vector hashes inside a local SQLite DB (`embeddings_cache.db`) to avoid repeated network requests.

---

## 🔧 Troubleshooting FAQ

### 1. `ImportError: libomp.dylib not found (LightGBM/XGBoost)`
**Cause**: The tree-based ensembles require OpenMP for multithreading on macOS.
**Solution**: Run `brew install libomp` to install it.

### 2. PyTorch memory leaks or CUDA/GPU issues
**Cause**: Deep learning models are attempting to run on CUDA devices which are absent or misconfigured on the host.
**Solution**: Our PyTorch modules check `torch.cuda.is_available()` and automatically fall back to `cpu` execution. No manual toggles are needed.
