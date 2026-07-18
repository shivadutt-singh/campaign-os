#!/usr/bin/env bash
# Yeh script strictly local testing aur Video Demo ke liye hai (Evaluators ise run nahi karenge)

echo "Starting CampaignOS Backend (API)..."
# Apne Python backend ko background mein start karo (adjust command if using something else)
cd python-engine
# Assuming FastAPI/Uvicorn is used for the backend
python -m uvicorn main:app --reload --port 8000 & 
cd ..

echo "Starting CampaignOS Frontend (Next.js)..."
# Next.js ko foreground mein start karo
npm run dev