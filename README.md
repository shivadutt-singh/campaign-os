# CampaignOS - Enterprise AI Marketing Intelligence Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io)
[![Celery](https://img.shields.io/badge/celery-%2337814A.svg?style=for-the-badge&logo=celery&logoColor=white)](https://docs.celeryq.dev)
[![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com)

**CampaignOS** is an enterprise-grade Micro-SaaS platform that automates complex digital marketing workflows with Applied Artificial Intelligence. It leverages a decoupled, multi-container architecture containing a Next.js client, a high-performance FastAPI server, async database queries, background workers, dynamic time-series forecasting, and budget optimization solvers.

---

## 📖 Detailed Sub-Guides

For deep-dive documentation, please consult the dedicated READMEs:
*   📚 **[Backend Developer Guide](file:///Users/shanipratapsingh/Downloads/campaign-os/backend/README.md)**: DB Schema, REST Endpoints, OAuth2, Caching, background Celery tasks, and Swagger.
*   🧠 **[AI/ML Engineering Guide](file:///Users/shanipratapsingh/Downloads/campaign-os/ai-ml/README.md)**: AutoML pipeline, SLSQP & Genetic Solvers, LLM integrations, cached embeddings, vector stores, RAG, and drift audits.

---

## 🏗️ System Architecture

CampaignOS uses a multi-tier microservice architecture:

```mermaid
graph TD
    Client[Next.js Frontend] -->|API Proxy| Gateway[Next.js API Gateway]
    Gateway -->|HTTP proxy on port 80| Nginx[Nginx Reverse Proxy]
    Nginx -->|Route API| Backend[FastAPI Backend]
    Backend -->|Async Engine| DB[(PostgreSQL Database)]
    Backend -->|Read/Write Session| Redis[(Redis Cache / Rate Limiter)]
    Backend -->|Trigger Jobs| Celery[Celery Tasks worker]
    Celery -->|Queue broker| RabbitMQ[(RabbitMQ Broker)]
    Celery -->|Evaluate Models| AIML[AI/ML Core Solver/Predictor]
    AIML -->|Embeddings cache| SQLite[(SQLite Embeddings Cache)]
    AIML -->|Vector retrieve| Chroma[(ChromaDB persistent store)]
```

---

## 📁 Repository Structure

```
.
├── backend/                  # FastAPI web server, async database, models, Celery tasks
│   ├── app/                  # REST routers, security modules, database configuration
│   ├── migrations/           # Alembic async migration files
│   └── README.md             # Backend Developer Guide
│
├── ai-ml/                    # Machine Learning modeling, forecasting, RAG, vector store
│   ├── optimization/         # SLSQP & Genetic Algorithm budget allocators
│   ├── forecasting/          # Time-series projection models
│   ├── rag/                  # Chunking and semantic retrieval
│   └── README.md             # AI Engineering Guide
│
├── nginx/                    # Production reverse proxy configuration
├── Dockerfile                # Frontend Next.js production build file
└── docker-compose.yml        # Orchestrates the multi-container architecture
```

---

## ✨ Features

*   🔐 **Enterprise Auth**: Stateless JWT, secure password hashing, refresh tokens, role-based controls (Admin, Manager, Viewer).
*   🚀 **Budget Optimization**: Computes optimal allocations using continuous SLSQP programming and tourney selection Genetic Algorithms.
*   📈 **Time-Series Forecasting**: Simulates dynamic 10-day budget returns under logistical diminishing return metrics.
*   🧠 **LLM & RAG Integration**: Embeddings-cached retrieval over ad copy guidelines via ChromaDB and Gemini/OpenAI interfaces.
*   ⚙️ **Background AutoML Pipeline**: Schedules parallel training compared across Random Forest, XGBoost, and linear models using Celery.
*   📊 **Monitoring & Drift**: Live Prometheus scrapers, health probes, Kolmogorov-Smirnov data drift tests, and PSI prediction drift audits.

---

## 🛠️ Tech Stack

*   **Frontend**: Next.js 16, React 19, Tailwind CSS, Recharts
*   **Backend**: FastAPI, Python 3.12, SQLAlchemy 2.0 Async, Alembic, Gunicorn
*   **Databases**: PostgreSQL (Relational), Redis (Cache & Rate-limiting), ChromaDB (Vector)
*   **Task Queue**: Celery, RabbitMQ Broker
*   **Deployment**: Docker, Docker Compose, Nginx

---

## ⚙️ Prerequisites

- **Node.js**: version `20+` (NPM version `10+`)
- **Python**: version `3.12+` (PIP version `23+`)
- **PostgreSQL**: version `15+` (Asyncpg support)
- **Redis**: version `7.0+`
- **RabbitMQ**: version `3.10+`
- **Docker & Compose**: version `20.10+` (Compose `v2.20+`)

---

## 🔧 Environment Variables Reference

Create a `.env` file at the root. The following parameters configure the application:

```env
# Next.js Server config
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/campaignos"
NEXT_PUBLIC_API_URL="http://localhost:8000/api/v1"

# FastAPI Backend Settings
PROJECT_NAME="CampaignOS Enterprise Platform"
SECRET_KEY="super-secret-key-to-change-in-production-environments-use-openssl-rand-hex-32"
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# DB Parameters (PostgreSQL)
POSTGRES_SERVER=localhost
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=campaignos
POSTGRES_PORT=5432

# Redis Cache / Rate Limiting
REDIS_HOST=localhost
REDIS_PORT=6379

# RabbitMQ Message Broker Configuration
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest

# Seed Parameters (Initial Superuser)
FIRST_SUPERUSER_EMAIL=admin@campaignos.com
FIRST_SUPERUSER_PASSWORD=AdminCampaignOS123!

# LLM APIs Configuration Keys
GEMINI_API_KEY=""
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""
GROQ_API_KEY=""
OPENROUTER_API_KEY=""
OLLAMA_HOST="http://localhost:11434"
```

---

## 📦 Running the Complete Project (Step-by-Step)

Follow this sequence to launch the entire multi-container environment or run it locally:

### Option A: Quick Start via Docker Compose (Recommended)

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/shivadutt-singh/campaign-os.git
    cd campaign-os
    ```
2.  **Configure Environment**:
    ```bash
    cp .env.example .env
    ```
3.  **Launch All Containers**:
    ```bash
    docker compose up --build -d
    ```
4.  **Confirm Running Ports**:
    - Frontend Interface: [http://localhost/](http://localhost/)
    - Backend Swagger: [http://localhost:8000/docs](http://localhost:8000/docs)
    - RabbitMQ Console: [http://localhost:15672/](http://localhost:15672/) (guest/guest)

---

### Option B: Local Native Development Configuration

If running without Docker, follow this multi-shell setup sequence:

#### Shell 1: Databases, Caches & Message Brokers
Ensure your local system services are active:
```bash
# macOS (Homebrew)
brew services start postgresql@15
brew services start redis
brew services start rabbitmq

# Linux (systemd)
sudo systemctl start postgresql
sudo systemctl start redis-server
sudo systemctl start rabbitmq-server
```

#### Shell 2: Alembic Migrations & FastAPI REST Server
Navigate to `/backend`, set up virtual environment, install requirements, run migrations, and start Uvicorn:
```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
PYTHONPATH=. uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Shell 3: Celery Background Task Workers
Start the background worker in a separate terminal:
```bash
cd backend
source .venv/bin/activate
PYTHONPATH=.:../ai-ml celery -A app.core.celery_app worker --loglevel=info
```

#### Shell 4: Next.js Frontend Development
Install frontend dependencies and start development server:
```bash
# From root folder
npm install
npm run dev
```

---

## 🖼️ Screenshots

| Campaign Dashboard | Budget Optimizer Slider |
| :---: | :---: |
| ![Dashboard Placeholder](https://via.placeholder.com/600x350.png?text=CampaignOS+Dashboard) | ![Optimizer Slider](https://via.placeholder.com/600x350.png?text=Budget+Optimization+Slider) |

---

## 🤝 Contributing
Contributions are welcome. Please read our guidelines and check tests before submitting pull requests.

## 📄 License
This project is licensed under the Apache 2.0 License.
