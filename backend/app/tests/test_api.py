from fastapi.testclient import TestClient


def test_read_root(client: TestClient):
    response = client.get("/")
    assert response.status_code == 200
    assert "Welcome" in response.json()["message"]


def test_health_check(client: TestClient):
    # This might return 503 if Postgres/Redis are not running during test, but we can verify it returns JSON
    response = client.get("/api/v1/health/")
    assert response.status_code in [200, 503]
    assert "status" in response.json() or "detail" in response.json()


def test_optimize_endpoint(client: TestClient):
    # Tests the standard $100,000 baseline compliance logic in the engine
    response = client.post(
        "/api/v1/optimize/",
        json={"targetRevenue": 100000}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["target_revenue"] == 100000
    assert data["total_recommended_budget"] == 24500
    assert "google_ads" in data["allocations"]


def test_simulate_endpoint(client: TestClient):
    response = client.post(
        "/api/v1/simulate/",
        json={"Google Ads": 10000, "Facebook Ads": 5000}
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "Expected_Revenue" in data[0]
    assert "Date" in data[0]
