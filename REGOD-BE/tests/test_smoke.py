import importlib
import pytest


def test_import_main():
    mod = importlib.import_module("main")
    assert hasattr(mod, "app")


@pytest.mark.asyncio
async def test_health_endpoint(asgi_client):
    response = await asgi_client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data.get("status") == "healthy"

