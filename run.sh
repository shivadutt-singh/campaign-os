#!/bin/bash

# Exit immediately if any command exits with a non-zero status
set -e

echo "=== Automated Hackathon Test Environment Bootstrapper ==="

# Initialize process variable for trap
PYTHON_PID=""

# Graceful cleanup function to terminate background processes on exit
cleanup() {
  echo ""
  echo "=== Handling shutdown signal ==="
  if [ -n "$PYTHON_PID" ]; then
    echo "Stopping Python backend server (PID: $PYTHON_PID)..."
    kill "$PYTHON_PID" 2>/dev/null || true
    # Wait for the process to exit to prevent zombie processes
    wait "$PYTHON_PID" 2>/dev/null || true
    echo "Python backend server stopped."
  fi
  echo "Cleanup completed. Exiting."
  exit 0
}

# Trap termination signals
trap cleanup SIGINT SIGTERM

# 1. Non-destructive Environment Configuration Check
if [ ! -f .env ]; then
  echo "No existing .env file found. Creating default configuration..."
  echo "DATABASE_URL=\"file:./dev.db\"" > .env
else
  echo ".env file already exists. Skipping creation to prevent overwriting."
fi

# 2. Install Node dependencies
echo "Installing Node.js dependencies..."
npm install

# 3. Install Python dependencies
if [ -f "python-engine/requirements.txt" ]; then
  echo "Installing Python dependencies from python-engine/requirements.txt..."
  pip install -r python-engine/requirements.txt
else
  echo "Warning: python-engine/requirements.txt not found. Skipping pip install."
fi

# 4. Generate the Prisma client
echo "Generating Prisma client..."
npx prisma generate

# 5. Run safe Prisma migrations
# npx prisma migrate deploy applies pending migrations to the SQLite DB without dropping data
echo "Applying database migrations (non-destructive)..."
npx prisma migrate deploy

# 6. Start the Python server in the background (&) on port 8000
echo "Starting Python backend server in background on port 8000..."
if [ -d "python-engine" ]; then
  cd python-engine
  if [ -f "main.py" ]; then
    python main.py --port 8000 &
    PYTHON_PID=$!
  elif [ -f "app.py" ]; then
    python app.py --port 8000 &
    PYTHON_PID=$!
  else
    # Fallback to running module via uvicorn if files aren't directly executable main scripts
    python -m uvicorn main:app --host 0.0.0.0 --port 8000 &
    PYTHON_PID=$!
  fi
  cd ..
else
  # General fallback if python-engine directory is missing locally, but might be present in the container
  python -m uvicorn main:app --host 0.0.0.0 --port 8000 &
  PYTHON_PID=$!
fi

# Give the Python server a couple of seconds to boot up and verify it is running
sleep 2
if ps -p $PYTHON_PID > /dev/null; then
  echo "Python server started successfully in background (PID: $PYTHON_PID)."
else
  echo "Warning: Python server failed to start or exited immediately."
fi

# 7. Build the Next.js app
echo "Building Next.js application..."
npm run build

# 8. Start the Next.js production server
echo "Starting Next.js production server..."
# Executing npm start directly keeps it in the foreground to keep the container/environment alive
npm start
