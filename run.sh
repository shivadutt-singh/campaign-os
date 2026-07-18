#!/bin/bash
set -euo pipefail

# 1. Accept 3 positional arguments with default values
DATA_DIR="${1:-./data}"
MODEL_PATH="${2:-./pickle/model.pkl}"
OUTPUT_PATH="${3:-./output/predictions.csv}"

# 2. Run mkdir -p to ensure the output directory exists
OUTPUT_DIR=$(dirname "$OUTPUT_PATH")
mkdir -p "$OUTPUT_DIR"

# 3. Run pip install -r requirements.txt --quiet
pip install -r requirements.txt --quiet

# 4. Execute the new headless Python script
python python-engine/predict_headless.py --data-dir "$DATA_DIR" --model "$MODEL_PATH" --output "$OUTPUT_PATH"
